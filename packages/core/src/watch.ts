import { type Noyau } from "@noyau/schema";
import watcher from "@parcel/watcher";
import { normalize } from "pathe";

export const watch = async (noyau: Noyau) => {
  const watch = await watcher.subscribe(
    noyau.options.srcDir,
    (err, events) => {
      if (err) {
        return;
      }

      for (const event of events) {
        // todo checked ignored files
        void noyau.callHook("watch", event.type, normalize(event.path));
      }
    },
    {
      ignore: [".noyau", "node_modules"],
    }
  );

  noyau.hook("close", () => watch.unsubscribe());
};
