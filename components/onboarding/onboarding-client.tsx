"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createStore } from "@/app/onboarding/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const CURRENCIES = ["UGX", "USD", "KES", "TZS", "EUR", "GBP"]

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
}

export function OnboardingClient() {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [storeName, setStoreName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [slugEdited, setSlugEdited] = React.useState(false)
  const [step, setStep] = React.useState<1 | 2>(1)

  function handleStoreNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setStoreName(val)
    if (!slugEdited) setSlug(toSlug(val))
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugEdited(true)
    setSlug(toSlug(e.target.value))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isPending) return
    setError(null)
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    const result = await createStore(formData)
    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
    // On success, server action calls redirect() so nothing else needed
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`h-1.5 flex-1 transition-colors ${step >= 1 ? "bg-primary" : "bg-border"}`} />
          <div className={`h-1.5 flex-1 transition-colors ${step >= 2 ? "bg-primary" : "bg-border"}`} />
        </div>

        <Card>
          <CardHeader className="pb-6 pt-8 px-8">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
              Step {step} of 2
            </p>
            <CardTitle className="text-3xl">
              {step === 1 ? "Name your store" : "Store details"}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {step === 1
                ? "This is what your customers and staff will see."
                : "Optional details — you can update these later in Settings."}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-6 px-8 pb-8">
              {step === 1 && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="storeName">Store name</Label>
                    <Input
                      id="storeName"
                      name="storeName"
                      placeholder="Kampala General Store"
                      value={storeName}
                      onChange={handleStoreNameChange}
                      required
                      minLength={2}
                      autoFocus
                      className="h-11"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="slug">Store URL</Label>
                    <div className="flex items-center border border-input overflow-hidden">
                      <span className="px-3 h-11 flex items-center text-sm text-muted-foreground bg-muted border-r border-input select-none whitespace-nowrap">
                        tinypos.app/
                      </span>
                      <Input
                        id="slug"
                        name="slug"
                        placeholder="kampala-store"
                        value={slug}
                        onChange={handleSlugChange}
                        className="border-0 focus-visible:ring-0 h-11"
                        required
                        minLength={2}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lowercase letters, numbers, and hyphens only.
                    </p>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button
                    type="button"
                    className="w-full h-11 mt-2"
                    disabled={!storeName.trim() || !slug.trim()}
                    onClick={() => { setError(null); setStep(2) }}
                  >
                    Continue
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <input type="hidden" name="storeName" value={storeName} />
                  <input type="hidden" name="slug" value={slug} />

                  <div className="grid gap-2">
                    <Label htmlFor="phone">
                      Phone number <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+256 700 000000" className="h-11" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address">
                      Address <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input id="address" name="address" placeholder="Plot 12, Kampala Road" className="h-11" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      name="currency"
                      defaultValue="UGX"
                      className="h-11 w-full border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="flex gap-3 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-11"
                      onClick={() => setStep(1)}
                      disabled={isPending}
                    >
                      Back
                    </Button>
                    <Button type="submit" className="flex-1 h-11" disabled={isPending}>
                      {isPending ? "Creating store..." : "Create store"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          TinyPOS — Uganda's simplest point of sale
        </p>
      </div>
    </div>
  )
}
