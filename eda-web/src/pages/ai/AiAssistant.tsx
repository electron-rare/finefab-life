import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, Bot, User, Search, CircuitBoard } from "lucide-react";
import { GlassCard, Spinner } from "@finefab/ui";
import ReactMarkdown from "react-markdown";
import { api, type ComponentSuggestion } from "../../lib/api";

type Mode = "component" | "review";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "components" | "markdown";
  suggestions?: ComponentSuggestion[];
}

export function AiAssistant() {
  const [mode, setMode] = useState<Mode>("component");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm the EDA AI Assistant. In **Component Search** mode I can suggest components for your design. In **Schematic Review** mode I can analyze your KiCad project and provide feedback.",
      type: "markdown",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const componentMutation = useMutation({
    mutationFn: (query: string) => api.aiComponentSuggest(query),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Found ${data.suggestions.length} component suggestion(s) for "${data.query}":`,
          type: "components",
          suggestions: data.suggestions,
        },
      ]);
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${(err as Error).message}`,
          type: "text",
        },
      ]);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (projectPath: string) => api.aiSchematicReview(projectPath),
    onSuccess: (data) => {
      const md =
        data.markdown ||
        `## Schematic Review: ${data.project}\n\n${data.summary}\n\n### Issues\n${data.issues.map((i) => `- ${i}`).join("\n")}\n\n### Suggestions\n${data.suggestions.map((s) => `- ${s}`).join("\n")}`;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: md,
          type: "markdown",
        },
      ]);
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Review failed: ${(err as Error).message}`,
          type: "text",
        },
      ]);
    },
  });

  const isPending = componentMutation.isPending || reviewMutation.isPending;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = () => {
    const query = input.trim();
    if (!query || isPending) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: query, type: "text" },
    ]);
    setInput("");

    if (mode === "component") {
      componentMutation.mutate(query);
    } else {
      reviewMutation.mutate(query);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header + mode selector */}
      <div className="flex items-center gap-3 border-b border-border-glass px-6 py-3">
        <Bot size={20} className="text-accent-green" />
        <h1 className="text-base font-semibold">AI EDA Assistant</h1>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setMode("component")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "component"
                ? "bg-accent-green/10 text-accent-green"
                : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
            }`}
          >
            <Search size={12} />
            Component Search
          </button>
          <button
            onClick={() => setMode("review")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "review"
                ? "bg-accent-blue/10 text-accent-blue"
                : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
            }`}
          >
            <CircuitBoard size={12} />
            Schematic Review
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                msg.role === "user"
                  ? "bg-accent-blue/20 text-accent-blue"
                  : "bg-accent-green/20 text-accent-green"
              }`}
            >
              {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div
              className={`max-w-[75%] rounded-xl border px-4 py-3 ${
                msg.role === "user"
                  ? "border-accent-blue/20 bg-accent-blue/5 text-text-primary"
                  : "border-border-glass bg-surface-card/60 text-text-primary"
              }`}
            >
              {msg.type === "markdown" ? (
                <div className="prose prose-invert prose-sm max-w-none text-text-primary [&_code]:font-mono [&_code]:text-accent-green [&_h2]:text-accent-green [&_h3]:text-accent-blue [&_a]:text-accent-blue">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.type === "components" && msg.suggestions ? (
                <div>
                  <p className="mb-3 text-sm">{msg.content}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {msg.suggestions.map((s, si) => (
                      <div
                        key={si}
                        className="rounded-lg border border-border-glass/50 bg-surface-bg/50 p-3"
                      >
                        <p className="font-mono text-sm font-medium text-accent-green">
                          {s.name}
                        </p>
                        {s.value && (
                          <p className="text-xs text-accent-blue">{s.value}</p>
                        )}
                        {s.description && (
                          <p className="mt-1 text-xs text-text-muted">{s.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          {s.package && (
                            <span className="rounded border border-border-glass px-1.5 py-0.5 font-mono text-xs text-text-muted">
                              {s.package}
                            </span>
                          )}
                          {s.lcsc && (
                            <a
                              href={`https://www.lcsc.com/product-detail/${s.lcsc}.html`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-accent-blue hover:underline"
                            >
                              LCSC: {s.lcsc}
                            </a>
                          )}
                          {s.price && (
                            <span className="ml-auto text-xs text-accent-amber">{s.price}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-green/20 text-accent-green">
              <Bot size={16} />
            </div>
            <div className="rounded-xl border border-border-glass bg-surface-card/60 px-4 py-3">
              <Spinner text="Thinking..." />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border-glass px-6 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSubmit(); }}
            placeholder={
              mode === "component"
                ? "Search for a component (e.g. 100nF 0402 capacitor)…"
                : "Enter KiCad project path for review…"
            }
            disabled={isPending}
            className="flex-1 rounded-lg border border-border-glass bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-green focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isPending}
            className="flex items-center gap-2 rounded-lg bg-accent-green/10 px-4 py-2 text-sm font-medium text-accent-green transition-colors hover:bg-accent-green/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="mt-1 text-xs text-text-dim">
          Mode:{" "}
          <span className={mode === "component" ? "text-accent-green" : "text-accent-blue"}>
            {mode === "component" ? "Component Search" : "Schematic Review"}
          </span>
        </p>
      </div>
    </div>
  );
}
