"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type SidebarVisibilityContextValue = {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
};

const SidebarVisibilityContext = createContext<SidebarVisibilityContextValue>({
  hidden: false,
  setHidden: () => {},
});

export const SidebarVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hidden, setHiddenState] = useState(false);

  const setHidden = useCallback((v: boolean) => setHiddenState(v), []);

  const value = useMemo(() => ({ hidden, setHidden }), [hidden, setHidden]);

  return (
    <SidebarVisibilityContext.Provider value={value}>{children}</SidebarVisibilityContext.Provider>
  );
};

export const useSidebarVisibility = () => useContext(SidebarVisibilityContext);
