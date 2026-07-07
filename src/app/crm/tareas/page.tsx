"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

interface Task {
  id: string;
  body: string;
  dueAt: string | null;
  createdAt: string;
  lead: { id: string; name: string; stage: string; phone: string };
  user?: { username: string; displayName: string } | null;
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleString("es-SV", { dateStyle: "medium", timeStyle: "short" }) : "sin fecha";

export default function TareasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<{ tasks: Task[] }>("/api/crm/tasks");
      setTasks(d.tasks);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function complete(t: Task) {
    await api(`/api/crm/leads/${t.lead.id}/activities`, {
      method: "PATCH",
      body: JSON.stringify({ activityId: t.id, done: true }),
    });
    load();
  }

  const now = Date.now();
  const overdue = tasks.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now);
  const upcoming = tasks.filter((t) => !t.dueAt || new Date(t.dueAt).getTime() >= now);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Tareas y follow-ups</h1>
      {loading ? (
        <div className="card">Cargando…</div>
      ) : tasks.length === 0 ? (
        <div className="card text-slate-400">No hay tareas pendientes. 🎉</div>
      ) : (
        <>
          {overdue.length > 0 && (
            <Section title={`🚨 Vencidas (${overdue.length})`} tasks={overdue} onDone={complete} danger />
          )}
          {upcoming.length > 0 && (
            <Section title={`⏰ Próximas (${upcoming.length})`} tasks={upcoming} onDone={complete} />
          )}
        </>
      )}
    </div>
  );
}

function Section({
  title, tasks, onDone, danger,
}: {
  title: string; tasks: Task[]; onDone: (t: Task) => void; danger?: boolean;
}) {
  return (
    <div className="space-y-2">
      <h2 className={`text-sm font-semibold ${danger ? "text-red-600" : "text-slate-600"}`}>{title}</h2>
      {tasks.map((t) => (
        <div key={t.id} className={`card flex items-center gap-3 ${danger ? "border-red-200" : ""}`}>
          <button
            onClick={() => onDone(t)}
            title="Marcar como hecha"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50"
          >
            ✓
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-700">{t.body}</p>
            <div className="text-xs text-slate-400">
              <Link href={`/crm/leads/${t.lead.id}`} className="text-brand hover:underline">
                {t.lead.name}
              </Link>{" "}
              · {fmt(t.dueAt)} · {t.user?.displayName || t.user?.username || ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
