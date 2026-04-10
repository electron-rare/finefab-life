import { useState, useEffect } from "react";
import { Settings, Globe, Eye, Monitor, Save } from "lucide-react";
import { GlassCard } from "@finefab/ui";

const PREFS_KEY = "eda-viewer-prefs";

interface ViewerPrefs {
  defaultMode: "upload" | "project";
  kicanvasControls: "full" | "basic";
  threeCameraFov: number;
  threeBackground: string;
  autoRefreshInterval: number;
}

const defaultPrefs: ViewerPrefs = {
  defaultMode: "upload",
  kicanvasControls: "full",
  threeCameraFov: 50,
  threeBackground: "#0a0a0f",
  autoRefreshInterval: 10,
};

function loadPrefs(): ViewerPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return defaultPrefs;
}

export function SettingsPage() {
  const [prefs, setPrefs] = useState<ViewerPrefs>(loadPrefs);
  const [saved, setSaved] = useState(false);

  const cadUrl = import.meta.env.VITE_CAD_URL || "https://api.saillant.cc/eda";
  const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || "https://auth.saillant.cc";
  const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM || "electro_life";
  const keycloakClient = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "eda-web";

  function savePrefs() {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function resetPrefs() {
    setPrefs(defaultPrefs);
    localStorage.removeItem(PREFS_KEY);
  }

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-6">
      <div className="flex items-center gap-3">
        <Settings size={20} className="text-text-muted" />
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      {/* Gateway info */}
      <GlassCard>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-muted">
          <Globe size={14} />
          Gateway Configuration
        </h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg border border-border-glass/50 bg-surface-bg/50 px-4 py-3">
            <div>
              <p className="text-xs text-text-muted">EDA Gateway URL</p>
              <p className="font-mono text-sm text-text-primary">{cadUrl}</p>
            </div>
            <span className="rounded border border-border-glass px-2 py-0.5 text-xs text-text-muted">
              VITE_CAD_URL
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border-glass/50 bg-surface-bg/50 px-4 py-3">
            <div>
              <p className="text-xs text-text-muted">Keycloak Authority</p>
              <p className="font-mono text-sm text-text-primary">
                {keycloakUrl}/realms/{keycloakRealm}
              </p>
            </div>
            <span className="rounded border border-border-glass px-2 py-0.5 text-xs text-text-muted">
              VITE_KEYCLOAK_*
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border-glass/50 bg-surface-bg/50 px-4 py-3">
            <div>
              <p className="text-xs text-text-muted">OIDC Client ID</p>
              <p className="font-mono text-sm text-text-primary">{keycloakClient}</p>
            </div>
            <span className="rounded border border-border-glass px-2 py-0.5 text-xs text-text-muted">
              VITE_KEYCLOAK_CLIENT_ID
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-text-dim">
          These values are baked into the bundle at build time. To change them, rebuild with the
          appropriate environment variables.
        </p>
      </GlassCard>

      {/* Viewer preferences */}
      <GlassCard>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-muted">
          <Eye size={14} />
          Viewer Preferences
        </h2>

        <div className="flex flex-col gap-4">
          {/* Schematic default mode */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-muted">
              Schematic default mode
            </label>
            <div className="flex gap-2">
              {(["upload", "project"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPrefs((p) => ({ ...p, defaultMode: m }))}
                  className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    prefs.defaultMode === m
                      ? "bg-accent-green/10 text-accent-green"
                      : "border border-border-glass text-text-muted hover:bg-surface-hover hover:text-text-primary"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* KiCanvas controls */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-muted">
              KiCanvas controls
            </label>
            <div className="flex gap-2">
              {(["full", "basic"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setPrefs((p) => ({ ...p, kicanvasControls: c }))}
                  className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    prefs.kicanvasControls === c
                      ? "bg-accent-green/10 text-accent-green"
                      : "border border-border-glass text-text-muted hover:bg-surface-hover hover:text-text-primary"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 3D Camera FOV */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-muted">
              3D Camera FOV: {prefs.threeCameraFov}°
            </label>
            <input
              type="range"
              min={20}
              max={120}
              value={prefs.threeCameraFov}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, threeCameraFov: parseInt(e.target.value) }))
              }
              className="w-full accent-accent-green"
            />
          </div>

          {/* Auto-refresh interval */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-muted">
              Dashboard auto-refresh: {prefs.autoRefreshInterval}s
            </label>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={prefs.autoRefreshInterval}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, autoRefreshInterval: parseInt(e.target.value) }))
              }
              className="w-full accent-accent-green"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={savePrefs}
            className="flex items-center gap-2 rounded-lg bg-accent-green/10 px-4 py-2 text-sm font-medium text-accent-green transition-colors hover:bg-accent-green/20"
          >
            <Save size={14} />
            {saved ? "Saved!" : "Save preferences"}
          </button>
          <button
            onClick={resetPrefs}
            className="rounded-lg border border-border-glass px-4 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            Reset to defaults
          </button>
        </div>
      </GlassCard>

      {/* App info */}
      <GlassCard>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-muted">
          <Monitor size={14} />
          About
        </h2>
        <div className="flex flex-col gap-2 text-xs text-text-muted">
          <p>
            <span className="text-text-primary font-medium">EDA Cockpit</span> — eda.saillant.cc
          </p>
          <p>Part of the FineFab platform (L-electron-Rare)</p>
          <p>
            Stack: React 19 · TanStack Router · @finefab/ui · KiCanvas · Three.js
          </p>
          <p className="text-text-dim">Built with FineFab design system — dark glassmorphism</p>
        </div>
      </GlassCard>
    </div>
  );
}
