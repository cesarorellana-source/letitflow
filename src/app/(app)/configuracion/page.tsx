import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMyWorkspaces, requireUser } from "@/lib/auth/session";

export const metadata = { title: "Configuración e integraciones" };

const ROLE_LABEL = {
  viewer: "Lector",
  editor: "Editor",
  admin: "Administrador",
  owner: "Propietario",
} as const;
const KIND_LABEL = { personal: "Personal", team: "Equipo", institution: "Institución" } as const;

export default async function SettingsPage() {
  const user = await requireUser();
  const workspaces = await getMyWorkspaces();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold md:text-3xl">Configuración e integraciones</h1>

      <section aria-labelledby="cuenta">
        <h2 id="cuenta" className="text-lg font-semibold">
          Tu cuenta
        </h2>
        <Card className="mt-3 space-y-3">
          <dl className="grid gap-1 text-sm sm:grid-cols-[8rem_1fr]">
            <dt className="text-muted-foreground">Nombre</dt>
            <dd>{user.displayName ?? "Sin nombre"}</dd>
            <dt className="text-muted-foreground">Correo</dt>
            <dd>{user.email ?? "—"}</dd>
          </dl>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline">
              Cerrar sesión
            </Button>
          </form>
        </Card>
      </section>

      <section aria-labelledby="espacios">
        <h2 id="espacios" className="text-lg font-semibold">
          Tus espacios de trabajo
        </h2>
        <ul className="mt-3 space-y-3">
          {workspaces.map((w) => (
            <li key={w.id}>
              <Card className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">{w.name}</span>
                <span className="text-muted-foreground">
                  {KIND_LABEL[w.kind]} · {ROLE_LABEL[w.role]}
                </span>
              </Card>
            </li>
          ))}
          {workspaces.length === 0 && (
            <li className="text-muted-foreground text-sm">
              No perteneces a ningún espacio todavía.
            </li>
          )}
        </ul>
      </section>

      <section aria-labelledby="integraciones">
        <div className="flex items-center gap-3">
          <h2 id="integraciones" className="text-lg font-semibold">
            Integraciones
          </h2>
          <Badge>Próximamente</Badge>
        </div>
        <Card className="mt-3 text-sm">
          Google Drive, Google Slides y Google Classroom se conectarán más adelante, pidiendo solo
          los permisos mínimos y con tu confirmación antes de publicar nada.
        </Card>
      </section>
    </div>
  );
}
