import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CircuitBoard,
  Box,
  FileSpreadsheet,
  Bot,
  FolderOpen,
  Settings,
  LogOut,
} from "lucide-react";
import { type ReactNode } from "react";
import { Spinner } from "@finefab/ui";
import { useAuth } from "./AuthProvider";

interface NavItem {
  to: string;
  icon: ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { to: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
  { to: "/schematic", icon: <CircuitBoard size={20} />, label: "Schematic" },
  { to: "/3d", icon: <Box size={20} />, label: "3D Model" },
  { to: "/bom", icon: <FileSpreadsheet size={20} />, label: "BOM" },
  { to: "/ai", icon: <Bot size={20} />, label: "AI Assistant" },
  { to: "/projects", icon: <FolderOpen size={20} />, label: "Projects" },
  { to: "/settings", icon: <Settings size={20} />, label: "Settings" },
];

function UserFooter() {
  const { user, logout } = useAuth();
  const initials = (user?.profile?.preferred_username ?? "?").slice(0, 2).toUpperCase();
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-green/20 text-xs font-medium text-accent-green"
        title={user?.profile?.email ?? ""}
      >
        {initials}
      </div>
      <button
        onClick={() => logout()}
        title="Sign out"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-accent-red transition-colors"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="flex w-14 flex-col items-center border-r border-border-glass bg-surface-card py-4">
      {navItems.map((item) => {
        const isActive =
          pathname === item.to ||
          (item.to !== "/" && pathname.startsWith(item.to));
        return (
          <Link
            key={item.to}
            to={item.to}
            title={item.label}
            className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
              isActive
                ? "bg-accent-green/10 text-accent-green"
                : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
            }`}
          >
            {item.icon}
          </Link>
        );
      })}
      <div className="flex-1" />
      <UserFooter />
    </aside>
  );
}

export function AppShell() {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-bg">
        <Spinner text="Authenticating..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-surface-bg">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-700/50 bg-gray-800/50 p-10 shadow-xl">
          <h1 className="text-3xl font-bold text-white">EDA Cockpit</h1>
          <p className="text-sm text-gray-400">Authentification requise</p>
          <button
            onClick={() => login()}
            className="mt-2 rounded-lg bg-emerald-500 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-emerald-400 hover:shadow-emerald-500/25"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-surface-bg text-text-primary">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
