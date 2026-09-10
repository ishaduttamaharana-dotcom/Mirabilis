import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // The backend intentionally responds identically whether or not the
      // email matched an account (no email-enumeration leakage) — so the
      // UI shows the same success state either way.
      await api.post("/auth/forgot-password", { email });
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            {sent
              ? "If that email matches an account, a reset link is on its way."
              : "Enter your admin email and we'll send a reset link."}
          </CardDescription>
        </CardHeader>
        {!sent && (
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Sending…" : "Send reset link"}
              </Button>
              <div className="text-center">
                <Link to="/admin/login" className="text-sm text-muted-foreground hover:underline">
                  Back to sign in
                </Link>
              </div>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
