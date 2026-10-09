import { Metadata } from "next";
import { ProjectForm } from "@/components/project-form/ProjectForm";
import { requestDictionary } from "@/lib/requestDictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await requestDictionary();
  return { title: t.projects.form.newTitle };
}

export default function NewProjectPage() {
  return <ProjectForm mode="create" />;
}
