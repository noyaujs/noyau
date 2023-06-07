import { normalizePlugin, resolveFiles, resolvePath } from "@noyau/kit";
import { type Noyau } from "@noyau/schema";

export function uniqueBy<T, K extends keyof T>(arr: T[], key: K) {
  const res: T[] = [];
  const seen = new Set<T[K]>();
  for (const item of arr) {
    if (seen.has(item[key])) {
      continue;
    }
    seen.add(item[key]);
    res.push(item);
  }
  return res;
}

export const loadPlugins = async (noyau: Noyau) => {
  const plugins = await Promise.all(
    [
      ...noyau.options.plugins,
      ...(await resolveFiles(
        noyau.options.srcDir,
        `${noyau.options.dir.plugins}/*.{ts,js,mjs,cjs,mts,cts,jsx,tsx}`
      )),
    ]
      .map(normalizePlugin)
      .map(async (plugin) => ({
        ...plugin,
        src: await resolvePath(plugin.src),
      }))
  );
  noyau.options._installedPlugins = uniqueBy(plugins, "src");
};
