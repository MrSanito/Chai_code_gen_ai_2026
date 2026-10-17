import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    return NextResponse.json({
      success: true,
      message: "Google OAuth sign-in successful (Dummy API)",
      user: {
        id: "google_dummy_1",
        email: "google.user@example.com",
        name: "Google Demo User",
        avatar: "https://lh3.googleusercontent.com/a/default-user",
      },
      token: "dummy_google_jwt_token_12345",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Google auth failed" },
      { status: 500 }
    );
  }
}
