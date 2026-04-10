export interface LogLine {
  timestamp?: string;
  level?: "INFO" | "WARN" | "ERROR";
  message: string;
}

const levelColors: Record<string, string> = {
  INFO: "text-accent-blue",
  WARN: "text-accent-amber",
  ERROR: "text-accent-red",
};

interface TerminalProps {
  lines: LogLine[];
  title?: string;
  className?: string;
}

export function Terminal({ lines, title, className = "" }: TerminalProps) {
  return (
    <div className={`terminal-box ${className}`}>
      {title && <p className="mb-2 text-text-muted">{title}</p>}
      <div className="space-y-0.5 overflow-auto" style={{ maxHeight: "300px" }}>
        {lines.map((line, i) => (
          <div key={i}>
            {line.timestamp && <span className="text-accent-green">{line.timestamp} </span>}
            {line.level && <span className={levelColors[line.level] || "text-text-muted"}>{line.level} </span>}
            <span className="text-text-primary">{line.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
