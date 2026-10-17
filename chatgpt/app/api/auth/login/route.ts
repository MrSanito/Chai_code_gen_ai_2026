import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Dummy authentication response
    // Replace with your Prisma / Database logic (e.g. db.orm.public.User)
    return NextResponse.json({
      success: true,
      message: "Login successful (Dummy API)",
      user: {
        id: 1,
        email: email.toLowerCase().trim(),
        name: email.split("@")[0],
      },
      token: "dummy_jwt_token_for_" + Buffer.from(email).toString("base64"),
    });
  } catch (error: any) {
    console.error("[DUMMY_LOGIN_API] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log in" },
      { status: 500 }
    );
  }
}
