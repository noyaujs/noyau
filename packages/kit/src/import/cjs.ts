import { normalize } from "pathe";
import jiti from "jiti";

// TODO: use create-require for jest environment
const _require = jiti(process.cwd(), {
  interopDefault: true,
  esmResolve: true,
});

/** @deprecated Do not use CJS utils */
interface ResolveModuleOptions {
  paths?: string | string[];
}

/** @deprecated Do not use CJS utils */
interface RequireModuleOptions extends ResolveModuleOptions {
  // TODO: use create-require for jest environment
  // native?: boolean
  /** Clear the require cache (force fresh require) but only if not within `node_modules` */
  clearCache?: boolean;

  /** Automatically de-default the result of requiring the module. */
  interopDefault?: boolean;
}

/** @deprecated Do not use CJS utils */
function isNodeModules(id: string) {
  // TODO: Follow symlinks
  return /[/\\]node_modules[/\\]/.test(id);
}

/** @deprecated Do not use CJS utils */
function clearRequireCache(id: string) {
  if (isNodeModules(id)) {
    return;
  }

  const entry = getRequireCacheItem(id);

  if (!entry) {
    delete _require.cache[id];
    return;
  }

  if (entry.parent) {
    entry.parent.children = entry.parent.children.filter((e) => e.id !== id);
  }

  for (const child of entry.children) {
    clearRequireCache(child.id);
  }

  delete _require.cache[id];
}

function getRequireCacheItem(id: string) {
  try {
    return _require.cache[id];
  } catch (e) {}
}

function resolveModule(id: string, opts: ResolveModuleOptions = {}) {
  return normalize(
    _require.resolve(id, {
      paths: ([] as Array<string | undefined>)
        .concat(opts.paths || [], process.cwd())
        .filter(Boolean) as string[],
    })
  );
}

/**
 * @internal
 * @deprecated Do not use CJS utils
 * */
export function requireModule(id: string, opts: RequireModuleOptions = {}) {
  // Resolve id
  const resolvedPath = resolveModule(id, opts);

  // Clear require cache if necessary
  if (opts.clearCache && !isNodeModules(id)) {
    clearRequireCache(resolvedPath);
  }

  // Try to require
  const requiredModule = _require(resolvedPath);

  return requiredModule;
}
