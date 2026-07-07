import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/users";

export const metadata: Metadata = {
  title: "CRM — Ventas | DestinoPropiedades.com",
  robots: { index: false, follow: false },
};

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Solo usuarios autenticados. Si no hay sesión, al login del área privada.
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/acceso-ventas");
  return <div className="min-h-screen bg-slate-100">{children}</div>;
}
