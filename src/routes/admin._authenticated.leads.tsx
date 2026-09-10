import { createFileRoute } from "@tanstack/react-router";
import { AdminLeadsPage } from "@/components/admin/admin-leads-page";

export const Route = createFileRoute("/admin/_authenticated/leads")({
  component: AdminLeadsPage,
});
