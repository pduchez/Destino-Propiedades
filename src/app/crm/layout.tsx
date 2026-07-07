import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/users";
import CrmShell from "@/components/CrmShell";

export const metadata: Metadata = {
  title: "CRM — Ventas | DestinoPropiedades.com",
  robots: { index: false, follow: false },
};

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/inicio");
  return (
    <CrmShell role={user.role} username={user.username}>
      {children}
    </CrmShell>
  );
}
