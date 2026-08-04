import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Fora do compilador do Next, o pacote real sempre lança erro — aqui
      // vira no-op só para permitir testar unidades puras de módulos
      // guardados por "server-only" (ver lib/uploads/constants.ts).
      "server-only": path.resolve(__dirname, "test/mocks/server-only.ts"),
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
