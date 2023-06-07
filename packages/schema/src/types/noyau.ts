import { type Hookable } from "hookable";
import { type NitroDevServer } from "nitropack";
import { type NoyauOptions } from "./config";
import { type RuntimeNoyauHooks, type NoyauHooks } from "./hooks";

// interface so it can be extended
export interface NoyauTemplateContext {
  noyau: Noyau;
}

export type NoyauTemplate = {
  filename: string;
  getContents: (ctx: NoyauTemplateContext) => string | Promise<string>;
  write?: boolean;
};

export type ResolvedNoyauTemplate = NoyauTemplate & {
  path: string;
};

//TODO: move these into @noyau/module-routes
export type RouteSegmentType = "static" | "dynamic" | "optional" | "splat";
export type RouteSegment = {
  type: RouteSegmentType;
  value: string;
};

export type NoyauRoute = {
  name: string;
  path: RouteSegment | RouteSegment[];
  file: string;
  children?: NoyauRoute[];
};

export type NoyauPlugin = {
  src: string;
};

export type Noyau = {
  // Private fields.
  _version: string;
  // _ignore?: Ignore;

  /** The resolved Noyau configuration. */
  options: NoyauOptions;
  hooks: Hookable<NoyauHooks>;
  hook: Noyau["hooks"]["hook"];
  callHook: Noyau["hooks"]["callHook"];
  addHooks: Noyau["hooks"]["addHooks"];

  ready: () => Promise<void>;
  close: () => Promise<void>;

  /** The production or development server. */
  server?: NitroDevServer;

  vfs: Record<string, string>;
};

// runtime noyau
export type NoyauApp = {
  ctx: NoyauAppContext;
  hooks: Hookable<RuntimeNoyauHooks>;
  hook: NoyauApp["hooks"]["hook"];
  callHook: NoyauApp["hooks"]["callHook"];
  runWithContext: <T extends (...args: any[]) => any>(fn: T) => ReturnType<T>;
};

// module extension
export interface NoyauAppContext {}
