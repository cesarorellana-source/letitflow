import { AppShell } from "@/components/app-shell/app-shell";
import { requireUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell userLabel={user.displayName ?? user.email ?? "Sesión iniciada"}>{children}</AppShell>
  );
}
