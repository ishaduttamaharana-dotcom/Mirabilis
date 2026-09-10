import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsData {
  siteTitle?: string;
  brandEmail?: string;
  brandPhone?: string;
  brandLocation?: string;
  smtpHost?: string;
  smtpPort?: number | string;
  smtpUsername?: string;
  smtpPassword?: string;
  [key: string]: any;
}

export function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["admin-settings"],
    queryFn: () => api.get<SettingsData>("/admin/settings"),
  });

  const [formData, setFormData] = useState<SettingsData>({});

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (newSettings: Record<string, any>) => api.put("/admin/settings", newSettings),
    onSuccess: () => {
      toast.success("Settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save settings");
    },
  });

  function handleChange(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(formData);
  }

  const testEmailMutation = useMutation({
    mutationFn: () => api.post("/admin/settings/test-email"),
    onSuccess: (res: any) => {
      toast.success(res.message || "Test email sent successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send test email");
    },
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading site settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Site Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage brand details, contact info, SEO defaults, SMTP credentials, and integration
          settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General & Brand Info</CardTitle>
            <CardDescription>
              Public site details shown in headers, footers, and metadata.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="siteTitle">Site Title</Label>
                <Input
                  id="siteTitle"
                  value={formData.siteTitle ?? ""}
                  onChange={(e) => handleChange("siteTitle", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandEmail">Brand Email</Label>
                <Input
                  id="brandEmail"
                  type="email"
                  value={formData.brandEmail ?? ""}
                  onChange={(e) => handleChange("brandEmail", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brandPhone">Phone Number</Label>
                <Input
                  id="brandPhone"
                  value={formData.brandPhone ?? ""}
                  onChange={(e) => handleChange("brandPhone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandLocation">Location</Label>
                <Input
                  id="brandLocation"
                  value={formData.brandLocation ?? ""}
                  onChange={(e) => handleChange("brandLocation", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email & SMTP Configuration</CardTitle>
            <CardDescription>
              Server details for sending lead notifications and system emails.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  placeholder="smtp.example.com"
                  value={formData.smtpHost ?? ""}
                  onChange={(e) => handleChange("smtpHost", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  placeholder="587"
                  value={formData.smtpPort ?? ""}
                  onChange={(e) => handleChange("smtpPort", Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtpUsername">SMTP Username</Label>
                <Input
                  id="smtpUsername"
                  value={formData.smtpUsername ?? ""}
                  onChange={(e) => handleChange("smtpUsername", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPassword">SMTP Password</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.smtpPassword ?? ""}
                  onChange={(e) => handleChange("smtpPassword", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            disabled={testEmailMutation.isPending}
            onClick={() => testEmailMutation.mutate()}
          >
            {testEmailMutation.isPending ? "Testing SMTP..." : "Test Email Connection"}
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
