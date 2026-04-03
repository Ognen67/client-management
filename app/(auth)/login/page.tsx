"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart3, Mail } from "lucide-react"

type Mode = "password" | "magic-link"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const supabase = getSupabaseBrowserClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === "magic-link") {
        const { error: authError } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
        })
        if (authError) throw authError
        setMagicLinkSent(true)
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (authError) throw authError
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Mail className="size-6" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a sign-in link to <strong>{email}</strong>
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => { setMagicLinkSent(false); setError(null) }}
        >
          Use a different email
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-1">
          <BarChart3 className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Vx Coach Tracker</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to manage client health scores
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@vxgroup.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        {mode === "password" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}

        <Button type="submit" disabled={loading} className="mt-1">
          {loading && <Spinner data-icon="inline-start" />}
          {mode === "password" ? "Sign in" : "Send magic link"}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "password" ? "magic-link" : "password")}
        >
          {mode === "password"
            ? "Sign in with a magic link instead"
            : "Sign in with password instead"}
        </button>
      </div>
    </div>
  )
}
