import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { sendMagicLink, signInWithGoogle } from "./actions";

export const metadata = { title: "Iniciar sesión" };

const ERRORS: Record<string, string> = {
  email: "Escribe un correo válido.",
  send: "No pudimos iniciar el acceso. Inténtalo de nuevo en unos minutos.",
  callback: "El enlace no es válido o expiró. Pide uno nuevo.",
  config: "La plataforma aún no está conectada a su base de datos.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const error = first(params.error);
  const sent = first(params.sent) === "1";
  const next = safeNextPath(first(params.next));
  const configured = isSupabaseConfigured();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-primary text-center text-3xl font-bold">
        {publicEnv.NEXT_PUBLIC_APP_NAME}
      </h1>
      <p className="text-muted-foreground mt-2 text-center">
        Tu trabajo pedagógico, en un solo lugar.
      </p>

      <Card className="mt-8 space-y-5">
        {!configured && (
          <p role="status" className="bg-accent-soft text-accent rounded-lg p-3 text-sm">
            <strong>Configuración pendiente.</strong> Conecta un proyecto de Supabase (ver
            <code className="mx-1">.env.example</code> y el README) para activar el inicio de
            sesión.
          </p>
        )}

        {error && ERRORS[error] && (
          <p role="alert" className="bg-danger-soft text-danger rounded-lg p-3 text-sm">
            {ERRORS[error]}
          </p>
        )}

        {sent && (
          <p role="status" className="bg-success-soft text-success rounded-lg p-3 text-sm">
            Si el correo es válido, te enviamos un enlace para entrar. Revisa tu bandeja de entrada.
          </p>
        )}

        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <Button type="submit" variant="outline" className="w-full" disabled={!configured}>
            Continuar con Google
          </Button>
        </form>

        <div className="text-muted-foreground flex items-center gap-3 text-xs" aria-hidden="true">
          <span className="bg-border h-px flex-1" />
          o
          <span className="bg-border h-px flex-1" />
        </div>

        <form action={sendMagicLink} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={!configured}
              className="border-border bg-surface min-h-11 w-full rounded-lg border px-3 text-base disabled:opacity-60"
            />
          </div>
          <Button type="submit" className="w-full" disabled={!configured}>
            Enviarme un enlace de acceso
          </Button>
        </form>
      </Card>

      <p className="text-muted-foreground mt-6 text-center text-xs">
        Tu información pedagógica es privada por defecto: solo la ves tú y quienes tú invites.
      </p>
    </main>
  );
}
