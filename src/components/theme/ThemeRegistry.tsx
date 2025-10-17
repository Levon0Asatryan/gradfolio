"use client";

import * as React from "react";
import { useServerInsertedHTML } from "next/navigation";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  // Create a single Emotion cache per request on the server and reuse it on the client
  const [cache] = React.useState(() => {
    const cache = createCache({ key: "mui", prepend: true });
    // Enable Emotion v11 compatibility mode for MUI
    // See: https://mui.com/material-ui/guides/next-js-app-router/#css-injection-order
    (cache as any).compat = true;
    return cache;
  });

  useServerInsertedHTML(() => {
    const { key, inserted } = cache;
    const names = Object.keys(inserted);
    if (names.length === 0) return null;

    let styles = "";
    for (const name of names) {
      if (name === "") continue;
      styles += (inserted as any)[name];
    }

    return (
      <style
        data-emotion={`${key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
