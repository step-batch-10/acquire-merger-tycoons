import { assert, assertEquals, assertFalse } from "assert";
import { describe, it } from "testing/bdd";
import { Game } from "../src/models/game.ts";

describe("Game model", () => {
  describe("getPlayerIds(", () => {
    it("should return all the players ids", () => {
      const players: string[] = ["12", "13", "14"];
      const game = new Game(["1A", "2A", "3A", "4A", "5A", "6A"], players);

      game.getPlayerIds().forEach((playerId, i) => {
        assertEquals(playerId, players[i]);
      });
    });
  });

  describe("getPlayer(player) method", () => {
    it("should return a specific player info", () => {
      const players: string[] = ["123"];
      const tiles = ["1A"];
      const game = new Game(tiles, players);
      const actual = game.getPlayerDetails("123");

      assertEquals(actual?.playerId, "123");
      assertEquals(actual?.cash, 6000);
      assertEquals(actual?.tiles, tiles);
    });
  });

  describe("getBoard() method", () => {
    it("should return no tile when no tile is placed", () => {
      const players: string[] = ["Adi", "Malli", "Aman"];
      const game = new Game(["1A", "2A"], players);
      const board = { independentTiles: [], hotels: [] };
      assertEquals(game.getBoard(), board);
    });

    it("should return independtent tiles when one tile is placed", () => {
      const players: string[] = ["Adi", "Malli", "Aman"];
      const game = new Game(["1A", "2A"], players);
      const board = { independentTiles: ["1A"], hotels: [] };
      game.placeTile("1A");
      assertEquals(game.getBoard(), board);
    });

    it("should return independtent tiles when two tile is placed", () => {
      const players: string[] = ["Adi", "Malli", "Aman"];
      const game = new Game(["1A", "2A"], players);
      const board = { independentTiles: ["1A"], hotels: [] };
      game.placeTile("1A");
      game.placeTile("2A");
      assertEquals(game.getBoard(), board);
    });
  });

  describe("placeTile() method", () => {
    it("should return false for wrong tile", () => {
      const players: string[] = ["Adi", "Malli", "Aman"];
      const game = new Game(["1A", "2A"], players);

      assertFalse(game.placeTile("3A").status);
    });

    it("should return true for tile user have", () => {
      const players: string[] = ["Adi", "Malli", "Aman"];
      const game = new Game(["1A", "2A"], players);

      assert(game.placeTile("1A").status);
    });
  });
});
