"use client";

import { FC, memo, useCallback, useState } from "react";
import { Paper, Stack } from "@mui/material";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import ProjectBasicInfo from "./ProjectBasicInfo";
import ProjectMediaUpload from "./ProjectMediaUpload";
import ProjectNewActions from "./ProjectNewActions";
import { ProjectAttachmentForm, ProjectFormState } from "./types";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/i18n/LanguageContext";

const ProjectNewForm: FC = () => {
  const { t } = useLanguage();
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
    <PageContainer maxWidth={800}>
      <PageHeader title={t.projects.form.title} />
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={4}>
          <ProjectBasicInfo values={values} onChange={handleChange} />

          <ProjectMediaUpload
            attachments={values.attachments}
            onAdd={handleAddAttachment}
            onRemove={handleRemoveAttachment}
          />

          <ProjectNewActions onSave={handleSave} isSaving={isSaving} />
        </Stack>
      </Paper>
    </PageContainer>
  );
};

export default memo(ProjectNewForm);
