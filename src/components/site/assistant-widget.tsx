"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PendingAction {
  name: string;
  summary: string;
  token: string;
}

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm the Heritage concierge. I can help you compare granite, quartz, and marble, browse our past projects, book a free design consultation, or start an estimate. What are you working on?",
};

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, pending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setPending(null);
    await callAssistant({ messages: next.slice(1) });
  }

  async function confirmPending() {
    if (!pending || loading) return;
    const action = pending;
    setPending(null);
    await callAssistant({
      messages: messages.slice(1),
      confirm: { token: action.token },
    });
  }

  function cancelPending() {
    setPending(null);
    setMessages((m) => [
      ...m,
      { role: "assistant", content: "No problem — I've cancelled that. Anything else?" },
    ]);
  }

  async function callAssistant(payload: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data?.error || "Something went wrong. Please try again." },
        ]);
        return;
      }
      if (data.message) {
        setMessages((m) => [...m, { role: "assistant", content: data.message }]);
      }
      if (data.pendingAction) setPending(data.pendingAction);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I couldn't reach the server. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open assistant"
          className="btn-gold fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[560px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2 text-white">
              <Bot className="h-5 w-5 text-gold" />
              <span className="font-semibold">Heritage Concierge</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="text-muted-foreground hover:text-gold"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                    m.role === "user"
                      ? "bg-gold text-primary-foreground"
                      : "bg-card text-foreground"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {pending && (
              <div className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm">
                <p className="mb-1 font-medium text-gold">Confirm action</p>
                <p className="mb-3 text-stone-200">{pending.summary}</p>
                <div className="flex gap-2">
                  <button
                    onClick={confirmPending}
                    disabled={loading}
                    className="btn-gold inline-flex items-center px-3 py-1.5 text-xs"
                  >
                    <Check className="mr-1 h-4 w-4" /> Confirm
                  </button>
                  <button
                    onClick={cancelPending}
                    disabled={loading}
                    className="btn-outline-gold px-3 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything…"
              disabled={loading}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-white outline-none focus:border-gold"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-gold flex h-9 w-9 items-center justify-center rounded-md disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
