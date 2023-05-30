import type { Argv } from "mri";

const _rDefault = (r: any) => r.default || r;

export const commands = {
  dev: () => import("./dev").then(_rDefault),
  usage: () => import("./usage").then(_rDefault),
  prepare: () => import("./prepare").then(_rDefault),
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
