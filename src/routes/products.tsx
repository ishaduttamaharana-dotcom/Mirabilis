import { createFileRoute, redirect } from "@tanstack/react-router";
import { PortfolioPage } from "./portfolio";

export const Route = createFileRoute("/products")({
  beforeLoad: () => {
    throw redirect({ to: "/portfolio" });
  },
  component: PortfolioPage,
});
