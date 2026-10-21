import Link from "next/link";
import { Badge, Card } from "@/components/ui/card";
import { getMyWorkspaces, requireUser } from "@/lib/auth/session";

export const metadata = { title: "Inicio" };

const QUICK_ACTIONS = [
  {
    href: "/planificacion",
    title: "Crear una clase",
    text: "Parte de un Objetivo de Aprendizaje y arma la planificación.",
  },
  {
    href: "/evaluaciones",
    title: "Preparar una evaluación",
    text: "Genera ítems, pauta y tabla de especificaciones coherentes.",
  },
  {
    href: "/material",
    title: "Mejorar un archivo",
    text: "Sube tu material y recibe una versión mejorada, sin tocar el original.",
  },
  {
    href: "/leccionario",
    title: "Completar el leccionario",
    text: "Revisa el borrador y confirma lo que realmente ocurrió.",
  },
];

export default async function HomePage() {
  const user = await requireUser();
  const workspaces = await getMyWorkspaces();
  const personal = workspaces.find((w) => w.kind === "personal") ?? workspaces[0];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold md:text-3xl">
        Hola{user.displayName ? `, ${user.displayName}` : ""}
      </h1>
      <p className="text-muted-foreground mt-1">
        {personal
          ? `Espacio de trabajo: ${personal.name}.`
          : "Aún no tienes un espacio de trabajo."}
      </p>

      <section aria-labelledby="accesos" className="mt-8">
        <h2 id="accesos" className="text-lg font-semibold">
          Accesos rápidos
        </h2>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2">
          {QUICK_ACTIONS.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className="block h-full">
                <Card className="hover:bg-surface-muted h-full transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{a.title}</h3>
                    <Badge>Próximamente</Badge>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm">{a.text}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="estado" className="mt-10">
        <h2 id="estado" className="text-lg font-semibold">
          Estado de la plataforma
        </h2>
        <Card className="mt-3 text-sm">
          <p>
            Esta es la base técnica del producto: cuenta, espacios de trabajo con permisos y la capa
            de IA ya están preparados. Las herramientas pedagógicas se activan por etapas, empezando
            por la planificación, las evaluaciones y el leccionario para 1° básico.
          </p>
        </Card>
      </section>
    </div>
  );
}
