"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const schema = z.object({
  email: z.string().email("Invalid email address"),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [isPending, setIsPending] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormValues) {
    setIsPending(true)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    setIsPending(false)
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
      toast.success("Check your email for a reset link.")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>
            {sent ? "Reset link sent. Check your inbox." : "Enter your email and we'll send you a reset link."}
          </CardDescription>
        </CardHeader>
        {!sent && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" {...register("email")} disabled={isPending} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Sending..." : "Send reset link"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">Back to sign in</Link>
              </p>
            </CardFooter>
          </form>
        )}
        {sent && (
          <CardFooter>
            <Link href="/sign-in" className="w-full">
              <Button variant="outline" className="w-full">Back to sign in</Button>
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
