import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, paginatedQuery } from "@/lib/api-client";
import { Link } from "@tanstack/react-router";

interface LeadKpis {
  byStatus: Record<string, number>;
  newLeads: number;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

export function AdminDashboard() {
  const { data: kpis } = useQuery({
    queryKey: ["admin-leads-kpis"],
    queryFn: () => api.get<LeadKpis>("/admin/leads/kpis"),
  });

  const { data: recentLeads } = useQuery({
    queryKey: ["admin-leads-recent"],
    queryFn: () => paginatedQuery<Lead>("/admin/leads", { page: 1, page_size: 5 }),
  });

  const { data: mediaPage } = useQuery({
    queryKey: ["admin-media-count"],
    queryFn: () => paginatedQuery<{ id: string }>("/admin/media", { page: 1, page_size: 1 }),
  });

  const chartData = kpis
    ? Object.entries(kpis.byStatus).map(([status, count]) => ({ status, count }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">An overview of leads, content, and media.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{kpis?.newLeads ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Won leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{kpis?.byStatus["won"] ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Media items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{mediaPage?.total ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {kpis ? Object.values(kpis.byStatus).reduce((a, b) => a + b, 0) : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Leads by status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="status" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLeads?.items.length === 0 && (
              <p className="text-sm text-muted-foreground">No leads yet.</p>
            )}
            {recentLeads?.items.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{lead.name}</div>
                  <div className="text-muted-foreground">{lead.email}</div>
                </div>
                <span className="text-xs text-muted-foreground">{lead.status}</span>
              </div>
            ))}
            <Link to="/admin/leads" className="block text-sm text-primary hover:underline">
              View all leads →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
