import { createFileRoute } from "@tanstack/react-router";
import { AdminCollectionPage } from "@/components/admin/collection-crud-page";
import { findCollectionConfig } from "@/lib/admin/collections";

const config = findCollectionConfig("clients")!;

export const Route = createFileRoute("/admin/_authenticated/clients")({
  component: () => <AdminCollectionPage config={config} />,
});
