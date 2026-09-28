import { toast } from "sonner";
import { Workflow as WorkflowIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePermission } from "@/permissions/usePermission";
import { useExecutions, useToggleWorkflow, useWorkflows } from "../services";
import type { WorkflowExecution } from "../types";

export default function WorkflowsPage() {
  const { can } = usePermission();
  const { data: workflows = [], isLoading } = useWorkflows();
  const { data: executions = [], isLoading: loadingExec } = useExecutions({ limit: 50 });
  const toggle = useToggleWorkflow();

  return (
    <div>
      <PageHeader
        title="Tự động hóa"
        description="Workflow engine và lịch sử thực thi"
      />

      <Tabs defaultValue="workflows">
        <TabsList>
          <TabsTrigger value="workflows">Workflows ({workflows.length})</TabsTrigger>
          <TabsTrigger value="executions">Lịch sử ({executions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows">
          {isLoading ? null : workflows.length === 0 ? (
            <Card>
              <EmptyState icon={WorkflowIcon} title="Chưa có workflow nào" />
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {workflows.map((w) => (
                <Card key={w.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{w.name}</h3>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {w.code}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Trigger: <span className="font-mono">{w.trigger_event}</span>
                        </p>
                        {w.config && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Actions: {Array.isArray(w.config.actions) ? w.config.actions.join(", ") : "—"}
                          </div>
                        )}
                      </div>
                      {can("workflow.manage") && (
                        <Switch
                          checked={w.is_enabled}
                          onChange={(e) =>
                            toggle.mutate(
                              { id: w.id, enabled: e.target.checked },
                              {
                                onSuccess: () =>
                                  toast.success(e.target.checked ? "Đã bật" : "Đã tắt"),
                              }
                            )
                          }
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="executions">
          <ExecutionsTable data={executions} loading={loadingExec} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExecutionsTable({ data, loading }: { data: WorkflowExecution[]; loading: boolean }) {
  const columns: Column<WorkflowExecution>[] = [
    {
      key: "event",
      header: "Sự kiện",
      cell: (r) => <span className="font-mono text-xs">{r.event_type}</span>,
    },
    { key: "status", header: "Kết quả", cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.actions_log ? Object.keys(r.actions_log).join(", ") : "—"}
        </span>
      ),
    },
    {
      key: "started",
      header: "Bắt đầu",
      cell: (r) => new Date(r.started_at).toLocaleString("vi-VN"),
    },
    {
      key: "attempts",
      header: "Lần thử",
      cell: (r) => r.attempt_count,
      className: "w-20 text-center",
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyState={<EmptyState title="Chưa có lần thực thi nào" />}
    />
  );
}