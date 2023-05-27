import { pathToFileURL } from "node:url";
import { interopDefault, resolvePath } from "mlly";

/**
 * Resolve a module from a given root path using an algorithm patterned on
 * the upcoming `import.meta.resolve`. It returns a file URL
 *
 * @internal
 */
export async function tryResolveModule(
  id: string,
  url: string | string[] = import.meta.url
) {
  try {
    // Remove sting cast when https://github.com/unjs/mlly/pull/172 gets merged
    return (await resolvePath(id, { url })) as string;
  } catch {}
}

export async function importModule<T>(
  id: string,
  url: string | string[] = import.meta.url
): Promise<T> {
  // Remove sting cast when https://github.com/unjs/mlly/pull/172 gets merged
  const resolvedPath = (await resolvePath(id, { url })) as string;
  return import(pathToFileURL(resolvedPath).href).then(interopDefault) as T;
}

export async function tryImportModule<T>(id: string, url = import.meta.url) {
  try {
    return await importModule<T>(id, url);
  } catch {}
}
