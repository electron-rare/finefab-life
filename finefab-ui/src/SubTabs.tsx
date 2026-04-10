import { type ReactNode } from "react";

export interface Tab {
  id: string;
  label: string;
}

interface SubTabsProps {
  tabs: Tab[];
  activeId: string;
  renderLink: (tab: Tab, children: ReactNode) => ReactNode;
}

export function SubTabs({ tabs, activeId, renderLink }: SubTabsProps) {
  return (
    <nav className="flex gap-4 border-b border-border-glass px-4 py-2">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return renderLink(
          tab,
          <span
            key={tab.id}
            className={`pb-1 text-xs transition-colors ${
              isActive
                ? "border-b-2 border-accent-green text-accent-green"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {tab.label}
          </span>,
        );
      })}
    </nav>
  );
}
