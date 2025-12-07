"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container, Box, CircularProgress } from "@mui/material";

export default function EditProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /profile which now handles edit mode inline
    router.replace("/profile");
  }, [router]);

  return (
    <Container component="main" sx={{ py: 3 }}>
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}
      >
        <CircularProgress />
      </Box>
    </Container>
  );
}
