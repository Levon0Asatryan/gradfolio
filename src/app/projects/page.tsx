// Projects page entry point
// Sets page metadata and renders the main ProjectsContent component

import ProjectsContent from "./ProjectsContent";

export const metadata = { title: "Projects" };

export default function ProjectsPage() {
  return <ProjectsContent />;
}
