import { type NoyauRoute, type RouteSegment } from "@noyau/schema";
import { source } from "common-tags";
import { genSafeVariableName } from "knitwork";

const segmentToPath = (segment: RouteSegment): string => {
  if (segment.type === "static") {
    return segment.value;
  } else if (segment.type === "dynamic") {
    return `$${segment.value}`;
  } else if (segment.type === "optional") {
    throw new Error("optional segments are not supported");
  } else if (segment.type === "splat") {
    return `$`;
  }
};

const segmentsToPath = (segments: RouteSegment | RouteSegment[]): string => {
  if (Array.isArray(segments)) {
    return segments.map(segmentsToPath).join("/");
  } else {
    return segmentToPath(segments);
  }
};

const segmentToVariableName = (segment: RouteSegment): string => {
  if (segment.type === "static") {
    if (segment.value === "/") {
      return "index";
    }
    return segment.value;
  } else if (segment.type === "dynamic") {
    return `$${segment.value}`;
  } else if (segment.type === "optional") {
    throw new Error("optional segments are not supported");
  } else if (segment.type === "splat") {
    return `$${segment.value}`;
  }

  throw new Error(`unknown segment type: ${segment.type as string}`);
};

const segmentsToVariableName = (
  segments: RouteSegment | RouteSegment[]
): string => {
  if (Array.isArray(segments)) {
    return segments.map(segmentsToVariableName).join("_");
  }

  return segmentToVariableName(segments);
};
// takes a noyau route and turn it into a @tanstack/router route
export const generateRouteDefinition = (
  route: NoyauRoute,
  parent: string
): string => {
  // TODO: better variable name generation
  const routeDefinition = source`
    // ${segmentsToVariableName(route.path)}
    const ${genSafeVariableName(
      `${genSafeVariableName(parent)}_${segmentsToVariableName(route.path)}`
    )} = new Route({
      getParentRoute: () => ${genSafeVariableName(parent)},
      path: "${segmentsToPath(route.path)}",
      component: lazy(() => import("${route.file.replace(/\.\w+$/, "")}")),
    });
  `;
  return routeDefinition;
};

export const generateRouteDefinitions = (
  routes: NoyauRoute[],
  parent: string,
  definitions: string[] = []
): string => {
  for (const route of routes) {
    definitions.push(generateRouteDefinition(route, parent));
    if (route.children) {
      generateRouteDefinitions(
        route.children,
        `${genSafeVariableName(parent)}_${segmentsToVariableName(route.path)}`,
        definitions
      );
    }
  }
  return definitions.join("\n");
};

export const generateRouterTree = (
  routes: NoyauRoute[],
  parent: string
): string => {
  return source`
    ${genSafeVariableName(parent)}.addChildren([
      ${routes
        .map((route) =>
          route.children
            ? generateRouterTree(
                route.children,
                `${genSafeVariableName(parent)}_${segmentsToVariableName(
                  route.path
                )}`
              )
            : genSafeVariableName(
                `${genSafeVariableName(parent)}_${segmentsToVariableName(
                  route.path
                )}`
              )
        )
        .join(",\n")}
    ])`;
};

export const generateRouter = (
  routes: NoyauRoute[],
  parent: string
): string => {
  return source`
    export const router = new Router({
      routeTree: ${generateRouterTree(routes, parent)},
    });

    declare module '@tanstack/router' {
      interface Register {
        router: typeof router
      }
    }
  `;
};
