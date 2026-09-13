import { defineConfig, globalIgnores } from "eslint/config"
import nextConfig from "eslint-config-next"

export default defineConfig([
  ...nextConfig,
  // Compiler diagnostics are advisory while the existing app has not adopted React Compiler.
  // Keep correctness rules (including rules-of-hooks) at their recommended severity.
  { rules: {
    "react-hooks/set-state-in-effect": "warn",
    "react-hooks/purity": "warn",
    "react-hooks/use-memo": "warn",
  } },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts", "**/venv/**", "**/.venv/**"]),
])
