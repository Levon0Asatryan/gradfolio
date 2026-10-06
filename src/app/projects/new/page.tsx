import { Metadata } from "next";
import ProjectNewForm from "@/components/project-new/ProjectNewForm";

export const metadata: Metadata = {
  title: "Add New Project",
  description: "Create a new project entry",
};

export default function NewProjectPage() {
  return <ProjectNewForm />;
}
