export function Spinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
        <p className="text-xs text-text-muted">{text}</p>
      </div>
    </div>
  );
}
