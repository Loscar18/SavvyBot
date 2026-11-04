import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    // Global test configuration
    globals: true,
    environment: "node",
    passWithNoTests: false,
    
    // Coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "coverage",
      include: [
        "lib/**/*.ts",
        "lib/**/*.tsx",
        "app/api/**/*.ts",
        "app/api/**/*.tsx",
      ],
      exclude: [
        "**/*.d.ts",
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.next/**",
      ],
    },
    
    // Test environment setup
    setupFiles: [
      "./vitest.setup.ts",
    ],
    
    // Mock modules
    mockReset: true,
    restoreMocks: true,
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Retries
    retries: 1,
    
    // Output
    outputFile: {
      junit: "test-results.xml",
    },
    
    // Include test files
    include: [
      "**/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}",
      "**/*.{test,spec}.{js,ts,jsx,tsx}",
    ],
    
    // Exclude files
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/cypress/**",
    ],
    
    // Watch mode
    watch: {
      enabled: true,
      include: [
        "**/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}",
        "lib/**/*.{js,ts,jsx,tsx}",
        "app/api/**/*.{js,ts,jsx,tsx}",
      ],
    },
    
    // Typecheck
    typecheck: {
      enabled: true,
      tsconfig: "tsconfig.json",
    },
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@/lib": path.resolve(__dirname, "lib"),
      "@/components": path.resolve(__dirname, "components"),
      "@/app": path.resolve(__dirname, "app"),
      "@/hooks": path.resolve(__dirname, "hooks"),
      "@/types": path.resolve(__dirname, "types"),
    },
  },
});
