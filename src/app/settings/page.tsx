"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

interface Strategy {
  brandName: string;
  portalUrl: string;
  mission: string;
  toneOfVoice: string;
  targetAudience: string;
  generalInstructions: string;
  language: string;
  defaultHashtags: string;
}

interface Account {
  network: string;
  displayName: string;
  enabled: boolean;
  autoPublish: boolean;
  configuredKeys: string[];
  readyToPublish: boolean;
}

const ACCOUNT_FIELDS: Record<string, { key: string; label: string }[]> = {
  facebook: [
    { key: "META_PAGE_ID", label: "ID de la página" },
    { key: "META_PAGE_ACCESS_TOKEN", label: "Page Access Token" },
  ],
  instagram: [
    { key: "META_IG_USER_ID", label: "IG User ID" },
    { key: "META_PAGE_ACCESS_TOKEN", label: "Page Access Token" },
  ],
  x: [
    { key: "X_API_KEY", label: "API Key" },
    { key: "X_API_SECRET", label: "API Secret" },
    { key: "X_ACCESS_TOKEN", label: "Access Token" },
    { key: "X_ACCESS_SECRET", label: "Access Secret" },
  ],
  tiktok: [{ key: "TIKTOK_ACCESS_TOKEN", label: "Access Token" }],
};

const NET_LABEL: Record<string, string> = {
  facebook: "📘 Facebook",
  instagram: "📸 Instagram",
  x: "✖️ X (Twitter)",
  tiktok: "🎵 TikTok",
};

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
      <StrategySection />
      <AccountsSection />
    </div>
  );
}

function StrategySection() {
  const [s, setS] = useState<Strategy | null>(null);
  const [hashtags, setHashtags] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<Strategy>("/api/strategy").then((d) => {
      setS(d);
      try {
        setHashtags((JSON.parse(d.defaultHashtags) as string[]).join(", "));
      } catch {
        setHashtags("");
      }
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!s) return;
    setMsg("");
    try {
      await api("/api/strategy", {
        method: "PATCH",
        body: JSON.stringify({
          ...s,
          defaultHashtags: hashtags
            .split(/[,\n]/)
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      setMsg("Guardado ✓");
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  if (!s) return <div className="card">Cargando…</div>;
  const set = (k: keyof Strategy) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setS({ ...s, [k]: e.target.value });

  return (
    <form onSubmit={save} className="card space-y-4">
      <h2 className="text-lg font-semibold">Estrategia de marca</h2>
      <p className="text-sm text-slate-500">
        Esta es la &quot;instrucción estratégica general&quot; que alimenta toda la generación de contenido.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Nombre de marca</label>
          <input className="input" value={s.brandName} onChange={set("brandName")} />
        </div>
        <div>
          <label className="label">URL del portal</label>
          <input className="input" value={s.portalUrl} onChange={set("portalUrl")} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Misión</label>
          <textarea className="input" rows={2} value={s.mission} onChange={set("mission")} />
        </div>
        <div>
          <label className="label">Tono de voz</label>
          <textarea className="input" rows={2} value={s.toneOfVoice} onChange={set("toneOfVoice")} />
        </div>
        <div>
          <label className="label">Audiencia objetivo</label>
          <textarea className="input" rows={2} value={s.targetAudience} onChange={set("targetAudience")} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Instrucciones generales de mercadeo</label>
          <textarea className="input" rows={3} value={s.generalInstructions} onChange={set("generalInstructions")} />
        </div>
        <div>
          <label className="label">Hashtags por defecto (coma)</label>
          <input className="input" value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
        </div>
        <div>
          <label className="label">Idioma</label>
          <input className="input" value={s.language} onChange={set("language")} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-primary">Guardar estrategia</button>
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
      </div>
    </form>
  );
}

function AccountsSection() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  async function load() {
    setAccounts(await api<Account[]>("/api/accounts"));
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Cuentas de redes sociales</h2>
        <p className="text-sm text-slate-500">
          Configura las credenciales para publicar directamente. En Fase 1 (aprobación
          humana) no son obligatorias: puedes generar y descargar borradores. Las
          credenciales se guardan en la base de datos y no se muestran después de guardar.
        </p>
      </div>
      {accounts.map((a) => (
        <AccountCard key={a.network} account={a} onChange={load} />
      ))}
    </div>
  );
}

function AccountCard({ account, onChange }: { account: Account; onChange: () => void }) {
  const fields = ACCOUNT_FIELDS[account.network] ?? [];
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState(account.enabled);
  const [autoPublish, setAutoPublish] = useState(account.autoPublish);
  const [msg, setMsg] = useState("");

  async function save() {
    setMsg("");
    try {
      await api(`/api/accounts/${account.network}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled, autoPublish, config: creds }),
      });
      setCreds({});
      setMsg("Guardado ✓");
      onChange();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{NET_LABEL[account.network] ?? account.network}</span>
        <span className={`badge ${account.readyToPublish ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
          {account.readyToPublish ? "Listo para publicar" : "Sin credenciales"}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            <input
              className="input"
              type="password"
              placeholder={account.configuredKeys.includes(f.key) ? "•••••• (guardado)" : ""}
              value={creds[f.key] ?? ""}
              onChange={(e) => setCreds({ ...creds, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Habilitada
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-500" title="Fase 2: publicar sin aprobación humana">
          <input type="checkbox" checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} />
          Auto-publicar (Fase 2)
        </label>
        <button className="btn-primary ml-auto" onClick={save}>Guardar</button>
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
      </div>
    </div>
  );
}
