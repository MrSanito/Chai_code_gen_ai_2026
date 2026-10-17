import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const name = `${firstName || ""} ${lastName || ""}`.trim() || email.split("@")[0];

    // Dummy registration response
    // Replace with your Prisma / Database logic (e.g. db.orm.public.User.create)
    return NextResponse.json({
      success: true,
      message: "Registration successful (Dummy API)",
      user: {
        id: 1,
        email: email.toLowerCase().trim(),
        name,
        firstName: firstName || "",
        lastName: lastName || "",
      },
      token: "dummy_jwt_token_for_" + Buffer.from(email).toString("base64"),
    });
  } catch (error: any) {
    console.error("[DUMMY_REGISTER_API] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register" },
      { status: 500 }
    );
  }
}
