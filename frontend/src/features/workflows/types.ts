export interface Workflow {
  id: string;
  code: string;
  name: string;
  trigger_event: string;
  is_enabled: boolean;
  config: Record<string, any> | null;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  event_type: string;
  status: string;
  attempt_count: number;
  error: string | null;
  actions_log: Record<string, any> | null;
  started_at: string;
  finished_at: string | null;
}