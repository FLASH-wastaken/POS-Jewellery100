import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 })

  // Clear auth cookies
  response.cookies.set("accessToken", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  })

  response.cookies.set("refreshToken", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  })

  return response
}
