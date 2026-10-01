import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount what each test rendered, so the next one starts from an empty DOM.
afterEach(() => cleanup());
