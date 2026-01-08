import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Users, TrendingUp, Mail, Trash2, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [searchEmail, setSearchEmail] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "active" | "unsubscribed" | "bounced" | "all"
  >("active");

  const statsQuery = trpc.newsletter.getStats.useQuery();
  const subscribersQuery = trpc.newsletter.listSubscribers.useQuery({
    status: filterStatus === "all" ? undefined : filterStatus,
    limit: 50,
  });
  const deleteSubscriberMutation = trpc.newsletter.deleteSubscriber.useMutation({
    onSuccess: () => {
      toast.success("Subscriber deleted");
      subscribersQuery.refetch();
      statsQuery.refetch();
    },
    onError: () => {
      toast.error("Failed to delete subscriber");
    },
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Access Denied
            </h2>
            <p className="text-foreground/70">
              You need admin privileges to access this page.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const filteredSubscribers = subscribersQuery.data?.filter((sub: any) =>
    sub.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Newsletter Dashboard
          </h1>
          <p className="text-foreground/70">
            Manage subscribers and view analytics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6 border-border rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/70 text-sm mb-1">Total Subscribers</p>
                <p className="text-3xl font-bold text-foreground">
                  {statsQuery.data?.total || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-accent opacity-50" />
            </div>
          </Card>

          <Card className="p-6 border-border rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/70 text-sm mb-1">Active</p>
                <p className="text-3xl font-bold text-accent">
                  {statsQuery.data?.active || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-accent opacity-50" />
            </div>
          </Card>

          <Card className="p-6 border-border rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/70 text-sm mb-1">Unsubscribed</p>
                <p className="text-3xl font-bold text-foreground">
                  {statsQuery.data?.unsubscribed || 0}
                </p>
              </div>
              <Mail className="w-8 h-8 text-accent opacity-50" />
            </div>
          </Card>

          <Card className="p-6 border-border rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground/70 text-sm mb-1">Bounced</p>
                <p className="text-3xl font-bold text-foreground">
                  {statsQuery.data?.bounced || 0}
                </p>
              </div>
              <Mail className="w-8 h-8 text-destructive opacity-50" />
            </div>
          </Card>
        </div>

        {/* Subscriber Management */}
        <Card className="p-6 border-border rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Subscribers</h2>
            <Button
              onClick={() => {
                const csv = generateCSV(filteredSubscribers || []);
                downloadCSV(csv);
              }}
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="flex-1 rounded-lg border-border"
            />
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as
                    | "active"
                    | "unsubscribed"
                    | "bounced"
                    | "all"
                )
              }
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>

          {/* Subscribers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Age
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Source
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Joined
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers?.map((subscriber: any) => (
                  <tr
                    key={subscriber.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground">
                      {subscriber.email}
                    </td>
                    <td className="py-3 px-4 text-foreground/70">
                      {subscriber.age || "—"}
                    </td>
                    <td className="py-3 px-4 text-foreground/70">
                      <span className="capitalize">{subscriber.source}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          subscriber.status === "active"
                            ? "bg-accent/20 text-accent"
                            : subscriber.status === "unsubscribed"
                              ? "bg-muted text-foreground/70"
                              : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {subscriber.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground/70">
                      {new Date(subscriber.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        onClick={() =>
                          deleteSubscriberMutation.mutate({
                            email: subscriber.email,
                          })
                        }
                        disabled={deleteSubscriberMutation.isPending}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSubscribers?.length === 0 && (
            <div className="text-center py-8 text-foreground/70">
              No subscribers found
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

function generateCSV(
  subscribers: Array<{
    email: string;
    age: number | null;
    source: string;
    status: string;
    createdAt: Date;
  }>
): string {
  const headers = ["Email", "Age", "Source", "Status", "Joined Date"];
  const rows = subscribers.map((sub) => [
    sub.email,
    sub.age || "",
    sub.source,
    sub.status,
    new Date(sub.createdAt).toISOString(),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csv;
}

function downloadCSV(csv: string): void {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `signal-weekly-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
