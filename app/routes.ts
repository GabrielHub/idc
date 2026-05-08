import { type RouteConfig, index, route } from "@react-router/dev/routes";

const isDesktopMode = import.meta.env.MODE === "desktop";

export default [
  index("routes/home.tsx"),
  ...(isDesktopMode ? [] : [route("playground", "routes/playground.tsx")]),
] satisfies RouteConfig;
