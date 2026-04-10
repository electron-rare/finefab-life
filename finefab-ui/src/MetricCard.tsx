import { GlassCard } from "./GlassCard";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export function MetricCard({ label, value, subtitle, color = "text-accent-green" }: MetricCardProps) {
  return (
    <GlassCard>
      <p className="text-[9px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
      {subtitle && <p className="mt-1 text-xs text-text-dim">{subtitle}</p>}
    </GlassCard>
  );
}
