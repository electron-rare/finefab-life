import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { FolderOpen, Eye, PlayCircle, Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { GlassCard, Spinner, StatusDot } from "@finefab/ui";
import { api, type Project } from "../../lib/api";

export function ProjectsPage() {
  const router = useRouter();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["eda-projects"],
    queryFn: api.projects,
    staleTime: 30_000,
    retry: 1,
  });

  const projects: Project[] = data?.projects ?? [];

  const navigate = (path: string) => router.navigate({ to: path });

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      kicad: "KiCad",
      freecad: "FreeCAD",
      spice: "SPICE",
      pcb: "PCB",
    };
    return map[type.toLowerCase()] ?? type;
  };

  const typeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t === "kicad" || t === "pcb") return "text-accent-green border-accent-green/20 bg-accent-green/5";
    if (t === "freecad") return "text-accent-blue border-accent-blue/20 bg-accent-blue/5";
    if (t === "spice") return "text-accent-amber border-accent-amber/20 bg-accent-amber/5";
    return "text-text-muted border-border-glass bg-surface-card/30";
  };

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">Projects</h1>
        <span className="rounded-full border border-border-glass bg-surface-card/50 px-2.5 py-0.5 text-xs text-text-muted">
          {projects.length}
        </span>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-border-glass px-3 py-1.5 text-xs text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
        >
          <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner text="Loading projects..." />
        </div>
      )}

      {isError && (
        <GlassCard>
          <div className="flex items-center gap-3 py-4">
            <StatusDot status="unhealthy" />
            <div>
              <p className="text-sm font-medium text-accent-red">Failed to load projects</p>
              <p className="text-xs text-text-muted">{(error as Error).message}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {!isLoading && !isError && projects.length === 0 && (
        <GlassCard>
          <div className="py-10 text-center">
            <FolderOpen size={32} className="mx-auto mb-3 text-text-dim" />
            <p className="text-sm text-text-muted">No projects found.</p>
            <p className="mt-1 text-xs text-text-dim">
              Add KiCad or FreeCAD projects to the gateway's workspace.
            </p>
          </div>
        </GlassCard>
      )}

      {projects.length > 0 && (
        <GlassCard className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-glass text-left text-text-muted">
                <th className="px-4 py-3 text-xs uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider">Path</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, i) => (
                <tr
                  key={`${project.path}-${i}`}
                  className="border-b border-border-glass/30 transition-colors hover:bg-surface-hover/20"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FolderOpen size={14} className="shrink-0 text-accent-amber" />
                      <span className="font-medium text-text-primary">{project.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded border px-2 py-0.5 font-mono text-xs ${typeColor(project.type)}`}
                    >
                      {typeLabel(project.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">
                    {project.path}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate("/schematic")}
                        title="View schematic"
                        className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-hover hover:text-accent-green"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => navigate("/bom")}
                        title="Run BOM validation"
                        className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-hover hover:text-accent-blue"
                      >
                        <FileSpreadsheet size={14} />
                      </button>
                      <button
                        onClick={() => navigate("/schematic")}
                        title="Run DRC"
                        className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-hover hover:text-accent-amber"
                      >
                        <PlayCircle size={14} />
                      </button>
                      <button
                        onClick={() => navigate("/3d")}
                        title="Export 3D"
                        className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-hover hover:text-accent-red"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}
