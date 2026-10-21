import { publicEnv } from "@/lib/env";
import { NavLinks } from "./nav-links";

export function AppShell({
  userLabel,
  children,
}: {
  userLabel: string;
  children: React.ReactNode;
}) {
  const appName = publicEnv.NEXT_PUBLIC_APP_NAME;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a
        href="#contenido"
        className="focus:bg-surface sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2"
      >
        Saltar al contenido
      </a>

      <aside className="border-border bg-surface border-b md:w-72 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-3 md:py-5">
          <span className="text-primary text-lg font-bold">{appName}</span>
        </div>

        {/* En celular el menú es un desplegable nativo (sin JavaScript); en escritorio siempre visible. */}
        <details className="group px-3 pb-3 md:hidden">
          <summary className="border-border flex min-h-11 cursor-pointer items-center rounded-lg border px-3 text-sm font-semibold">
            Menú
          </summary>
          <nav aria-label="Principal" className="mt-2">
            <NavLinks />
          </nav>
        </details>
        <nav aria-label="Principal" className="hidden px-3 pb-4 md:block">
          <NavLinks />
        </nav>

        <div className="border-border text-muted-foreground hidden border-t px-4 py-3 text-xs md:block">
          {userLabel}
        </div>
      </aside>

      <main id="contenido" className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
        {children}
      </main>
    </div>
  );
}
