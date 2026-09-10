import { createFileRoute } from "@tanstack/react-router";
import { AdminCollectionPage } from "@/components/admin/collection-crud-page";
import { findCollectionConfig } from "@/lib/admin/collections";

const config = findCollectionConfig("blogs")!;

export const Route = createFileRoute("/admin/_authenticated/blogs")({
  component: () => <AdminCollectionPage config={config} />,
});
