import { createFileRoute } from "@tanstack/react-router";
import { AdminActivityLogPage } from "@/components/admin/admin-activity-log-page";

export const Route = createFileRoute("/admin/_authenticated/activity-log")({
  component: AdminActivityLogPage,
});
