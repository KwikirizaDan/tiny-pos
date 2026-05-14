import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthCodeErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Authentication error</CardTitle>
          <CardDescription>
            The sign-in link is invalid or has expired. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This can happen if the link was already used or if it expired. Request a new one below.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/sign-in" className="w-full">
            <Button className="w-full">Back to sign in</Button>
          </Link>
          <Link href="/forgot-password" className="w-full">
            <Button variant="outline" className="w-full">Resend reset link</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
