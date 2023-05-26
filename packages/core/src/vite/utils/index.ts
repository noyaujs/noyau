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
import { promises as fsp, readdirSync, statSync } from "node:fs";
import { hash } from "ohash";
import { join } from "pathe";

export function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// Copied from vue-bundle-renderer utils
const IS_JS_RE = /\.[cm]?js(\?[^.]+)?$/;
const IS_MODULE_RE = /\.mjs(\?[^.]+)?$/;
const HAS_EXT_RE = /[^./]+\.[^./]+$/;
const IS_CSS_RE = /\.(?:css|scss|sass|postcss|less|stylus|styl)(\?[^.]+)?$/;

export function isJS(file: string) {
  return IS_JS_RE.test(file) || !HAS_EXT_RE.test(file);
}

export function isModule(file: string) {
  return IS_MODULE_RE.test(file) || !HAS_EXT_RE.test(file);
}

export function isCSS(file: string) {
  return IS_CSS_RE.test(file);
}

export function hashId(id: string) {
  return "$id_" + hash(id);
}

export function readDirRecursively(dir: string): string[] {
  return readdirSync(dir).reduce((files, file) => {
    const name = join(dir, file);
    const isDirectory = statSync(name).isDirectory();
    return isDirectory
      ? [...files, ...readDirRecursively(name)]
      : [...files, name];
  }, [] as string[]);
}

export async function isDirectory(path: string) {
  try {
    return (await fsp.stat(path)).isDirectory();
  } catch (_err) {
    return false;
  }
}
