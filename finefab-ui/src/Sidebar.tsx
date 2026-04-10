import { type ReactNode } from "react";

export interface NavItem {
  id: string;
  icon: ReactNode;
  label: string;
}

interface SidebarProps {
  items: NavItem[];
  activeId: string;
  renderLink: (item: NavItem, children: ReactNode) => ReactNode;
  footer?: ReactNode;
}

export function Sidebar({ items, activeId, renderLink, footer }: SidebarProps) {
  return (
    <aside className="flex w-14 flex-col items-center border-r border-border-glass bg-surface-card py-4">
      {items.map((item) => {
        const isActive = item.id === activeId;
        return renderLink(
          item,
          <div
            key={item.id}
            title={item.label}
            className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
              isActive
                ? "bg-accent-green/10 text-accent-green"
                : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
            }`}
          >
            {item.icon}
          </div>,
        );
      })}
      <div className="flex-1" />
      {footer}
    </aside>
  );
}
