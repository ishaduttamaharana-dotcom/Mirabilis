import { useQuery } from "@tanstack/react-query";
import { paginatedQuery } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ActivityEntry {
  id: string;
  actorId: string;
  action: string;
  collection: string;
  targetId: string | null;
  createdAt: string;
}

export function AdminActivityLogPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-activity-log"],
    queryFn: () => paginatedQuery<ActivityEntry>("/admin/activity-log", { page: 1, page_size: 50 }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity log</h1>
        <p className="text-sm text-muted-foreground">
          Every create, update, and delete across the CMS. Secrets are never recorded here.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Collection</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No activity recorded yet.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <Badge variant="outline">{entry.action}</Badge>
                </TableCell>
                <TableCell>{entry.collection}</TableCell>
                <TableCell className="max-w-[160px] truncate text-muted-foreground">
                  {entry.targetId ?? "—"}
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-muted-foreground">
                  {entry.actorId}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
