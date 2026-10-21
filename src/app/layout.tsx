import type { Metadata } from "next";
import { publicEnv } from "@/lib/env";
import "./globals.css";

// Todo se renderiza por solicitud: la CSP usa un nonce distinto en cada una (src/proxy.ts).
export const dynamic = "force-dynamic";

const appName = publicEnv.NEXT_PUBLIC_APP_NAME;

export const metadata: Metadata = {
  title: { default: appName, template: `%s · ${appName}` },
  description:
    "Herramientas de trabajo pedagógico para docentes, con IA como apoyo a tu criterio profesional.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
