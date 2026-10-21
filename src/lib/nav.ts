/**
 * Navegación principal (12 secciones). `ready` indica si la sección ya tiene funcionalidad
 * real; las demás muestran «Próximamente» y no se presentan como funcionales.
 */
export type NavSection = {
  slug: string;
  href: string;
  label: string;
  description: string;
  /** Fase de la hoja de ruta en que se implementa (ver docs/ROADMAP.md). */
  phase: string;
  ready: boolean;
};

export const NAV_SECTIONS: NavSection[] = [
  {
    slug: "",
    href: "/",
    label: "Inicio",
    description: "Accesos rápidos a lo que haces cada día.",
    phase: "Esqueleto",
    ready: true,
  },
  {
    slug: "planificacion",
    href: "/planificacion",
    label: "Planificación",
    description: "Planifica unidades y clases a partir de los Objetivos de Aprendizaje oficiales.",
    phase: "Fase 1",
    ready: false,
  },
  {
    slug: "material",
    href: "/material",
    label: "Crear material",
    description: "Genera guías, presentaciones y actividades, y mejora los archivos que ya tienes.",
    phase: "Fase 1",
    ready: false,
  },
  {
    slug: "evaluaciones",
    href: "/evaluaciones",
    label: "Evaluaciones",
    description: "Diseña evaluaciones con su tabla de especificaciones, pauta y rúbricas.",
    phase: "Fase 1",
    ready: false,
  },
  {
    slug: "adecuaciones",
    href: "/adecuaciones",
    label: "Adecuaciones",
    description:
      "Adapta actividades y evaluaciones con apoyos, sin cambiar los objetivos sin tu validación.",
    phase: "Fase 2",
    ready: false,
  },
  {
    slug: "cursos",
    href: "/cursos",
    label: "Mis cursos",
    description: "Cursos, asignaturas y registros pedagógicos.",
    phase: "Fase 1 y 2",
    ready: false,
  },
  {
    slug: "pizarra",
    href: "/pizarra",
    label: "Pizarra interactiva",
    description:
      "Reloj, temporizadores, agenda visual y selector aleatorio para proyectar en sala.",
    phase: "Fase 3",
    ready: false,
  },
  {
    slug: "leccionario",
    href: "/leccionario",
    label: "Leccionario",
    description: "Borradores desde tu planificación; tú confirmas lo que realmente ocurrió.",
    phase: "Fase 1",
    ready: false,
  },
  {
    slug: "asistencia",
    href: "/asistencia",
    label: "Asistencia",
    description: "Registro por curso y fecha, con exportación.",
    phase: "Fase 3",
    ready: false,
  },
  {
    slug: "apoderados",
    href: "/apoderados",
    label: "Apoderados",
    description: "Borradores de comunicaciones basados en hechos que tú validas.",
    phase: "Fase 3",
    ready: false,
  },
  {
    slug: "biblioteca",
    href: "/biblioteca",
    label: "Biblioteca de recursos",
    description: "Tus recursos guardados y, más adelante, los de tu equipo.",
    phase: "Fase 1",
    ready: false,
  },
  {
    slug: "configuracion",
    href: "/configuracion",
    label: "Configuración e integraciones",
    description: "Tu cuenta, tus espacios y las conexiones con otros servicios.",
    phase: "Esqueleto",
    ready: true,
  },
];

export function findSection(slug: string): NavSection | undefined {
  return NAV_SECTIONS.find((s) => s.slug === slug);
}
