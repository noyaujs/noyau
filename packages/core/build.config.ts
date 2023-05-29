import { defineBuildConfig } from "unbuild";
export default defineBuildConfig({
  declaration: true,
  entries: [
    {
      input: "src/index",
    },
    // App
    { input: "src/app/", outDir: "dist/app/", ext: "js" },
    { input: "src/runtime/", outDir: "dist/runtime", format: "esm" },
  ],
});
