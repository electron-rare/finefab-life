type Status = "healthy" | "unhealthy" | "unknown";
const colors: Record<Status, string> = {
  healthy: "bg-accent-green",
  unhealthy: "bg-accent-red",
  unknown: "bg-text-muted",
};

interface StatusDotProps {
  status: Status;
  label?: string;
}

export function StatusDot({ status, label }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block h-2 w-2 rounded-full ${colors[status]}`} />
      {label && <span className="text-sm text-text-muted">{label}</span>}
    </span>
  );
}
