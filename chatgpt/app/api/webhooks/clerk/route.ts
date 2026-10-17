import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/src/prisma/db';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    timestamp: Date.now(),
    nodeEnv: process.env.NODE_ENV,
    hasSecret: !!process.env.CLERK_WEBHOOK_SECRET,
  });
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  const rawBody = await req.text();

  // 1. Verify Svix signature if secret and headers are provided
  if (WEBHOOK_SECRET && svix_id && svix_timestamp && svix_signature) {
    try {
      const wh = new Webhook(WEBHOOK_SECRET);
      wh.verify(rawBody, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
      console.log('[CLERK_WEBHOOK] ✅ Svix signature verified successfully!');
    } catch (err: any) {
      console.warn(
        '[CLERK_WEBHOOK] ⚠️ Svix verification failed:',
        err.message,
        '\n(Check if CLERK_WEBHOOK_SECRET in .env matches the Signing Secret for this endpoint in Clerk Dashboard)'
      );

      // In production, reject invalid signatures
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'Invalid webhook signature' },
          { status: 400 }
        );
      }
      console.log('[CLERK_WEBHOOK] Dev mode: Continuing despite signature verification failure.');
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.error('[CLERK_WEBHOOK] Missing CLERK_WEBHOOK_SECRET or Svix headers in production.');
    return NextResponse.json(
      { success: false, error: 'Missing webhook secret or Svix headers' },
      { status: 400 }
    );
  }

  // 2. Parse the verified payload JSON
  let evt: WebhookEvent;
  try {
    evt = JSON.parse(rawBody) as WebhookEvent;
  } catch (err: any) {
    console.error('[CLERK_WEBHOOK] JSON parse error:', err.message);
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  if (!evt || !evt.type) {
    console.warn('[CLERK_WEBHOOK] No event type detected in parsed payload');
    return NextResponse.json(
      { success: false, error: 'No event type detected' },
      { status: 400 }
    );
  }

  const eventType = evt.type;
  console.log(`[CLERK_WEBHOOK] Received event: ${eventType}`);

  try {
    // 3. Handle User Registration (user.created)
    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      // Primary email or fallback for Clerk mock test events with empty email_addresses []
      const email =
        email_addresses?.[0]?.email_address?.toLowerCase().trim() ||
        `${id}@clerk.test`;

      const firstName = first_name || '';
      const lastName = last_name || '';
      const name = `${firstName} ${lastName}`.trim() || email.split('@')[0];
      const imgUrl = image_url || null;

      // Check if user already exists by clerkId or email
      const existingUser =
        (await db.orm.public.User.where({ clerkId: id }).first()) ||
        (await db.orm.public.User.where({ email }).first());

      if (existingUser) {
        console.log(`[CLERK_WEBHOOK] User already exists in database: ${email}`);
        await db.orm.public.User.where({ id: existingUser.id }).update({
          clerkId: id,
          name: name || existingUser.name,
          imgUrl: imgUrl || existingUser.imgUrl,
        });

        return NextResponse.json({
          success: true,
          message: 'User already exists, record updated',
          user: existingUser,
        });
      }

      // Create new user in PostgreSQL matching Prisma 8 schema
      const newUser = await db.orm.public.User.create({
        clerkId: id,
        email,
        name,
        imgUrl,
      });

      console.log(
        `[CLERK_WEBHOOK] Successfully created user in PostgreSQL: ${email} (Clerk ID: ${id})`
      );

      return NextResponse.json({
        success: true,
        message: 'User registered and synchronized to PostgreSQL',
        user: newUser,
      });
    }

    // 4. Handle User Login / Session Created (session.created)
    if (eventType === 'session.created') {
      const { user_id, user: sessionUser } = evt.data as any;
      console.log(`[CLERK_WEBHOOK] User login session started for Clerk ID: ${user_id}`);

      // Ensure user exists in DB even if user.created was bypassed (e.g. OAuth logins)
      if (sessionUser) {
        const id = sessionUser.id || user_id;
        const email =
          sessionUser.email_addresses?.[0]?.email_address?.toLowerCase().trim() ||
          `${id}@clerk.test`;
        const firstName = sessionUser.first_name || '';
        const lastName = sessionUser.last_name || '';
        const name = `${firstName} ${lastName}`.trim() || email.split('@')[0];
        const imgUrl = sessionUser.image_url || null;

        const existingUser =
          (await db.orm.public.User.where({ clerkId: id }).first()) ||
          (await db.orm.public.User.where({ email }).first());

        if (existingUser) {
          await db.orm.public.User.where({ id: existingUser.id }).update({
            clerkId: id,
            name: name || existingUser.name,
            imgUrl: imgUrl || existingUser.imgUrl,
          });
          console.log(`[CLERK_WEBHOOK] session.created updated existing user: ${email}`);
        } else {
          await db.orm.public.User.create({
            clerkId: id,
            email,
            name,
            imgUrl,
          });
          console.log(`[CLERK_WEBHOOK] session.created created user: ${email} (Clerk ID: ${id})`);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Session login event recorded and user synced to DB',
        userId: user_id,
      });
    }

    // 5. Handle User Profile Updates (user.updated)
    if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const email = email_addresses?.[0]?.email_address?.toLowerCase().trim();

      const existingUser =
        (await db.orm.public.User.where({ clerkId: id }).first()) ||
        (email ? await db.orm.public.User.where({ email }).first() : null);

      if (existingUser) {
        const firstName = first_name || '';
        const lastName = last_name || '';
        const name = `${firstName} ${lastName}`.trim() || existingUser.name;

        await db.orm.public.User.where({ id: existingUser.id }).update({
          clerkId: id,
          name,
          imgUrl: image_url || existingUser.imgUrl,
          ...(email ? { email } : {}),
        });

        console.log(`[CLERK_WEBHOOK] Successfully updated user: ${email || id}`);
      }

      return NextResponse.json({
        success: true,
        message: 'User update processed',
      });
    }

    // 6. Handle User Deletion (user.deleted)
    if (eventType === 'user.deleted') {
      const { id } = evt.data;
      if (id) {
        const existing = await db.orm.public.User.where({ clerkId: id }).first();
        if (existing) {
          await db.orm.public.User.where({ id: existing.id }).delete();
          console.log(`[CLERK_WEBHOOK] Deleted user from DB for Clerk ID: ${id}`);
        }
      }
      return NextResponse.json({
        success: true,
        message: 'User deletion recorded',
      });
    }

    // Acknowledge other event types
    return NextResponse.json({
      success: true,
      message: `Event ${eventType} received and acknowledged`,
    });
  } catch (dbError: any) {
    console.error('[CLERK_WEBHOOK] Database operation error:', dbError);
    return NextResponse.json(
      {
        success: false,
        error: dbError?.message || 'Database error processing webhook',
      },
      { status: 500 }
    );
  }
}
