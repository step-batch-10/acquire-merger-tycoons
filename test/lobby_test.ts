import { assertEquals } from "@std/assert";
import { describe, it } from "testing/bdd";
import { Lobby } from "../src/models/lobby.ts";
import { GameManager } from "../src/models/game_manager.ts";

describe("lobby model", () => {
  it("testing addToWaitingList", () => {
    let id = 0;
    const idGenerator = () => `${id++}`;
    const sessions = new Lobby(idGenerator);
    const tileGenerator = () => ["1A", "2A"];
    const gameManager = new GameManager(tileGenerator, () => []);
    const player = { name: "sudheer", status: "Waiting" };

    assertEquals(sessions.addToWaitingList("1", gameManager, player), {
      playerId: "1",
      gameId: "0",
    });
  });

  it("testing addToWaitingList for more than 3 players join", () => {
    let id = 0;
    const idGenerator = () => `${id++}`;
    const sessions = new Lobby(idGenerator);
    const player1 = { name: "sudheer", status: "Waiting" };
    const player2 = { name: "sudheer", status: "Waiting" };
    const player3 = { name: "sudheer", status: "Waiting" };
    const player4 = { name: "sudheer", status: "Waiting" };

    const tileGenerator = () => ["1A", "2A"];
    const gameManager = new GameManager(tileGenerator, () => []);

    assertEquals(sessions.addToWaitingList("1", gameManager, player1), {
      playerId: "1",
      gameId: "0",
    });
    assertEquals(sessions.addToWaitingList("2", gameManager, player2), {
      playerId: "2",
      gameId: "0",
    });
    assertEquals(sessions.addToWaitingList("3", gameManager, player3), {
      playerId: "3",
      gameId: "0",
    });
    assertEquals(sessions.addToWaitingList("4", gameManager, player4), {
      playerId: "4",
      gameId: "1",
    });
  });

  it("getWaitingPlayers()", () => {
    let id = 0;
    const idGenerator = () => `${id++}`;
    const lobby = new Lobby(idGenerator);
    const player1 = { name: "p1", status: "LoggedIn" };
    const player2 = { name: "p2", status: "LoggedIn" };
    const sessions = new Map();
    sessions.set("1", player1);
    sessions.set("2", player2);

    const tileGenerator = () => ["1A", "2A"];
    const gameManager = new GameManager(tileGenerator, () => []);

    lobby.addToWaitingList("1", gameManager, player1);
    lobby.addToWaitingList("2", gameManager, player2);

    assertEquals(lobby.getWaitingPlayers(sessions), {
      gameId: "0",
      players: [player1, player2],
    });
  });
});
