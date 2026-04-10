import { getAccessToken } from "./auth";

function normalizeBaseUrl(value: string | undefined, fallback: string): string {
  const resolved = value?.trim() || fallback;
  if (!resolved || resolved === "/") return "";
  return resolved.endsWith("/") ? resolved.slice(0, -1) : resolved;
}

const CAD_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_CAD_URL,
  "https://api.saillant.cc/eda",
);

const CORE_API = normalizeBaseUrl(
  import.meta.env.VITE_API_URL,
  "https://api.saillant.cc",
);

async function coreRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${CORE_API}${path}`, { credentials: "include", ...init, headers });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${CAD_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json();
}

export type HealthResponse = {
  status: string;
  version?: string;
  uptime?: number;
  tools_available?: number;
};

export type Tool = {
  name: string;
  description?: string;
  enabled?: boolean;
};

export type ToolsResponse = {
  tools: Tool[];
};

export type Project = {
  name: string;
  type: string;
  path: string;
  last_modified?: string;
};

export type ProjectsResponse = {
  projects: Project[];
};

export type FreeCadStatus = {
  available: boolean;
  version?: string;
  path?: string;
};

export type DrcViolation = {
  rule?: string;
  description: string;
  severity?: string;
  location?: string;
};

export type DrcResult = {
  project: string;
  violations: DrcViolation[];
  error_count: number;
  warning_count: number;
};

export type BomItem = {
  ref: string;
  value: string;
  footprint?: string;
  lcsc?: string;
  availability?: "available" | "missing" | "unknown";
  quantity?: number;
};

export type BomResult = {
  project: string;
  items: BomItem[];
  total: number;
};

export type ComponentSuggestion = {
  name: string;
  lcsc?: string;
  description?: string;
  package?: string;
  value?: string;
  price?: string;
};

export type AiComponentResponse = {
  query: string;
  suggestions: ComponentSuggestion[];
};

export type AiReviewResponse = {
  project: string;
  summary: string;
  issues: string[];
  suggestions: string[];
  markdown?: string;
};

export const api = {
  health: () => request<HealthResponse>("/health"),

  tools: () => request<ToolsResponse>("/tools"),

  projects: () => request<ProjectsResponse>("/projects"),

  freecadStatus: () => request<FreeCadStatus>("/freecad/status"),

  kicadDrc: (projectPath?: string) => {
    const qs = projectPath ? `?project_path=${encodeURIComponent(projectPath)}` : "";
    return request<DrcResult>(`/kicad/drc${qs}`);
  },

  kicadExportSvg: (projectPath: string): string => {
    return `${CAD_BASE_URL}/kicad/export/svg?project_path=${encodeURIComponent(projectPath)}`;
  },

  freecadExport: (projectPath: string, format: "step" | "stl") =>
    request<{ url: string; format: string }>("/freecad/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_path: projectPath, format }),
    }),

  bomValidate: (projectPath: string) =>
    request<BomResult>("/bom/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_path: projectPath }),
    }),

  aiComponentSuggest: (query: string) =>
    request<AiComponentResponse>("/ai/component-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    }),

  aiSchematicReview: (projectPath: string) =>
    request<AiReviewResponse>("/ai/schematic-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_path: projectPath }),
    }),
};

// ─── Project management types ────────────────────────────────────────────────

export interface ProjectData {
  name: string;
  client: string;
  repo: string;
  gates: Record<string, { status: string; date: string | null }>;
  hardware: Record<string, string>;
  firmware: Record<string, string>;
  agents?: string[];
}

export interface TaskData {
  id: string;
  name: string;
  gate: string;
  status: string;
  assignees: string[];
  progress: number;
  start_date: string | null;
  end_date: string | null;
  depends_on: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  type: string;
  avatar_url: string | null;
}

// ─── Projects API (life-reborn / core) ───────────────────────────────────────

export const projectsApi = {
  list: () => coreRequest<{ projects: ProjectData[]; count: number }>("/projects"),
  get: (name: string) => coreRequest<ProjectData>(`/projects/${name}`),
  create: (data: { name: string; client?: string; repo?: string }) =>
    coreRequest<ProjectData>("/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  update: (name: string, data: Record<string, unknown>) =>
    coreRequest<ProjectData>(`/projects/${name}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  sync: (name: string) =>
    coreRequest<{ commit_sha: string; synced: boolean }>(`/projects/${name}/sync`, {
      method: "POST",
    }),
  tasks: (name: string) =>
    coreRequest<{ tasks: TaskData[] }>(`/projects/${name}/tasks`),
  createTask: (
    name: string,
    data: { name: string; gate: string; assignees?: string[] },
  ) =>
    coreRequest<TaskData>(`/projects/${name}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  updateTask: (name: string, taskId: string, data: Record<string, unknown>) =>
    coreRequest<TaskData>(`/projects/${name}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  deleteTask: (name: string, taskId: string) =>
    coreRequest<{ deleted: boolean }>(`/projects/${name}/tasks/${taskId}`, {
      method: "DELETE",
    }),
  team: () => coreRequest<{ members: TeamMember[] }>("/team/members"),
};
