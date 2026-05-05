import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/game", "routes/api.game.ts"),
] satisfies RouteConfig;
