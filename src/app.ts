import { Context, Hono, Next } from "hono";
import { serveStatic } from "hono/deno";
import { Acquire } from "./models/game.ts";
import { servePlayers } from "./handlers/game_handler.ts";

const setContext =
  (acquire: Acquire) => async (context: Context, next: Next) => {
    context.set("acquire", acquire);
    await next();
  };

export const createApp = (acquire: Acquire) => {
  const app = new Hono();

  app.get("*", serveStatic({ root: "./public" }));
  app.use(setContext(acquire));
  app.get("acquire/players", servePlayers);
  return app;
};
