// The MIT License (MIT)

// Copyright (c) 2016-present - Nuxt Team

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
import { existsSync, promises as fsp } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, dirname, isAbsolute, join, normalize, resolve } from "pathe";
import { globby } from "globby";
import { resolvePath as _resolvePath } from "mlly";
import { resolveAlias as _resolveAlias } from "pathe/utils";
import { tryUseNoyau } from "./context";
// import { isIgnored } from "./ignore";

export interface ResolvePathOptions {
  /** Base for resolving paths from. Default is Noyau rootDir. */
  cwd?: string;

  /** An object of aliases. Default is Noyau configured aliases. */
  alias?: Record<string, string>;

  /** The file extensions to try. Default is Noyau configured extensions. */
  extensions?: string[];
}

/**
 * Resolve full path to a file or directory respecting Noyau alias and extensions options
 *
 * If path could not be resolved, normalized input path will be returned
 */
export async function resolvePath(
  path: string,
  opts: ResolvePathOptions = {}
): Promise<string> {
  // Always normalize input
  const _path = path;
  path = normalize(path);

  // Fast return if the path exists
  if (isAbsolute(path) && existsSync(path) && !(await isDirectory(path))) {
    return path;
  }

  // Use current noyau options
  const noyau = tryUseNoyau();
  const cwd = opts.cwd ?? (noyau ? noyau.options.rootDir : process.cwd());
  const extensions =
    opts.extensions ??
    (noyau ? noyau.options.extensions : [".ts", ".mjs", ".cjs", ".json"]);
  const modulesDir = noyau ? noyau.options.modulesDir : [];

  // Resolve aliases
  path = resolveAlias(path);

  // Resolve relative to cwd
  if (!isAbsolute(path)) {
    path = resolve(cwd, path);
  }

  // Check if resolvedPath is a file
  let _isDir = false;
  if (existsSync(path)) {
    _isDir = await isDirectory(path);
    if (!_isDir) {
      return path;
    }
  }

  // Check possible extensions
  for (const ext of extensions) {
    // path.[ext]
    const pathWithExt = path + ext;
    if (existsSync(pathWithExt)) {
      return pathWithExt;
    }
    // path/index.[ext]
    const pathWithIndex = join(path, "index" + ext);
    if (_isDir && existsSync(pathWithIndex)) {
      return pathWithIndex;
    }
  }

  // Try to resolve as module id
  // Remove all this nonsense when https://github.com/unjs/mlly/pull/172 gets merged which fixes the types
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const resolveModulePath: string | null = await _resolvePath(_path, {
    url: [cwd, ...modulesDir],
  }).catch(() => null);

  if (resolveModulePath) {
    return resolveModulePath;
  }

  // Return normalized input
  return path;
}

/**
 * Try to resolve first existing file in paths
 */
export async function findPath(
  paths: string | string[],
  opts?: ResolvePathOptions,
  pathType: "file" | "dir" = "file"
): Promise<string | null> {
  if (!Array.isArray(paths)) {
    paths = [paths];
  }
  for (const path of paths) {
    const rPath = await resolvePath(path, opts);
    if (await existsSensitive(rPath)) {
      const _isDir = await isDirectory(rPath);
      if (
        !pathType ||
        (pathType === "file" && !_isDir) ||
        (pathType === "dir" && _isDir)
      ) {
        return rPath;
      }
    }
  }
  return null;
}

/**
 * Resolve path aliases respecting Noyau alias options
 */
export function resolveAlias(
  path: string,
  alias?: Record<string, string>
): string {
  if (!alias) {
    alias = tryUseNoyau()?.options.alias ?? {};
  }
  return _resolveAlias(path, alias);
}

export interface Resolver {
  resolve(...path: string[]): string;
  resolvePath(path: string, opts?: ResolvePathOptions): Promise<string>;
}

/**
 * Create a relative resolver
 */
export function createResolver(base: string | URL): Resolver {
  if (!base) {
    throw new Error("`base` argument is missing for createResolver(base)!");
  }

  base = base.toString();
  if (base.startsWith("file://")) {
    base = dirname(fileURLToPath(base));
  }

  return {
    resolve: (...path) => resolve(base as string, ...path),
    resolvePath: (path, opts) =>
      resolvePath(path, { cwd: base as string, ...opts }),
  };
}

// --- Internal ---

async function existsSensitive(path: string) {
  if (!existsSync(path)) {
    return false;
  }
  const dirFiles = await fsp.readdir(dirname(path));
  return dirFiles.includes(basename(path));
}

// Usage note: We assume path existence is already ensured
async function isDirectory(path: string) {
  return (await fsp.lstat(path)).isDirectory();
}

export async function resolveFiles(
  path: string,
  pattern: string | string[],
  opts: { followSymbolicLinks?: boolean } = {}
) {
  const files = await globby(pattern, {
    cwd: path,
    followSymbolicLinks: opts.followSymbolicLinks ?? true,
  });
  return (
    files
      .map((p) => resolve(path, p))
      // .filter((p) => !isIgnored(p))
      .sort()
  );
}
