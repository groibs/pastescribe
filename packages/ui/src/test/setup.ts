import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import "@testing-library/jest-dom/vitest";

// RTL não registra a limpeza automática sem `test.globals`; registramos
// explicitamente para manter os globals do vitest fora da config.
afterEach(() => {
  cleanup();
});
