import { createFileRoute } from "@tanstack/react-router";
import { AdminMediaPage } from "@/components/admin/admin-media-page";

export const Route = createFileRoute("/admin/_authenticated/media")({
  component: AdminMediaPage,
});
