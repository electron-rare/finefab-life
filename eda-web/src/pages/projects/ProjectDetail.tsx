import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  GitBranch,
  RefreshCw,
  Plus,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { GlassCard, Spinner, StatusDot } from "@finefab/ui";
import { projectsApi, type TaskData } from "../../lib/api";

// ─── Gate config ─────────────────────────────────────────────────────────────

const GATES = ["S0", "S1", "S2", "S3", "S4"] as const;
type GateName = (typeof GATES)[number];

const GATE_COLORS: Record<GateName, string> = {
  S0: "text-accent-green border-accent-green/30 bg-accent-green/5",
  S1: "text-accent-blue border-accent-blue/30 bg-accent-blue/5",
  S2: "text-accent-amber border-accent-amber/30 bg-accent-amber/5",
  S3: "text-accent-red border-accent-red/30 bg-accent-red/5",
  S4: "text-text-muted border-border-glass bg-surface-card/30",
};

const GATE_HEADER_BG: Record<GateName, string> = {
  S0: "border-accent-green/20 bg-accent-green/5",
  S1: "border-accent-blue/20 bg-accent-blue/5",
  S2: "border-accent-amber/20 bg-accent-amber/5",
  S3: "border-accent-red/20 bg-accent-red/5",
  S4: "border-border-glass bg-surface-card/20",
};

const GATE_STATUS_CYCLE: string[] = ["pending", "in-review", "pass", "blocked"];

function nextGateStatus(current: string): string {
  const idx = GATE_STATUS_CYCLE.indexOf(current);
  return GATE_STATUS_CYCLE[(idx + 1) % GATE_STATUS_CYCLE.length];
}

// ─── Task status ─────────────────────────────────────────────────────────────

const TASK_STATUS_OPTIONS = ["todo", "in_progress", "done", "blocked"] as const;

function taskStatusBadge(status: string): string {
  switch (status) {
    case "done":
      return "text-accent-green border-accent-green/30 bg-accent-green/10";
    case "in_progress":
      return "text-accent-blue border-accent-blue/30 bg-accent-blue/10";
    case "blocked":
      return "text-accent-red border-accent-red/30 bg-accent-red/10";
    default:
      return "text-text-muted border-border-glass bg-surface-card/30";
  }
}

function gateStatusBadge(status: string): string {
  switch (status) {
    case "pass":
      return "text-accent-green border-accent-green/30 bg-accent-green/10";
    case "in-review":
      return "text-accent-amber border-accent-amber/30 bg-accent-amber/10";
    case "blocked":
      return "text-accent-red border-accent-red/30 bg-accent-red/10";
    default:
      return "text-text-dim border-border-glass/50 bg-surface-card/10";
  }
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function TaskCard({
  task,
  projectName,
}: {
  task: TaskData;
  projectName: string;
}) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(task.status);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      projectsApi.updateTask(projectName, task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mgmt-tasks", projectName] });
      setEditing(false);
    },
  });

  return (
    <div className="rounded border border-border-glass/50 bg-surface-card/20 p-2.5 text-xs">
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-text-primary leading-tight">{task.name}</span>
        <button
          onClick={() => setEditing((v) => !v)}
          className="shrink-0 rounded px-1.5 py-0.5 text-text-dim hover:bg-surface-hover hover:text-text-muted"
        >
          {editing ? "cancel" : "edit"}
        </button>
      </div>

      {!editing && (
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${taskStatusBadge(task.status)}`}
          >
            {task.status}
          </span>
          {task.assignees?.length > 0 && (
            <span className="text-text-dim truncate">{task.assignees.join(", ")}</span>
          )}
        </div>
      )}

      {editing && (
        <div className="mt-2 flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 rounded border border-border-glass bg-surface-card/50 px-1.5 py-1 text-[10px] text-text-primary outline-none"
          >
            {TASK_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={() => updateMutation.mutate({ status })}
            disabled={updateMutation.isPending}
            className="flex h-6 w-6 items-center justify-center rounded bg-accent-green/10 border border-accent-green/30 text-accent-green hover:bg-accent-green/20 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Check size={11} />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function AddTaskForm({
  projectName,
  gate,
  onClose,
}: {
  projectName: string;
  gate: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => projectsApi.createTask(projectName, { name, gate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mgmt-tasks", projectName] });
      onClose();
    },
  });

  return (
    <div className="mt-2 flex gap-1.5">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") mutation.mutate();
          if (e.key === "Escape") onClose();
        }}
        placeholder="Task name…"
        className="flex-1 rounded border border-border-glass bg-surface-card/50 px-2 py-1 text-xs text-text-primary placeholder-text-dim outline-none focus:border-accent-green/50"
      />
      <button
        onClick={() => mutation.mutate()}
        disabled={!name.trim() || mutation.isPending}
        className="flex h-6 w-6 items-center justify-center rounded bg-accent-green/10 border border-accent-green/30 text-accent-green hover:bg-accent-green/20 disabled:opacity-50"
      >
        {mutation.isPending ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <Check size={11} />
        )}
      </button>
    </div>
  );
}

function GateColumn({
  gate,
  status,
  tasks,
  projectName,
  onStatusClick,
}: {
  gate: GateName;
  status: string;
  tasks: TaskData[];
  projectName: string;
  onStatusClick: () => void;
}) {
  const [addingTask, setAddingTask] = useState(false);

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-border-glass/50 bg-surface-card/10">
      {/* Header */}
      <div
        className={`flex items-center justify-between rounded-t-lg border-b px-3 py-2 ${GATE_HEADER_BG[gate]}`}
      >
        <span className={`font-mono text-sm font-semibold ${GATE_COLORS[gate].split(" ")[0]}`}>
          {gate}
        </span>
        <button
          onClick={onStatusClick}
          title="Click to cycle status"
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors hover:opacity-80 ${gateStatusBadge(status)}`}
        >
          {status}
        </button>
      </div>

      {/* Task cards */}
      <div className="flex flex-col gap-1.5 p-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} projectName={projectName} />
        ))}

        {addingTask ? (
          <AddTaskForm
            projectName={projectName}
            gate={gate}
            onClose={() => setAddingTask(false)}
          />
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className="mt-1 flex items-center gap-1 rounded px-2 py-1.5 text-xs text-text-dim transition-colors hover:bg-surface-hover hover:text-text-muted"
          >
            <Plus size={11} />
            Add Task
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ProjectDetail() {
  const { name } = useParams({ strict: false }) as { name: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const { data: project, isLoading: projectLoading, isError: projectError } = useQuery({
    queryKey: ["mgmt-project", name],
    queryFn: () => projectsApi.get(name),
    staleTime: 30_000,
    enabled: !!name,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["mgmt-tasks", name],
    queryFn: () => projectsApi.tasks(name),
    staleTime: 15_000,
    enabled: !!name,
  });

  const syncMutation = useMutation({
    mutationFn: () => projectsApi.sync(name),
    onSuccess: (res) => {
      setSyncResult(res.commit_sha);
      queryClient.invalidateQueries({ queryKey: ["mgmt-project", name] });
    },
  });

  const updateGateMutation = useMutation({
    mutationFn: (gates: Record<string, { status: string; date: string | null }>) =>
      projectsApi.update(name, { gates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mgmt-project", name] });
    },
  });

  function cycleGateStatus(gate: GateName) {
    if (!project) return;
    const currentGates = project.gates ?? {};
    const current = currentGates[gate]?.status ?? "pending";
    const next = nextGateStatus(current);
    const updatedGates = {
      ...currentGates,
      [gate]: { status: next, date: next === "pass" ? new Date().toISOString() : currentGates[gate]?.date ?? null },
    };
    updateGateMutation.mutate(updatedGates);
  }

  const tasks = tasksData?.tasks ?? [];
  const tasksByGate = (gate: string) => tasks.filter((t) => t.gate === gate);

  // Gate progress bar segments
  const gateProgress = GATES.map((g) => ({
    gate: g,
    status: project?.gates?.[g]?.status ?? "pending",
  }));
  const passedCount = gateProgress.filter((g) => g.status === "pass").length;

  if (projectLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner text={`Loading ${name}…`} />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="p-6">
        <GlassCard>
          <div className="flex items-center gap-3 py-4">
            <StatusDot status="unhealthy" />
            <div>
              <p className="text-sm font-medium text-accent-red">Project not found</p>
              <p className="text-xs text-text-muted">Could not load project "{name}"</p>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 overflow-y-auto p-6">
      {/* Back nav */}
      <button
        onClick={() => router.navigate({ to: "/projects" })}
        className="flex w-fit items-center gap-1.5 text-xs text-text-muted hover:text-text-primary"
      >
        <ArrowLeft size={13} />
        All Projects
      </button>

      {/* Header */}
      <GlassCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-bold text-text-primary">{project.name}</h1>
              {project.client && (
                <span className="rounded border border-accent-blue/30 bg-accent-blue/10 px-2 py-0.5 text-xs text-accent-blue">
                  {project.client}
                </span>
              )}
            </div>
            {project.repo && (
              <a
                href={project.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-green"
              >
                <GitBranch size={11} />
                {project.repo}
                <ExternalLink size={10} />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            {syncResult && (
              <span className="font-mono text-xs text-accent-green">
                sha: {syncResult.slice(0, 8)}
              </span>
            )}
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-accent-blue/30 bg-accent-blue/5 px-3 py-1.5 text-xs text-accent-blue transition-colors hover:bg-accent-blue/15 disabled:opacity-50"
            >
              <RefreshCw size={12} className={syncMutation.isPending ? "animate-spin" : ""} />
              Sync to Git
            </button>
          </div>
        </div>

        {/* Gate progress bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
            <span>Gate Progress</span>
            <span className="font-mono">
              {passedCount}/{GATES.length}
            </span>
          </div>
          <div className="flex gap-1">
            {gateProgress.map(({ gate, status }) => (
              <button
                key={gate}
                onClick={() => cycleGateStatus(gate)}
                title={`${gate}: ${status} — click to cycle`}
                disabled={updateGateMutation.isPending}
                className={`group flex-1 rounded py-1.5 text-center font-mono text-xs transition-all hover:opacity-80 disabled:cursor-not-allowed ${gateStatusBadge(status)} border`}
              >
                {gate}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Gates / tasks board */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text-primary">Gates &amp; Tasks</h2>
        {tasksLoading ? (
          <div className="flex justify-center py-8">
            <Spinner text="Loading tasks…" />
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {GATES.map((gate) => (
              <GateColumn
                key={gate}
                gate={gate}
                status={project.gates?.[gate]?.status ?? "pending"}
                tasks={tasksByGate(gate)}
                projectName={name}
                onStatusClick={() => cycleGateStatus(gate)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hardware / firmware metadata */}
      {(Object.keys(project.hardware ?? {}).length > 0 ||
        Object.keys(project.firmware ?? {}).length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {Object.keys(project.hardware ?? {}).length > 0 && (
            <GlassCard>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Hardware
              </h3>
              <dl className="space-y-1">
                {Object.entries(project.hardware).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-xs">
                    <dt className="font-mono text-text-muted">{k}</dt>
                    <dd className="text-text-primary">{v}</dd>
                  </div>
                ))}
              </dl>
            </GlassCard>
          )}
          {Object.keys(project.firmware ?? {}).length > 0 && (
            <GlassCard>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Firmware
              </h3>
              <dl className="space-y-1">
                {Object.entries(project.firmware).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-xs">
                    <dt className="font-mono text-text-muted">{k}</dt>
                    <dd className="text-text-primary">{v}</dd>
                  </div>
                ))}
              </dl>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
