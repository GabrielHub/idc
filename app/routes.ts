import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("playground", "routes/playground.tsx"),
  route("api/game", "routes/api.game.ts"),
  route("api/playground-ai", "routes/api.playground-ai.ts"),
] satisfies RouteConfig;
