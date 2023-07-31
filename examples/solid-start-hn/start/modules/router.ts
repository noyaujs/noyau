import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";
import {
  addTemplate,
  addVitePlugin,
  createResolver,
  defineNoyauModule,
  updateTemplates,
} from "@noyau/kit";
import { findExportNames } from "mlly";
import { type NoyauRoute, type RouteSegment } from "@noyau/schema";
import { source } from "common-tags";
import { genImport, genSafeVariableName } from "knitwork";
import routeData from "solid-start/server/routeData";
import routeDataHmr from "solid-start/server/routeDataHmr";
import solid from "vite-plugin-solid";
import { resolve } from "pathe";

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNoyauModule<ModuleOptions>({
  meta: {
    name: "solid-start/router",
    version: "0.0.1",
    modules: ["@noyau/module-solid", "@noyau/module-routes"],
  },
  defaults: {},
  setup(options, { noyau }) {
    addVitePlugin({
      name: "solid-start/routes-processor",
      enforce: "pre",
      transform(code, id, transformOptions) {
        const ssr = false;
        const url = pathToFileURL(id);
        url.searchParams.delete("v");
        id = fileURLToPath(url).replace(/\\/g, "/");

        let babelSolidCompiler = (
          /** @type {string} */ code,
          /** @type {string} */ id,
          fn
        ) => {
          // @ts-ignore
          let plugin = solid({
            ssr: process.env.START_SPA_CLIENT === "true" ? false : true,
            babel: fn,
          });

          // @ts-ignore
          return plugin.transform(code, id, transformOptions);
        };

        if (/\?data/.test(id)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return babelSolidCompiler(
            code,
            id.replace("?data", ""),
            (/** @type {any} */ source, /** @type {any} */ id) => ({
              plugins: [
                // [
                //   routeResource,
                //   {
                //     ssr,
                //     root: process.cwd(),
                //     minify: process.env.NODE_ENV === "production"
                //   }
                // ],
                // [
                //   babelServerModule,
                //   {
                //     ssr,
                //     root: process.cwd(),
                //     minify: process.env.NODE_ENV === "production"
                //   }
                // ],
                [
                  routeData,
                  {
                    ssr,
                    root: process.cwd(),
                    minify: process.env.NODE_ENV === "production",
                  },
                ],
                !ssr &&
                  process.env.NODE_ENV !== "production" && [
                    routeDataHmr,
                    { ssr, root: process.cwd() },
                  ],
              ].filter(Boolean),
            })
          );
        } else if (
          id.includes(
            resolve(noyau.options.srcDir, noyau.options.routes?.routesDir ?? "")
          )
        ) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return babelSolidCompiler(
            code,
            id.replace("?data", ""),
            (/** @type {any} */ source, /** @type {any} */ id) => ({
              plugins: [
                // [
                //   routeResource,
                //   {
                //     ssr,
                //     root: process.cwd(),
                //     keep: true,
                //     minify: process.env.NODE_ENV === "production",
                //   },
                // ],
                // [
                //   babelServerModule,
                //   {
                //     ssr,
                //     root: process.cwd(),
                //     minify: process.env.NODE_ENV === "production",
                //   },
                // ],
                [
                  routeData,
                  {
                    ssr,
                    root: process.cwd(),
                    keep: true,
                    minify: process.env.NODE_ENV === "production",
                  },
                ],
              ].filter(Boolean),
            })
          );
        }
      },
    });

    const resolver = createResolver(import.meta.url);

    noyau.options.alias["#solid-start/router"] =
      noyau.options.buildDir.concat("/start/router.tsx");

    // noyau.hooks.hook("watch", async (event, path) => {
    //   if (
    //     (event === "create" || event === "delete") &&
    //     path === (await resolver.resolvePath(options.rootFile))
    //   ) {
    //     await updateTemplates(
    //       (template) => template.filename === "start/router"
    //     );
    //   }
    // });

    noyau.hook("routes:generate", async (routes) => {
      addTemplate({
        filename: "start/router.tsx",
        write: true,
        getContents() {
          return source`
            ${genImport("solid-js", ["lazy", "JSX"])}
            ${generateRouteDefinitons(routes)}
            `;
        },
      });

      await updateTemplates(
        (template) => template.filename === "start/router.tsx"
      );
    });

    noyau.hook("types:prepare", ({ references }) => {
      references.push({
        path: "start/router.tsx",
      });
    });
  },
});

const segmentToPath = (segment: RouteSegment): string => {
  if (segment.type === "static") {
    return segment.value;
  } else if (segment.type === "dynamic") {
    return `:${segment.value}`;
  } else if (segment.type === "optional") {
    return `:${segment.value}?`;
  } else if (segment.type === "splat") {
    return `*${segment.value}`;
  }
};

const segmentsToPath = (segments: RouteSegment | RouteSegment[]): string => {
  if (Array.isArray(segments)) {
    return segments.map(segmentsToPath).join("/");
  } else {
    return segmentToPath(segments);
  }
};

const hasDataExport = (route: NoyauRoute): boolean => {
  const file = fs.readFileSync(route.file, "utf-8");
  return findExportNames(file).includes("routeData");
};

const generateRouteDefinition = (
  route: NoyauRoute,
  dataExports: string[]
): string => {
  let dataExport;
  const path = segmentsToPath(route.path);
  if (hasDataExport(route)) {
    dataExport = genSafeVariableName(path);
    dataExports.push(
      source`
      import { routeData as ${dataExport} } from "${route.file.replace(
        /\.\w+$/,
        ""
      )}?data";
    `
    );
  }

  return source`
    {
      path: "${path}",
      component: lazy(() => import("${route.file.replace(/\.\w+$/, "")}")),
      ${dataExport ? `data: ${dataExport},` : ""}
      ${
        route.children
          ? source`
      children: [
        ${route.children
          .map((child) => generateRouteDefinition(child, dataExports))
          .join(",\n")}
      ]`
          : ""
      }
    }`;
};

const generateRouteDefinitons = (routes: NoyauRoute[]) => {
  // this is horrid but it works
  const dataExports: string[] = [];
  const routeDefinitions = routes
    .map((route) => generateRouteDefinition(route, dataExports))
    .join(",\n");
  return source`
    ${dataExports.join("\n")}

    export const fileRoutes = [
      ${routeDefinitions}
    ]

    export const FileRoutes = () => {
      return fileRoutes as unknown as JSX.Element;
    };
    
  `;
};
