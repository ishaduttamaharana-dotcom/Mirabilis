import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_authenticated/products")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/portfolio" });
  },
  component: () => null,
});
