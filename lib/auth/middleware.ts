import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/auth/token"

/**
 * Verify and attach token payload to request
 */
export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const token = request.cookies.get("accessToken")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 })
    }

    const payload = verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 })
    }

    // Attach payload to request for use in handler
    const headers = new Headers(request.headers)
    headers.set("x-user-id", payload.userId)
    headers.set("x-user-email", payload.email)

    const newRequest = new NextRequest(request, { headers })
    return handler(newRequest)
  }
}
