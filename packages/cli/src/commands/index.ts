import  { type Argv } from "mri";

export const commands = {
  dev: () => import("./dev").then((m) => m.default),
  usage: () => import("./usage").then((m) => m.default),
  prepare: () => import("./prepare").then((m) => m.default),
  build: () => import("./build").then((m) => m.default),
  "module:build": () => import("./module_build").then((m) => m.default),
  "module:prepare": () => import("./module_prepare").then((m) => m.default),
};

export type Commands = keyof typeof commands;

export interface CommandMeta {
  name: string;
  usage: string;
  description: string;
}

export type CLIInvokeResult = void | "error" | "wait";

export interface Command {
  invoke(args: Argv): Promise<CLIInvokeResult> | CLIInvokeResult;
  meta: CommandMeta;
}

export function defineCommand(command: Command): Command {
  return command;
}
