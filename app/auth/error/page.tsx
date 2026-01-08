import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-50 p-6">
      <div className="w-full max-w-md">
        <Card className="border-red-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-900">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {params?.error ? (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                Error: {params.error}
              </p>
            ) : (
              <p className="text-sm text-red-700">An unspecified error occurred.</p>
            )}
            <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-white">
              <Link href="/auth/login">Return to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
