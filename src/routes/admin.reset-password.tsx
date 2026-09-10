import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AdminResetPasswordForm } from "@/components/admin/admin-reset-password-form";

export const Route = createFileRoute("/admin/reset-password")({
  validateSearch: z.object({ token: z.string().optional() }),
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  const { token } = Route.useSearch();
  return <AdminResetPasswordForm token={token ?? ""} />;
}
