import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiClientError, getMediaUrl, paginatedQuery } from "@/lib/api-client";
import type { AdminCollectionConfig, AdminFieldConfig } from "@/lib/admin/collections";
import { AdminProjectEditor } from "./admin-project-editor";
import { AdminHeroSlideEditor } from "./admin-hero-slide-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";

type Row = Record<string, unknown> & { id: string };

import { AdminMediaUploader } from "@/components/admin/admin-media-uploader";

function ImageFieldInput({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: string;
  value: string;
  onChange: (url: string) => void;
}) {
  return (
    <AdminMediaUploader
      mode="single"
      value={value}
      onChange={(val) => onChange(typeof val === "string" ? val : val[0]?.url || "")}
    />
  );
}

function defaultsFor(fields: AdminFieldConfig[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === "boolean") out[f.key] = false;
    else if (f.type === "tags") out[f.key] = [];
    else if (f.type === "number") out[f.key] = undefined;
    else out[f.key] = "";
  }
  return out;
}

function CollectionForm({
  config,
  initial,
  onSubmit,
  onCancel,
  saving,
  fieldErrors,
}: {
  config: AdminCollectionConfig;
  initial: Row | null;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
  saving: boolean;
  fieldErrors?: Record<string, string> | undefined;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    ...defaultsFor(config.fields),
    ...(config.hasState ? { state: "draft" } : {}),
    ...(initial ?? {}),
  }));

  const set = (key: string, value: unknown) => setValues((v) => ({ ...v, [key]: value }));

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {config.fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            {field.type === "textarea" && (
              <Textarea
                id={field.key}
                value={(values[field.key] as string) ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
                rows={4}
              />
            )}
            {field.type === "text" && (
              <Input
                id={field.key}
                value={(values[field.key] as string) ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
              />
            )}
            {field.type === "number" && (
              <Input
                id={field.key}
                type="number"
                value={(values[field.key] as number | undefined) ?? ""}
                onChange={(e) =>
                  set(field.key, e.target.value === "" ? undefined : Number(e.target.value))
                }
              />
            )}
            {field.type === "boolean" && (
              <div>
                <Switch
                  id={field.key}
                  checked={Boolean(values[field.key])}
                  onCheckedChange={(checked) => set(field.key, checked)}
                />
              </div>
            )}
            {field.type === "select" && (
              <Select
                value={(values[field.key] as string) ?? ""}
                onValueChange={(val) => set(field.key, val)}
              >
                <SelectTrigger id={field.key}>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {field.type === "image" && (
              <ImageFieldInput
                fieldKey={field.key}
                value={(values[field.key] as string) ?? ""}
                onChange={(val) => set(field.key, val)}
              />
            )}
            {field.type === "tags" && (
              <Input
                id={field.key}
                placeholder="comma, separated, tags"
                value={((values[field.key] as string[]) ?? []).join(", ")}
                onChange={(e) =>
                  set(
                    field.key,
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  )
                }
              />
            )}
            {fieldErrors?.[field.key] && (
              <p className="text-sm text-destructive">{fieldErrors[field.key]}</p>
            )}
          </div>
        ))}

        {config.hasState && (
          <div className="space-y-1.5">
            <Label htmlFor="state">Status</Label>
            <Select
              value={(values["state"] as string) ?? "draft"}
              onValueChange={(val) => set("state", val)}
            >
              <SelectTrigger id="state">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(config.stateOptions ?? ["draft", "published"]).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving
            ? "Saving…"
            : initial
              ? "Save changes"
              : `Create ${config.singular.toLowerCase()}`}
        </Button>
      </div>
    </form>
  );
}

export function AdminCollectionPage({ config }: { config: AdminCollectionConfig }) {
  const queryClient = useQueryClient();
  const queryKey = ["admin-collection", config.apiName];
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => paginatedQuery<Row>(`/admin/${config.apiName}`, { page: 1, page_size: 100 }),
  });

  function handleSaveError(err: unknown) {
    if (err instanceof ApiClientError) {
      toast.error(err.message);
      setFieldErrors(err.fields);
    } else {
      toast.error("Something went wrong");
    }
  }

  const createMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => api.post(`/admin/${config.apiName}`, values),
    onSuccess: () => {
      toast.success(`${config.singular} created`);
      setSheetOpen(false);
      setFieldErrors(undefined);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: handleSaveError,
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; values: Record<string, unknown> }) =>
      api.put(`/admin/${config.apiName}/${vars.id}`, vars.values),
    onSuccess: () => {
      toast.success(`${config.singular} updated`);
      setSheetOpen(false);
      setEditing(null);
      setFieldErrors(undefined);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: handleSaveError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/${config.apiName}/${id}`),
    onSuccess: () => {
      toast.success(`${config.singular} deleted`);
      setPendingDelete(null);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Delete failed");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/${config.apiName}/${id}/duplicate`),
    onSuccess: () => {
      toast.success(`${config.singular} duplicated as a draft`);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Duplicate failed");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      api.post(`/admin/${config.apiName}/reorder`, { items }),
    onSuccess: () => {
      toast.success("Sequence order updated");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => toast.error("Failed to reorder sequence"),
  });

  function moveRow(index: number, direction: "up" | "down") {
    if (!data?.items) return;
    const items = [...data.items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const item1 = items[index];
    const item2 = items[targetIndex];
    if (targetIndex < 0 || targetIndex >= items.length || !item1 || !item2) return;

    items[index] = item2;
    items[targetIndex] = item1;

    const payload = items.map((row, idx) => ({
      id: row.id,
      sortOrder: idx + 1,
    }));

    reorderMutation.mutate(payload);
  }

  const titleField = config.fields.find((f) => f.showInTable)?.key ?? config.fields[0]?.key;
  const tableFields = config.fields.filter((f) => f.showInTable);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{config.title}</h1>
          <p className="text-sm text-muted-foreground">
            Manage {config.singular.toLowerCase()} records for the public website.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFieldErrors(undefined);
            setSheetOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New {config.singular.toLowerCase()}
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              {tableFields.map((f) => (
                <TableHead key={f.key}>{f.label}</TableHead>
              ))}
              {config.hasState && <TableHead>Status</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={tableFields.length + 3}
                  className="text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell
                  colSpan={tableFields.length + 3}
                  className="text-center text-destructive"
                >
                  Couldn't load {config.title.toLowerCase()}.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={tableFields.length + 3}
                  className="text-center text-muted-foreground"
                >
                  No {config.title.toLowerCase()} yet — create the first one.
                </TableCell>
              </TableRow>
            )}
            {data?.items.map((row, idx) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs font-semibold text-primary">
                  <div className="flex items-center gap-1">
                    <span>{String(idx + 1).padStart(2, "0")}</span>
                    <div className="flex flex-col">
                      <button
                        type="button"
                        disabled={idx === 0 || reorderMutation.isPending}
                        onClick={() => moveRow(idx, "up")}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={
                          idx === (data?.items.length || 0) - 1 || reorderMutation.isPending
                        }
                        onClick={() => moveRow(idx, "down")}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </TableCell>
                {tableFields.map((f) => (
                  <TableCell key={f.key} className="max-w-xs truncate">
                    {f.type === "image" && row[f.key] ? (
                      <img
                        src={getMediaUrl(String(row[f.key]))}
                        alt={f.label}
                        className="h-10 w-14 rounded object-cover border border-border"
                      />
                    ) : (
                      String(row[f.key] ?? "—")
                    )}
                  </TableCell>
                ))}
                {config.hasState && (
                  <TableCell>
                    <Badge variant={row["state"] === "published" ? "default" : "secondary"}>
                      {String(row["state"] ?? "draft")}
                    </Badge>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Edit"
                      onClick={() => {
                        setEditing(row);
                        setFieldErrors(undefined);
                        setSheetOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Duplicate"
                      onClick={() => duplicateMutation.mutate(row.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Delete"
                      onClick={() => setPendingDelete(row)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          className={
            config.apiName === "projects" || config.apiName === "hero_slides"
              ? "sm:max-w-4xl w-full p-0 flex flex-col"
              : "flex flex-col sm:max-w-lg"
          }
        >
          {config.apiName === "projects" ? (
            <AdminProjectEditor initial={editing as any} onClose={() => setSheetOpen(false)} />
          ) : config.apiName === "hero_slides" ? (
            <AdminHeroSlideEditor initial={editing} onClose={() => setSheetOpen(false)} />
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>
                  {editing
                    ? `Edit ${config.singular.toLowerCase()}`
                    : `New ${config.singular.toLowerCase()}`}
                </SheetTitle>
              </SheetHeader>
              <CollectionForm
                config={config}
                initial={editing}
                saving={createMutation.isPending || updateMutation.isPending}
                fieldErrors={fieldErrors}
                onCancel={() => setSheetOpen(false)}
                onSubmit={(values) => {
                  if (editing) {
                    updateMutation.mutate({ id: editing.id, values });
                  } else {
                    createMutation.mutate(values);
                  }
                }}
              />
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {config.singular.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && titleField ? String(pendingDelete[titleField]) : ""} will be
              permanently removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
