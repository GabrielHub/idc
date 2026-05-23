import { type RouteConfig, index, route } from "@react-router/dev/routes";

const isDesktopMode = import.meta.env.MODE === "desktop";

export default [
  index("routes/home.tsx"),
  route("docs", "routes/docs.tsx"),
  route("docs/*", "routes/docs.$.tsx"),
  ...(isDesktopMode ? [] : [route("playground", "routes/playground.tsx")]),
] satisfies RouteConfig;
