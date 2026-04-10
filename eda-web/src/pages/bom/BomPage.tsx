import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PlayCircle, Filter } from "lucide-react";
import { GlassCard, StatusDot, Spinner } from "@finefab/ui";
import { api, type BomItem } from "../../lib/api";

type BomFilter = "all" | "missing" | "available";

export function BomPage() {
  const [projectPath, setProjectPath] = useState("");
  const [filter, setFilter] = useState<BomFilter>("all");

  const bomMutation = useMutation({
    mutationFn: (path: string) => api.bomValidate(path),
  });

  const items: BomItem[] = bomMutation.data?.items ?? [];
  const filteredItems = items.filter((item) => {
    if (filter === "missing") return item.availability === "missing";
    if (filter === "available") return item.availability === "available";
    return true;
  });

  const missingCount = items.filter((i) => i.availability === "missing").length;
  const availableCount = items.filter((i) => i.availability === "available").length;

  const availabilityStatus = (avail?: string): "healthy" | "unhealthy" | "unknown" => {
    if (avail === "available") return "healthy";
    if (avail === "missing") return "unhealthy";
    return "unknown";
  };

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-6">
      <h1 className="text-lg font-semibold">BOM Validator</h1>

      {/* Input */}
      <GlassCard>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="KiCad project path…"
            value={projectPath}
            onChange={(e) => setProjectPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && projectPath.trim()) bomMutation.mutate(projectPath);
            }}
            className="flex-1 rounded-lg border border-border-glass bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-green focus:outline-none"
          />
          <button
            onClick={() => projectPath.trim() && bomMutation.mutate(projectPath)}
            disabled={!projectPath.trim() || bomMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-accent-green/10 px-4 py-2 text-sm font-medium text-accent-green transition-colors hover:bg-accent-green/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {bomMutation.isPending ? <Spinner /> : <PlayCircle size={16} />}
            Validate
          </button>
        </div>
      </GlassCard>

      {bomMutation.isError && (
        <p className="text-sm text-accent-red">
          Error: {(bomMutation.error as Error).message}
        </p>
      )}

      {/* Results */}
      {bomMutation.data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-border-glass bg-surface-card/50 px-4 py-3">
              <StatusDot status="healthy" />
              <div>
                <p className="text-sm font-medium">{availableCount}</p>
                <p className="text-xs text-text-muted">Available</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border-glass bg-surface-card/50 px-4 py-3">
              <StatusDot status="unhealthy" />
              <div>
                <p className="text-sm font-medium">{missingCount}</p>
                <p className="text-xs text-text-muted">Missing</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border-glass bg-surface-card/50 px-4 py-3">
              <StatusDot status="unknown" />
              <div>
                <p className="text-sm font-medium">{bomMutation.data.total}</p>
                <p className="text-xs text-text-muted">Total</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-text-muted" />
            {(["all", "available", "missing"] as BomFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors capitalize ${
                  filter === f
                    ? "bg-accent-green/10 text-accent-green"
                    : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Table */}
          <GlassCard className="overflow-x-auto p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-glass text-left text-text-muted">
                  <th className="px-4 py-3">Ref</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Footprint</th>
                  <th className="px-4 py-3">LCSC #</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Availability</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-text-muted">
                      No items match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, i) => (
                    <tr
                      key={`${item.ref}-${i}`}
                      className="border-b border-border-glass/30 transition-colors hover:bg-surface-hover/30"
                    >
                      <td className="px-4 py-2 font-mono font-medium text-text-primary">
                        {item.ref}
                      </td>
                      <td className="px-4 py-2 text-text-primary">{item.value}</td>
                      <td className="px-4 py-2 font-mono text-text-muted">
                        {item.footprint ?? "-"}
                      </td>
                      <td className="px-4 py-2 font-mono text-accent-blue">
                        {item.lcsc ? (
                          <a
                            href={`https://www.lcsc.com/product-detail/${item.lcsc}.html`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {item.lcsc}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-2 text-text-muted">{item.quantity ?? 1}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <StatusDot status={availabilityStatus(item.availability)} />
                          <span className="capitalize text-text-muted">
                            {item.availability ?? "unknown"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </GlassCard>
        </>
      )}

      {!bomMutation.data && !bomMutation.isPending && (
        <GlassCard>
          <p className="py-6 text-center text-sm text-text-muted">
            Enter a KiCad project path and click Validate to check component availability.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
