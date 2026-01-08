import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-50 p-6">
      <div className="w-full max-w-md">
        <Card className="border-amber-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-amber-900">Check your email</CardTitle>
            <CardDescription className="text-amber-700">We&apos;ve sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-amber-800">
              You&apos;ve successfully signed up. Please check your email to confirm your account before signing in.
            </p>
            <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-white">
              <Link href="/auth/login">Return to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
