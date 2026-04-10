import React, { useRef, useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Upload, Link2, X, FileCode2, PlayCircle, Download } from "lucide-react";
import { GlassCard, StatusDot, Spinner } from "@finefab/ui";
import { api, type DrcViolation } from "../../lib/api";

type FileMode = "upload" | "project";

function severityColor(s?: string): string {
  if (s === "error") return "text-accent-red";
  if (s === "warning") return "text-accent-amber";
  return "text-text-muted";
}

export function SchematicPage() {
  const [fileMode, setFileMode] = useState<FileMode>("upload");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [drcProjectPath, setDrcProjectPath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const { data: projects } = useQuery({
    queryKey: ["eda-projects"],
    queryFn: api.projects,
    staleTime: 60_000,
    retry: 1,
  });

  const drcMutation = useMutation({
    mutationFn: (path: string) => api.kicadDrc(path),
  });

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const loadFile = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "kicad_sch" && ext !== "kicad_pcb") {
      alert("Only .kicad_sch and .kicad_pcb files are supported.");
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setFileUrl(url);
    setFileName(file.name);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile]
  );

  const handleProjectLoad = useCallback(() => {
    if (!selectedProject.trim()) return;
    setFileUrl(selectedProject);
    setFileName(selectedProject);
  }, [selectedProject]);

  const clearViewer = useCallback(() => {
    setFileUrl(null);
    setFileName(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const svgUrl = drcProjectPath ? api.kicadExportSvg(drcProjectPath) : null;

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-6">
      <h1 className="text-lg font-semibold">Schematic Viewer</h1>

      {/* Mode selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setFileMode("upload")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            fileMode === "upload"
              ? "bg-accent-green/10 text-accent-green"
              : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
          }`}
        >
          <Upload size={16} />
          Local file
        </button>
        <button
          onClick={() => setFileMode("project")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            fileMode === "project"
              ? "bg-accent-green/10 text-accent-green"
              : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
          }`}
        >
          <Link2 size={16} />
          Project
        </button>
      </div>

      {/* Upload mode */}
      {fileMode === "upload" && (
        <GlassCard>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragging
                ? "border-accent-green bg-accent-green/5 text-accent-green"
                : "border-border-glass text-text-muted hover:border-accent-green/50 hover:text-text-primary"
            }`}
          >
            <FileCode2 size={32} />
            <div className="text-center">
              <p className="text-sm font-medium">Drag & drop a KiCad file</p>
              <p className="mt-1 text-xs text-text-muted">.kicad_sch or .kicad_pcb</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".kicad_sch,.kicad_pcb"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </GlassCard>
      )}

      {/* Project mode */}
      {fileMode === "project" && (
        <GlassCard>
          <div className="flex gap-2">
            {projects?.projects && projects.projects.length > 0 ? (
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="flex-1 rounded-lg border border-border-glass bg-surface-card px-3 py-2 text-sm text-text-primary focus:border-accent-green focus:outline-none"
              >
                <option value="">Select a project…</option>
                {projects.projects.map((p) => (
                  <option key={p.path} value={p.path}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Project path (e.g. makelife-main)"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleProjectLoad(); }}
                className="flex-1 rounded-lg border border-border-glass bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-green focus:outline-none"
              />
            )}
            <button
              onClick={handleProjectLoad}
              disabled={!selectedProject.trim()}
              className="rounded-lg bg-accent-green/10 px-4 py-2 text-sm font-medium text-accent-green transition-colors hover:bg-accent-green/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Load
            </button>
          </div>
        </GlassCard>
      )}

      {/* KiCanvas viewer */}
      {fileUrl ? (
        <GlassCard className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="truncate font-mono text-xs text-text-muted">{fileName}</p>
            <button
              onClick={clearViewer}
              className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
          <div className="overflow-hidden rounded-lg" style={{ height: "55vh" }}>
              <kicanvas-embed
              src={fileUrl}
              controls="full"
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          </div>
        </GlassCard>
      ) : (
        <GlassCard>
          <p className="py-4 text-center text-sm text-text-muted">
            No file loaded — upload a file or select a project above.
          </p>
        </GlassCard>
      )}

      {/* DRC Section */}
      <GlassCard>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
          DRC — Design Rule Check
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Project path for DRC…"
            value={drcProjectPath}
            onChange={(e) => setDrcProjectPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && drcProjectPath.trim()) drcMutation.mutate(drcProjectPath);
            }}
            className="flex-1 rounded-lg border border-border-glass bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-green focus:outline-none"
          />
          <button
            onClick={() => drcProjectPath.trim() && drcMutation.mutate(drcProjectPath)}
            disabled={!drcProjectPath.trim() || drcMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-accent-green/10 px-4 py-2 text-sm font-medium text-accent-green transition-colors hover:bg-accent-green/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PlayCircle size={16} />
            Run DRC
          </button>
          {svgUrl && (
            <a
              href={svgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border-glass px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <Download size={16} />
              SVG
            </a>
          )}
        </div>

        {drcMutation.isPending && (
          <div className="mt-4 flex justify-center">
            <Spinner text="Running DRC..." />
          </div>
        )}

        {drcMutation.isError && (
          <p className="mt-3 text-sm text-accent-red">
            DRC failed: {(drcMutation.error as Error).message}
          </p>
        )}

        {drcMutation.data && (
          <div className="mt-4">
            <div className="mb-3 flex gap-4">
              <div className="flex items-center gap-2">
                <StatusDot
                  status={drcMutation.data.error_count === 0 ? "healthy" : "unhealthy"}
                />
                <span className="text-sm">
                  {drcMutation.data.error_count} error
                  {drcMutation.data.error_count !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot
                  status={drcMutation.data.warning_count === 0 ? "healthy" : "unknown"}
                />
                <span className="text-sm">
                  {drcMutation.data.warning_count} warning
                  {drcMutation.data.warning_count !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {drcMutation.data.violations.length === 0 ? (
              <p className="text-sm text-accent-green">No violations found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border-glass text-left text-text-muted">
                      <th className="pb-2 pr-4">Rule</th>
                      <th className="pb-2 pr-4">Description</th>
                      <th className="pb-2 pr-4">Severity</th>
                      <th className="pb-2">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drcMutation.data.violations.map((v: DrcViolation, i: number) => (
                      <tr
                        key={i}
                        className="border-b border-border-glass/30 transition-colors hover:bg-surface-hover/30"
                      >
                        <td className="py-2 pr-4 font-mono text-text-muted">
                          {v.rule ?? "-"}
                        </td>
                        <td className="py-2 pr-4 text-text-primary">{v.description}</td>
                        <td className={`py-2 pr-4 font-mono ${severityColor(v.severity)}`}>
                          {v.severity ?? "info"}
                        </td>
                        <td className="py-2 font-mono text-text-muted">{v.location ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
