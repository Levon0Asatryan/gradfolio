"use client";

import { FC, memo, useCallback, useState } from "react";
import { Container, Paper, Typography } from "@mui/material";
import ProjectBasicInfo from "./ProjectBasicInfo";
import ProjectMediaUpload from "./ProjectMediaUpload";
import ProjectNewActions from "./ProjectNewActions";
import { ProjectAttachmentForm, ProjectFormState } from "./types";
import { useRouter } from "next/navigation";

const ProjectNewForm: FC = () => {
  const router = useRouter();
  const [values, setValues] = useState<ProjectFormState>({
    title: "",
    aiSummary: "",
    liveDemoUrl: "",
    repoUrl: "",
    attachments: [],
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = useCallback((field: keyof ProjectFormState, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleAddAttachment = useCallback((att: ProjectAttachmentForm) => {
    setValues((prev) => ({ ...prev, attachments: [...prev.attachments, att] }));
  }, []);

  const handleRemoveAttachment = useCallback((id: string) => {
    setValues((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== id),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    // Mock API call
    // console.log("Saving project:", values);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    router.push("/projects");
  }, [router]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
          Add New Project
        </Typography>

        <ProjectBasicInfo values={values} onChange={handleChange} />

        <ProjectMediaUpload
          attachments={values.attachments}
          onAdd={handleAddAttachment}
          onRemove={handleRemoveAttachment}
        />

        <ProjectNewActions onSave={handleSave} isSaving={isSaving} />
      </Paper>
    </Container>
  );
};

export default memo(ProjectNewForm);
