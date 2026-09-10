import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiClientError, paginatedQuery } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const LEAD_STATUSES = ["new", "contacted", "qualified", "proposal_sent", "won", "lost", "spam"];

interface LeadNote {
  id: string;
  body: string;
  authorId: string;
  createdAt: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  location?: string;
  serviceInterest?: string;
  message: string;
  status: string;
  createdAt: string;
  notes?: LeadNote[];
}

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  if (status === "won") return "default";
  if (status === "lost" || status === "spam") return "destructive";
  return "secondary";
}

export function AdminLeadsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [noteBody, setNoteBody] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-leads", statusFilter],
    queryFn: () =>
      paginatedQuery<Lead>("/admin/leads", { page: 1, page_size: 50, status: statusFilter }),
  });

  const { data: leadDetail } = useQuery({
    queryKey: ["admin-lead-detail", openLeadId],
    queryFn: () => api.get<Lead>(`/admin/leads/${openLeadId}`),
    enabled: openLeadId !== null,
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: string }) =>
      api.put(`/admin/leads/${vars.id}/status`, { status: vars.status }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-lead-detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin-leads-kpis"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Update failed"),
  });

  const noteMutation = useMutation({
    mutationFn: (vars: { id: string; body: string }) =>
      api.post(`/admin/leads/${vars.id}/notes`, { body: vars.body }),
    onSuccess: () => {
      setNoteBody("");
      queryClient.invalidateQueries({ queryKey: ["admin-lead-detail"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Note failed"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Every contact-form submission, in one place.
          </p>
        </div>
        <Select
          value={statusFilter ?? "all"}
          onValueChange={(val) => setStatusFilter(val === "all" ? undefined : val)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No leads yet.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer"
                onClick={() => setOpenLeadId(lead.id)}
              >
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.phone ?? "—"}</TableCell>
                <TableCell>{lead.serviceInterest ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(lead.status)}>{lead.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={openLeadId !== null} onOpenChange={(open) => !open && setOpenLeadId(null)}>
        <SheetContent className="flex flex-col gap-4 sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{leadDetail?.name}</SheetTitle>
          </SheetHeader>
          {leadDetail && (
            <div className="flex-1 space-y-4 overflow-y-auto">
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  {leadDetail.email}
                </div>
                {leadDetail.phone && (
                  <div>
                    <span className="text-muted-foreground">Phone: </span>
                    {leadDetail.phone}
                  </div>
                )}
                {leadDetail.location && (
                  <div>
                    <span className="text-muted-foreground">Location: </span>
                    {leadDetail.location}
                  </div>
                )}
                {leadDetail.company && (
                  <div>
                    <span className="text-muted-foreground">Company: </span>
                    {leadDetail.company}
                  </div>
                )}
                {leadDetail.serviceInterest && (
                  <div>
                    <span className="text-muted-foreground">Service Interest: </span>
                    {leadDetail.serviceInterest}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-1 text-sm font-medium">Message</div>
                <p className="rounded-md border bg-muted/30 p-3 text-sm">{leadDetail.message}</p>
              </div>

              <div className="space-y-1.5">
                <div className="text-sm font-medium">Status</div>
                <Select
                  value={leadDetail.status}
                  onValueChange={(val) => statusMutation.mutate({ id: leadDetail.id, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Internal notes</div>
                <div className="space-y-2">
                  {(leadDetail.notes ?? []).map((note) => (
                    <div key={note.id} className="rounded-md border p-2 text-sm">
                      <div>{note.body}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(note.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {(leadDetail.notes ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No notes yet.</p>
                  )}
                </div>
                <Textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Add an internal note…"
                  rows={3}
                />
                <Button
                  size="sm"
                  disabled={!noteBody.trim() || noteMutation.isPending}
                  onClick={() => noteMutation.mutate({ id: leadDetail.id, body: noteBody })}
                >
                  Add note
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
