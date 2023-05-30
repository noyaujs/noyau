import { existsSync } from "node:fs";
import { mkdir, readdir, rm } from "node:fs/promises";
import { join } from "pathe";

export async function clearDir(path: string, exclude?: string[]) {
  if (!exclude) {
    await rm(path, { recursive: true, force: true });
  } else if (existsSync(path)) {
    const files = await readdir(path);
    await Promise.all(
      files.map(async (name) => {
        if (!exclude.includes(name)) {
          await rm(join(path, name), { recursive: true, force: true });
        }
      })
    );
  }
  await mkdir(path, { recursive: true });
}

export function clearBuildDir(path: string) {
  return clearDir(path, ["cache", "analyze"]);
}
