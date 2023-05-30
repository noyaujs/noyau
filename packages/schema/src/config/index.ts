import common from "./common";
import dev from "./dev";
import app from "./app";
import internal from "./internal";
import nitro from "./nitro";
import build from "./build";

export default {
  ...common,
  ...dev,
  ...app,
  ...internal,
  ...nitro,
  ...build,
};
