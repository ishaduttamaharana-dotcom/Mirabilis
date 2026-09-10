import { createFileRoute } from "@tanstack/react-router";
import { AdminCollectionPage } from "@/components/admin/collection-crud-page";
import { findCollectionConfig } from "@/lib/admin/collections";

const config = findCollectionConfig("statistics")!;

export const Route = createFileRoute("/admin/_authenticated/statistics")({
  component: () => <AdminCollectionPage config={config} />,
});
