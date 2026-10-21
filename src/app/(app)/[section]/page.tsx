import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui/card";
import { findSection } from "@/lib/nav";

export async function generateMetadata(props: PageProps<"/[section]">) {
  const { section } = await props.params;
  return { title: findSection(section)?.label ?? "No encontrada" };
}

/** Secciones aún sin funcionalidad: se dicen «Próximamente», no se simulan. */
export default async function ComingSoonPage(props: PageProps<"/[section]">) {
  const { section: slug } = await props.params;
  const section = findSection(slug);
  if (!section || section.ready) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">{section.label}</h1>
        <Badge>Próximamente</Badge>
      </div>
      <Card className="mt-6">
        <p>{section.description}</p>
        <p className="text-muted-foreground mt-3 text-sm">
          Esta sección todavía no está disponible. Está planificada para: {section.phase}.
        </p>
      </Card>
    </div>
  );
}
