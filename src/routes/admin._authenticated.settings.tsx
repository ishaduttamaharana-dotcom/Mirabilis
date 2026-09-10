import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsPage } from "@/components/admin/admin-settings-page";

export const Route = createFileRoute("/admin/_authenticated/settings")({
  component: AdminSettingsPage,
});
