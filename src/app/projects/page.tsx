import ProjectsList from "@/components/projects/ProjectsList";
import ProjectsListToolbar from "@/components/projects/ProjectsListToolbar";
import { projectsMock } from "@/data/project.mock";

export const metadata = { title: "Projects" };

export default function ProjectsPage() {
  const projects = projectsMock;
  return (
    <main>
      {/* Toolbar is UI-only for now */}
      <ProjectsListToolbar />
      <ProjectsList projects={projects} />
    </main>
  );
}
