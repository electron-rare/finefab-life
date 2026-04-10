import { useQuery } from "@tanstack/react-query";
import { MetricCard, StatusDot, GlassCard } from "@finefab/ui";
import { Activity, FolderOpen } from "lucide-react";
import { api } from "../../lib/api";

type ServiceStatus = "healthy" | "unhealthy" | "unknown";

interface ServiceInfo {
  name: string;
  status: ServiceStatus;
}

export function DashboardPage() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["eda-health"],
    queryFn: api.health,
    refetchInterval: 10_000,
    retry: 1,
  });

  const { data: tools, isLoading: toolsLoading } = useQuery({
    queryKey: ["eda-tools"],
    queryFn: api.tools,
    staleTime: 60_000,
    retry: 1,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["eda-projects"],
    queryFn: api.projects,
    staleTime: 30_000,
    retry: 1,
  });

  const { data: freecad, isLoading: freecadLoading } = useQuery({
    queryKey: ["eda-freecad-status"],
    queryFn: api.freecadStatus,
    staleTime: 60_000,
    retry: 1,
  });

  const gatewayStatus = health?.status ?? "unknown";
  const toolCount = tools?.tools?.length ?? 0;
  const projectCount = projects?.projects?.length ?? 0;
  const freecadVersion = freecad?.version ?? (freecad?.available ? "Available" : "N/A");

  const services: ServiceInfo[] = [
    { name: "EDA Gateway", status: gatewayStatus === "ok" ? "healthy" : "unhealthy" },
    { name: "KiCad", status: toolCount > 0 ? "healthy" : "unhealthy" },
    { name: "FreeCAD", status: freecad?.available ? "healthy" : "unhealthy" },
    { name: "BOM Validator", status: "healthy" },
    { name: "AI Assistant", status: "healthy" },
  ];

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-green/10">
          <Activity size={20} className="text-accent-green" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">EDA Cockpit</h1>
          <p className="text-sm text-text-muted">eda.saillant.cc — Electronic Design Automation</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusDot status={gatewayStatus === "ok" ? "healthy" : "unhealthy"} />
          <span className="text-sm text-text-muted">
            {gatewayStatus === "ok" ? "Gateway online" : "Gateway unreachable"}
          </span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Gateway"
          value={healthLoading ? "..." : gatewayStatus === "ok" ? "Online" : "Offline"}
          subtitle={health?.version ? `v${health.version}` : "EDA API"}
          color={gatewayStatus === "ok" ? "text-accent-green" : "text-accent-red"}
        />
        <MetricCard
          label="Tools"
          value={toolsLoading ? "..." : toolCount}
          subtitle="KiCad + FreeCAD tools"
          color="text-accent-blue"
        />
        <MetricCard
          label="Projects"
          value={projectsLoading ? "..." : projectCount}
          subtitle="KiCad / PCB projects"
          color="text-accent-amber"
        />
        <MetricCard
          label="FreeCAD"
          value={freecadLoading ? "..." : freecadVersion}
          subtitle={freecad?.available ? "3D export ready" : "Not available"}
          color={freecad?.available ? "text-accent-green" : "text-accent-red"}
        />
      </div>

      {/* Services */}
      <GlassCard>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
          Services
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {services.map((svc) => (
            <div
              key={svc.name}
              className="flex items-center gap-2 rounded-lg border border-border-glass bg-surface-card/50 px-3 py-2"
            >
              <StatusDot status={svc.status} />
              <span className="text-xs text-text-primary">{svc.name}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Projects quick view */}
      {projects && projects.projects.length > 0 && (
        <GlassCard>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
            Recent Projects
          </h2>
          <div className="flex flex-col gap-2">
            {projects.projects.slice(0, 5).map((p) => (
              <div
                key={p.path}
                className="flex items-center justify-between rounded-lg border border-border-glass/50 bg-surface-card/30 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <FolderOpen size={14} className="shrink-0 text-accent-amber" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{p.name}</p>
                    <p className="font-mono text-xs text-text-muted">{p.path}</p>
                  </div>
                </div>
                <span className="rounded border border-border-glass px-2 py-0.5 font-mono text-xs text-text-muted">
                  {p.type}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Empty state when no projects and gateway offline */}
      {!projectsLoading && projectCount === 0 && gatewayStatus !== "ok" && (
        <GlassCard>
          <div className="py-8 text-center">
            <Activity size={32} className="mx-auto mb-3 text-text-dim" />
            <p className="text-sm text-text-muted">EDA Gateway is not reachable.</p>
            <p className="mt-1 text-xs text-text-dim">
              Configure{" "}
              <code className="font-mono">VITE_CAD_URL</code> or start the makelife-cad gateway.
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
