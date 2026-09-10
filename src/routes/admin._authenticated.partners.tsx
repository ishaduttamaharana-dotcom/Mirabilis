import { createFileRoute } from "@tanstack/react-router";
import { AdminCollectionPage } from "@/components/admin/collection-crud-page";
import { findCollectionConfig } from "@/lib/admin/collections";

const config = findCollectionConfig("partners")!;

export const Route = createFileRoute("/admin/_authenticated/partners")({
  component: () => <AdminCollectionPage config={config} />,
});
