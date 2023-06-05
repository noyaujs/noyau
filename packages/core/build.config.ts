import { defineBuildConfig } from "unbuild";
export default defineBuildConfig({
  declaration: true,
  entries: [
    {
      input: "src/index",
    },
    // App
    { input: "src/app/", outDir: "dist/app/", format: "esm" },
    { input: "src/runtime/", outDir: "dist/runtime", format: "esm" },
  ],
});
