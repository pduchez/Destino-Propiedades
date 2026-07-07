import CuentaPanel from "@/components/CuentaPanel";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function CrmCuentaPage() {
  const user = await getCurrentUser().catch(() => null);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi cuenta</h1>
        <p className="text-slate-500">Cambia tu contraseña o cierra sesión.</p>
      </div>
      <CuentaPanel username={user?.username} />
    </div>
  );
}
