import { createFileRoute } from "@tanstack/react-router";
import { AdminCollectionPage } from "@/components/admin/collection-crud-page";
import { findCollectionConfig } from "@/lib/admin/collections";

const config = findCollectionConfig("gallery")!;

export const Route = createFileRoute("/admin/_authenticated/gallery")({
  component: () => <AdminCollectionPage config={config} />,
});
