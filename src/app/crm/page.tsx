import CuentaPanel from "@/components/CuentaPanel";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const user = await getCurrentUser().catch(() => null);
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold text-brand">DestinoPropiedades</div>
          <div className="text-sm text-slate-500">CRM de ventas</div>
        </div>
        {user && (
          <span className="badge bg-white text-slate-600 ring-1 ring-slate-200">
            {user.username}
          </span>
        )}
      </div>

      <div className="card space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">
          👋 Bienvenido{user ? `, ${user.username}` : ""}
        </h1>
        <p className="text-slate-600">
          El <strong>CRM</strong> está en construcción. Aquí gestionarás tus
          clientes, prospectos y seguimiento de ventas. Te avisaremos cuando esté
          disponible.
        </p>
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
          🚧 Módulo en desarrollo. Por ahora puedes administrar tu cuenta abajo.
        </div>
      </div>

      <CuentaPanel username={user?.username} />
    </div>
  );
}
