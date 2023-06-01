import { useNoyau } from "./context";

export const setAppEntry = (handler: string) => {
  const noyau = useNoyau();
  if (noyau.options.app.entry) {
    throw new Error(
      `Noyau app entry is already set to ${noyau.options.app.entry}`
    );
  }
  noyau.options.app.entry = handler;
};
