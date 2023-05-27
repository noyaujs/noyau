// @ts-check
import { Agent as HTTPSAgent } from "node:https";
import { $fetch } from "ofetch";

export const viteNodeOptions = JSON.parse(
  process.env.NOYAU_VITE_NODE_OPTIONS || "{}"
);

console.log(
  "process.env.NOYAU_VITE_NODE_OPTIONS",
  process.env.NOYAU_VITE_NODE_OPTIONS
);
console.log("viteNodeOptions", viteNodeOptions);

export const viteNodeFetch = $fetch.create({
  baseURL: viteNodeOptions.baseURL,
  // @ts-expect-error https://github.com/node-fetch/node-fetch#custom-agent
  agent: viteNodeOptions.baseURL.startsWith("https://")
    ? new HTTPSAgent({ rejectUnauthorized: false })
    : null,
});
