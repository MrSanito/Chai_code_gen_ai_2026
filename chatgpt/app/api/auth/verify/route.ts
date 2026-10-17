import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { code, email } = await req.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Verification code is required" },
        { status: 400 }
      );
    }

    // Dummy verification response
    return NextResponse.json({
      success: true,
      message: "Verification successful (Dummy API)",
      verified: true,
      email: email || "user@example.com",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}
