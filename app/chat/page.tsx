"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Markdown } from "@/components/Markdown";
import { DeadlineBadge, LevelBadge } from "@/components/ServiceCard";
import { getServiceById } from "@/lib/data";
import { uid, useLocalStorage } from "@/lib/store";
import type { ChatMessage, ChatThread, DashboardState } from "@/lib/types";

const SUGGESTIONS = [
  "I need help paying rent",
  "Help me apply for SNAP",
  "What should I bring to my appointment?",
  "Find utility assistance in Chicago",
];

const EMPTY_DASH: DashboardState = { applications: [], customDeadlines: [], saved: [], tasks: {} };

function nowIso() {
  return new Date().toISOString();
}

function ChatInner() {
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get("service");

  const { value: threads, set: setThreads } = useLocalStorage<ChatThread[]>("govserv:chats", []);
  const { value: dash, set: setDash } = useLocalStorage<DashboardState>("govserv:v1", EMPTY_DASH);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [planChecks, setPlanChecks] = useState<Record<string, Record<number, boolean>>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoSent = useRef(false);

  const active = useMemo(() => threads.find((t) => t.id === activeId) ?? null, [threads, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, sending]);

  const newThread = (firstMessage?: ChatMessage): string => {
    const id = uid();
    const now = nowIso();
    const thread: ChatThread = {
      id,
      title: firstMessage && firstMessage.role === "user" ? firstMessage.content.slice(0, 42) : "New conversation",
      messages: firstMessage ? [firstMessage] : [],
      createdAt: now,
      updatedAt: now,
    };
    setThreads((prev) => [thread, ...prev]);
    setActiveId(id);
    return id;
  };

  const appendMessage = (threadId: string, msg: ChatMessage) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;
        const title =
          t.messages.length === 0 && msg.role === "user" ? msg.content.slice(0, 42) : t.title;
        return { ...t, title, messages: [...t.messages, msg], updatedAt: nowIso() };
      })
    );
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    const userMsg: ChatMessage = { role: "user", content, createdAt: nowIso() };
    const threadId = activeId ?? newThread(userMsg);
    if (activeId) appendMessage(threadId, userMsg);
    setInput("");
    setSending(true);
    try {
      const history = [
        ...((activeId ? active?.messages : []) ?? []),
        userMsg,
      ].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, threadId }),
      });
      const data = await res.json();
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: typeof data.reply === "string" ? data.reply : "Sorry — I had trouble answering that. Please try again.",
        serviceCards: Array.isArray(data.serviceCards) ? data.serviceCards : undefined,
        actionPlan: Array.isArray(data.actionPlan) ? data.actionPlan : undefined,
        createdAt: nowIso(),
      };
      appendMessage(threadId, assistantMsg);
    } catch {
      appendMessage(threadId, {
        role: "assistant",
        content: "Sorry — something went wrong reaching GovGuide. Please check your connection and try again.",
        createdAt: nowIso(),
      });
    } finally {
      setSending(false);
    }
  };

  // Deep-link from service pages: ?service=<id>
  useEffect(() => {
    if (!serviceParam || autoSent.current) return;
    const s = getServiceById(serviceParam);
    if (!s) return;
    autoSent.current = true;
    setInput("");
    void send(`Tell me about the "${s.name}" program — am I eligible, what do I need to bring, and how do I apply?`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceParam]);

  const toggleSave = (serviceId: string) => {
    const saved = dash.saved.some((s) => s.serviceId === serviceId);
    setDash((p) =>
      saved
        ? { ...p, saved: p.saved.filter((s) => s.serviceId !== serviceId) }
        : { ...p, saved: [...p.saved, { id: uid(), serviceId, savedAt: nowIso() }] }
    );
  };

  const trackApp = (serviceId: string) => {
    if (dash.applications.some((a) => a.serviceId === serviceId)) return;
    const now = nowIso();
    setDash((p) => ({
      ...p,
      applications: [...p.applications, { id: uid(), serviceId, status: "to-start", notes: "", createdAt: now, updatedAt: now }],
    }));
  };

  const togglePlan = (msgKey: string, idx: number) =>
    setPlanChecks((p) => ({ ...p, [msgKey]: { ...(p[msgKey] ?? {}), [idx]: !(p[msgKey]?.[idx] ?? false) } }));

  const deleteThread = (id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeId === id) setActiveId(null);
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 px-4">
        <button
          className="rounded-lg p-2 text-navy-950 md:hidden"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Toggle chat history"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-950 font-display text-base font-bold text-gold-400">G</span>
          <span className="font-display text-lg font-bold text-navy-950">GovGuide</span>
        </Link>
        <span className="ml-1 hidden rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 sm:inline">
          Live
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-slate-100">
            Dashboard
          </Link>
          <button
            onClick={() => { const id = newThread(); setActiveId(id); setSidebarOpen(false); }}
            className="rounded-lg bg-navy-950 px-3.5 py-2 text-sm font-semibold text-white hover:bg-navy-800"
          >
            New chat
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "fixed inset-y-0 left-0 z-40 flex w-72" : "hidden"
          } flex-col border-r border-slate-200 bg-slate-50 md:static md:flex md:w-72`}
          aria-label="Chat history"
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4 md:hidden">
            <span className="font-semibold text-navy-950">Chats</span>
            <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-slate-500" aria-label="Close chat history">
              ✕
            </button>
          </div>
          <div className="thin-scroll flex-1 overflow-y-auto p-3">
            {threads.length === 0 ? (
              <p className="px-2 py-4 text-sm text-slate-500">No conversations yet. Start one below.</p>
            ) : (
              <ul className="space-y-1">
                {threads.map((t) => (
                  <li key={t.id}>
                    <div
                      className={`group flex items-center gap-1 rounded-lg px-3 py-2.5 text-sm transition ${
                        t.id === activeId ? "bg-white font-semibold text-navy-950 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white"
                      }`}
                    >
                      <button onClick={() => { setActiveId(t.id); setSidebarOpen(false); }} className="min-w-0 flex-1 truncate text-left">
                        {t.title || "New conversation"}
                      </button>
                      <button
                        onClick={() => deleteThread(t.id)}
                        className="hidden rounded px-1.5 py-0.5 text-xs text-slate-400 hover:text-red-700 group-hover:block"
                        aria-label="Delete conversation"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-slate-200 p-3">
            <Link href="/services" className="block rounded-lg bg-white px-3 py-2.5 text-center text-sm font-semibold text-navy-950 ring-1 ring-slate-200 hover:ring-navy-950">
              Browse services directory
            </Link>
          </div>
        </aside>

        {/* Main panel */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="thin-scroll flex-1 overflow-y-auto px-4 py-6 sm:px-8">
            <div className="mx-auto max-w-3xl">
              {!active || active.messages.length === 0 ? (
                <div className="fade-up py-10">
                  <h1 className="font-display text-3xl font-bold text-navy-950 sm:text-4xl">
                    Hi, I&apos;m GovGuide.
                  </h1>
                  <p className="mt-3 max-w-xl leading-relaxed text-slate-600">
                    Tell me your situation in plain language and I&apos;ll match you
                    to real government programs — with eligibility, documents, and
                    deadlines. I only cite programs in our verified database.
                  </p>
                  <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => void send(s)}
                        className="rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm font-medium text-navy-950 shadow-sm transition hover:border-gold-500 hover:shadow"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {active.messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                          m.role === "user"
                            ? "bg-navy-950 text-white"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {m.role === "assistant" ? (
                          <Markdown text={m.content} />
                        ) : (
                          <p className="text-sm leading-relaxed">{m.content}</p>
                        )}

                        {/* Inline service cards */}
                        {m.role === "assistant" && m.serviceCards && m.serviceCards.length > 0 && (
                          <div className="mt-3 space-y-2.5">
                            {m.serviceCards.map((id) => {
                              const s = getServiceById(id);
                              if (!s) return null;
                              const isSaved = dash.saved.some((x) => x.serviceId === id);
                              const isTracked = dash.applications.some((x) => x.serviceId === id);
                              return (
                                <div key={id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <LevelBadge level={s.scope.level} />
                                    <DeadlineBadge service={s} />
                                  </div>
                                  <Link href={`/services/${s.id}`} className="mt-1.5 block font-display text-base font-bold text-navy-950 hover:underline">
                                    {s.name}
                                  </Link>
                                  <p className="mt-0.5 text-xs text-slate-500">{s.agency}</p>
                                  <div className="mt-3 flex gap-2">
                                    <button
                                      onClick={() => toggleSave(id)}
                                      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                        isSaved ? "bg-emerald-600 text-white" : "bg-slate-100 text-navy-950 hover:bg-slate-200"
                                      }`}
                                    >
                                      {isSaved ? "Saved ✓" : "Save"}
                                    </button>
                                    <button
                                      onClick={() => trackApp(id)}
                                      disabled={isTracked}
                                      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                        isTracked ? "cursor-default bg-slate-100 text-slate-400" : "bg-gold-500 text-navy-950 hover:bg-gold-400"
                                      }`}
                                    >
                                      {isTracked ? "Tracked ✓" : "Track"}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Action plan with checkboxes */}
                        {m.role === "assistant" && m.actionPlan && m.actionPlan.length > 0 && (
                          <div className="mt-3 rounded-xl border border-gold-500/40 bg-gold-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-gold-600">Your action plan</p>
                            <ul className="mt-2 space-y-1.5">
                              {m.actionPlan.map((step, si) => {
                                const key = m.createdAt;
                                const checked = planChecks[key]?.[si] ?? false;
                                return (
                                  <li key={si}>
                                    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-navy-950">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => togglePlan(key, si)}
                                        className="mt-0.5 h-4 w-4 accent-gold-600"
                                      />
                                      <span className={checked ? "line-through text-slate-500" : ""}>{step}</span>
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {sending && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-3.5" aria-label="GovGuide is typing">
                        <span className="typing-dot h-2 w-2 rounded-full bg-navy-700" />
                        <span className="typing-dot h-2 w-2 rounded-full bg-navy-700" />
                        <span className="typing-dot h-2 w-2 rounded-full bg-navy-700" />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-8">
            <div className="mx-auto max-w-3xl">
              <form
                onSubmit={(e) => { e.preventDefault(); void send(input); }}
                className="flex items-end gap-2"
              >
                <label htmlFor="chat-input" className="sr-only">Message GovGuide</label>
                <textarea
                  id="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); }
                  }}
                  placeholder="Describe your situation — e.g. I lost my job and my rent is due"
                  rows={1}
                  className="max-h-32 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-100"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="rounded-xl bg-navy-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-40"
                >
                  Send
                </button>
              </form>
              <p className="mt-1.5 text-center text-xs text-slate-400">
                GovGuide cites only verified programs from the GovServ database. Always confirm details with the agency.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-500">Loading GovGuide…</div>}>
      <ChatInner />
    </Suspense>
  );
}
