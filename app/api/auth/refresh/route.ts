import { type NextRequest, NextResponse } from "next/server"
import { verifyRefreshToken, generateTokens } from "@/lib/auth/token"

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token found" }, { status: 401 })
    }

    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 })
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload.userId, payload.email)

    const response = NextResponse.json({ accessToken }, { status: 200 })

    // Update both cookies
    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    })

    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[v0] Token refresh error:", error)
    return NextResponse.json({ error: "An error occurred during token refresh" }, { status: 500 })
  }
}
