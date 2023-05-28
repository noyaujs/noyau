import { getContext } from "unctx";
import type { Noyau } from "@noyau/schema";

/** Direct access to the Noyau context - see https://github.com/unjs/unctx. */
export const noyauCtx = getContext<Noyau>("noyau");
export function useNoyau(): Noyau {
  const instance = noyauCtx.tryUse();
  if (!instance) {
    throw new Error("Noyau instance is unavailable!");
  }
  return instance;
}

export function tryUseNoyau(): Noyau | null {
  return noyauCtx.tryUse();
}
