import { useNoyau } from "./context";

export const setAppEntry = (handler: string) => {
  const noyau = useNoyau();
  noyau.options.app.entry = handler;
};
