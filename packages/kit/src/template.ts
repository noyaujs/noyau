import { resolve } from "pathe";
import { type NoyauTemplate, type ResolvedNoyauTemplate } from "@noyau/schema";
import { tryUseNoyau, useNoyau } from "./context";

/**
 * Renders given template using lodash template during build into the project buildDir
 */
export function addTemplate(_template: NoyauTemplate) {
  const noyau = useNoyau();

  // Normalize template
  const template = normalizeTemplate(_template);

  // Remove any existing template with the same filename
  noyau.options.build.templates = noyau.options.build.templates.filter(
    (p) => normalizeTemplate(p).filename !== template.filename
  );

  // Add to templates array
  noyau.options.build.templates.push(template);

  return template;
}

/**
 * Normalize a noyau template object
 */
export function normalizeTemplate(
  template: NoyauTemplate
): ResolvedNoyauTemplate {
  // Always write declaration files
  if (template.filename.endsWith(".d.ts")) {
    template.write = true;
  }

  return {
    ...template,
    path: resolve(useNoyau().options.buildDir, template.filename),
  };
}

export async function updateTemplates(
  filter?: (template: ResolvedNoyauTemplate) => boolean
) {
  return await tryUseNoyau()?.callHook("template:generate", filter);
}
