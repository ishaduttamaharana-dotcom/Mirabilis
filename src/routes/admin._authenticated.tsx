import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-store";
import { AdminShell } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/admin/_authenticated")({
  component: RequireAdmin,
});

/**
 * Every /admin/* page except login/forgot-password/reset-password is a
 * child of this pathless layout. It's the single enforcement point for
 * "must be logged in to see this" on the frontend — the real authorization
 * boundary is still server-side RBAC on every admin API route (security.md);
 * this only controls what the SPA renders.
 */
function RequireAdmin() {
  const { status, bootstrap } = useAuth();
  const navigate = useNavigate();
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (!bootstrapped.current && status === "idle") {
      bootstrapped.current = true;
      bootstrap();
    }
  }, [status, bootstrap]);

  useEffect(() => {
    if (status === "unauthenticated") {
      navigate({ to: "/admin/login" });
    }
  }, [status, navigate]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (status !== "authenticated") {
    return null; // redirect effect above is already firing
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
