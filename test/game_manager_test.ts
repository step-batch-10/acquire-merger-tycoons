import { assertEquals } from "@std/assert";
import { describe, it } from "testing/bdd";
import { GameManager } from "../src/models/game_manager.ts";

import _ from "lodash";
import { StdGame } from "../src/models/stdGame.ts";
import { Player } from "../src/models/player.ts";
import { Board } from "../src/models/board.ts";
import { Hotel } from "../src/models/hotel.ts";

describe("GameManager", () => {
  it("should return a new game instance when players are provided", () => {
    const tileGenerator = () => ["1A", "1B"];
    const imperial = new Hotel("Imperial", 2);
    const gm = new GameManager(tileGenerator, () => [imperial]);
    const game = gm.createGame("12", ["sudheer"]);
    assertEquals(
      new StdGame(["1A", "1B"], [new Player("sudheer")], new Board([imperial])),
      game,
    );
  });

  it("should return the specific game instance when gameId is provided", () => {
    const tileGenerator = () => ["1A", "1B"];
    const gm = new GameManager(tileGenerator);
    const game = gm.createGame("12", ["sudheer"]);
    assertEquals(gm.getGame("12"), game);
  });
});
