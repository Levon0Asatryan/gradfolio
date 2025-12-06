export interface ProjectFormState {
  title: string;
  aiSummary: string;
  liveDemoUrl: string;
  repoUrl: string;
  attachments: ProjectAttachmentForm[];
}

export interface ProjectAttachmentForm {
  id: string;
  type: "image" | "video" | "pdf" | "link";
  url: string;
  title?: string;
  thumbnailUrl?: string; // For videos mainly
}
