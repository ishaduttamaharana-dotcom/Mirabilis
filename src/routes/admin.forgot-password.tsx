import { createFileRoute } from "@tanstack/react-router";
import { AdminForgotPasswordForm } from "@/components/admin/admin-forgot-password-form";

export const Route = createFileRoute("/admin/forgot-password")({
  component: AdminForgotPasswordForm,
});
