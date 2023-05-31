import { resolveFiles, tryUseNoyau } from "@noyau/kit";
import {
  type NoyauRoute,
  type Noyau,
  type RouteSegmentType,
  type RouteSegment,
} from "@noyau/schema";
import escapeRE from "escape-string-regexp";
import { extname, relative } from "pathe";
import { logger } from "./logger";

export function uniqueBy<T, K extends keyof T>(arr: T[], key: K) {
  const res: T[] = [];
  const seen = new Set<T[K]>();
  for (const item of arr) {
    if (seen.has(item[key])) {
      continue;
    }
    seen.add(item[key]);
    res.push(item);
  }
  return res;
}

//TODO: remove args when module type gen is implemented
export const resolveRoutes = async (noyau: Noyau, routesDir: string) => {
  const files = (
    await resolveFiles(routesDir, `**/*{${noyau.options.extensions.join(",")}}`)
  ).sort();
  const routes = generateRoutesFromFiles(files, routesDir);

  return uniqueBy(routes, "path");
};

export const generateRoutesFromFiles = (files: string[], routesDir: string) => {
  const routes: NoyauRoute[] = [];

  const isIndexSegment = (segment: RouteSegment) =>
    segment.type === "static" &&
    (segment.value === "index" ||
      (segment.value.startsWith("(") && segment.value.endsWith(")")));

  for (const file of files) {
    const segments = relative(routesDir, file)
      .replace(new RegExp(`${escapeRE(extname(file))}$`), "")
      .split("/");
    const route: NoyauRoute = {
      name: "",
      path: {
        value: "",
        type: "static",
      },
      file,
      children: [],
    };

    let parent = routes;

    for (const segment of segments) {
      const parsedSegment = parseSegment(segment);
      route.name += (route.name ? "/" : "") + printSegment(parsedSegment);
      const child = parent.find(
        (parentRoute) =>
          parentRoute.name === route.name &&
          !(
            (Array.isArray(parentRoute.path)
              ? parentRoute.path[parentRoute.path.length - 1].type
              : parentRoute.path.type) === "splat"
          )
      );
      if (child && child.children) {
        parent = child.children;
        if (Array.isArray(route.path)) {
          route.path[route.path.length - 1].value = "";
          continue;
        }
        route.path.value = "";
      } else if (isIndexSegment(parsedSegment)) {
        if (Array.isArray(route.path)) {
          if (!route.path[route.path.length - 1]) {
            route.path[route.path.length - 1].value != "/";
          }
          continue;
        } else if (!route.path.value) {
          route.path.value += "/";
        }
      } else if (!isIndexSegment(parsedSegment)) {
        if (!Array.isArray(route.path) && route.path.value) {
          route.path = [route.path, parsedSegment];
        } else if (Array.isArray(route.path)) {
          route.path.push(parsedSegment);
        } else {
          route.path = parsedSegment;
        }
      }
    }
    parent.push(route);
  }

  return prepareRoutes(routes);
};

function findRouteByName(
  name: string,
  routes: NoyauRoute[]
): NoyauRoute | undefined {
  for (const route of routes) {
    if (route.name === name) {
      return route;
    }
  }
  return findRouteByName(name, routes);
}

const prepareRoutes = (
  routes: NoyauRoute[],
  parent?: NoyauRoute,
  names = new Set<string>()
) => {
  for (const route of routes) {
    if (route.name) {
      route.name = route.name.replace(/\/(?:index|\([\w-]+\))$/, "");

      if (!parent) {
        route.name = route.name.replace(/^\/+/, "");
      }

      if (names.has(route.name)) {
        const existingRoute = findRouteByName(route.name, routes);
        const extra =
          existingRoute && existingRoute.name !== undefined
            ? `is the same as \`${relative(
                tryUseNoyau()?.options.srcDir ?? "",
                existingRoute.file
              )}\``
            : "is a duplicate";
        logger.warn(
          `Route name generated for \`${relative(
            tryUseNoyau()?.options.srcDir ?? "",
            route.file
          )}\` ${extra}.`
        );
      }
    }

    // if (parent) {
    //   const [firstSegment, isArray] = getFirstSegment(route.path);
    //   if (firstSegment.type === "static" && firstSegment.value === "/") {

    //   }
    // }

    if (route.children?.length) {
      prepareRoutes(route.children, route, names);
    } else {
      delete route.children;
    }

    if (
      route.children?.find(
        (childRoute) =>
          (Array.isArray(childRoute.path) &&
            childRoute.path.length === 1 &&
            childRoute.path[0].value) ||
          (!Array.isArray(childRoute.path) && childRoute.path.value === "")
      )
    ) {
      delete route.name;
    }

    if (route.name !== undefined) {
      // really dumb hack to make sure we don't have duplicate route names ONLY for the root ex. index & (index)
      if (!parent) {
        if (route.name.startsWith("(") && route.name.endsWith(")")) {
          names.add("index");
        }
      }
      names.add(route.name);
    }
  }

  return routes;
};

export const printSegment = (segment: RouteSegment) => {
  if (segment.type === "static") {
    return segment.value;
  }
  if (segment.type === "dynamic") {
    return `[${segment.value}]`;
  }
  if (segment.type === "optional") {
    return `[[${segment.value}]]`;
  }
  if (segment.type === "splat") {
    return `[...${segment.value}]`;
  }

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown segment type ${segment.type}`);
};

// gogo co-pilot
export const parseSegment = (segment: string) => {
  const type: RouteSegmentType = (() => {
    if (segment.startsWith("[[") && segment.endsWith("]]")) {
      return "optional";
    }
    if (segment.startsWith("[...") && segment.endsWith("]")) {
      return "splat";
    }
    if (segment.startsWith("[") && segment.endsWith("]")) {
      return "dynamic";
    }
    return "static";
  })();
  const value = (() => {
    if (type === "dynamic") {
      return segment.slice(1, -1);
    }
    if (type === "optional") {
      return segment.slice(2, -2);
    }
    if (type === "splat") {
      return segment.slice(4, -1);
    }
    return segment;
  })();
  return { type, value };
};

const getLastSegment = (segment: RouteSegment | RouteSegment[]) => {
  if (Array.isArray(segment)) {
    return [segment[segment.length - 1], true];
  }
  return [segment, false];
};

const getFirstSegment = (segment: RouteSegment | RouteSegment[]) => {
  if (Array.isArray(segment)) {
    return [segment[0], true];
  }
  return [segment, false];
};
