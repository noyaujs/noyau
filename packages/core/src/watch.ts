import { logger } from "@noyau/kit";
import { type Noyau } from "@noyau/schema";
import parcelWatcher from "@parcel/watcher";
import chokidar from "chokidar";
import { join } from "path";
import { normalize, relative } from "pathe";

export const watch = async (noyau: Noyau) => {
  try {
    await createWatcher(noyau);
  } catch (e) {
    logger.info("failed to load @parcel/watcher, falling back to chokidar", e);
    createChokidarWatcher(noyau);
  }
};

const createWatcher = async (noyau: Noyau) => {
  const watch = await parcelWatcher.subscribe(
    noyau.options.srcDir,
    (err, events) => {
      if (err) {
        return;
      }
      console.log(events);
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

const eventMap = {
  change: "update",
  unlink: "delete",
  unlinkDir: "delete",
  add: "create",
  addDir: "create",
} as const;

const createChokidarWatcher = (noyau: Noyau) => {
  const watcher = chokidar.watch(noyau.options.srcDir, {
    cwd: noyau.options.srcDir,
    ignoreInitial: true,
    ignored: [".noyau", "node_modules"],
  });

  watcher.on(
    "all",
    (event, path) =>
      void noyau.callHook(
        "watch",
        eventMap[event],
        join(noyau.options.srcDir, normalize(path))
      )
  );
  noyau.hook("close", () => watcher.close());
};
