import { assert, assertEquals, assertFalse } from "@std/assert";
import { describe, it } from "testing/bdd";
import { Hotel } from "../src/models/hotel.ts";
import {
  BuyStocks,
  Merger,
  MergeType,
  TradeStats,
} from "../src/models/merger.ts";
import { stub } from "testing/mock";
import { StdGame } from "../src/models/stdGame.ts";
import { HotelName, Player } from "../src/models/player.ts";
import { Board, TileStatus } from "../src/models/board.ts";
import { BonusDistribution, Game } from "../src/models/game.ts";

const createPlayers = (idTexts: string): Player[] =>
  idTexts.split(" ").map((id: string) => new Player(id));

describe("Merger class", () => {
  const csv = (text: string, separator = " ") => text.split(separator);
  it("should return the game state", () => {
    const board = new Board([]);
    const game: Game = new StdGame([], [], board);
    const merger = new Merger(game);

    assertEquals(merger.playTurn("3A"), merger);
  });

  it("should return the size of hotel", () => {
    const hotel = new Hotel("Imperial", 2);
    hotel.addTile("1A");
    hotel.addTile("2A");
    assertEquals(hotel.getSize(), 2);
  });

  it("should return error with message when accessing BuyStocks", () => {
    const board = new Board([]);
    const game = new StdGame([], [], board);
    const merger = new Merger(game);
    const { error } = merger.buyStocks([], "");
    assertEquals(error, "Not valid in Merger Mode");
  });

  it("should return error with message when accessing foundHotel", () => {
    const board = new Board([]);
    const game = new StdGame([], [], board);
    const merger = new Merger(game);
    const { error } = merger.foundHotel("", "American");
    assertEquals(error, "Not valid in Merger Mode");
  });

  it("should return changed player Id", () => {
    let index = 0;
    const board = new Board([]);
    const game = new StdGame([], createPlayers("p1 p2 p3"), board);
    const merger = new Merger(game);
    stub(merger, "doesPlayerHasStocks", () => {
      const value = [true, false][index++];
      return value;
    });
    const status = merger.changeTurn();

    assertEquals(status, { status: "p2" });
  });

  it("should return changed player Id", () => {
    const board = new Board([]);
    const game = new StdGame([], createPlayers("p1 p2 p3"), board);
    const merger = new Merger(game);
    stub(merger, "doesPlayerHasStocks", () => {
      return true;
    });
    const status = merger.changeTurn();

    assertEquals(status, { status: "p2" });
  });

  it("should return playerIds", () => {
    const board = new Board([]);
    const game = new StdGame([], createPlayers("p1 p2 p3"), board);
    const merger = new Merger(game);
    const playerIds = merger.getPlayerIds();

    assertEquals(playerIds, ["p1", "p2", "p3"]);
  });

  it("should return game stats", () => {
    const tiles = csv(
      "6A 7A 8A 9A 9B 10B 11B 10A 6B 7B 12B 1I 10I 11H 10H 6H 7H 12H 1H",
    );
    const players = createPlayers("p1 p2 p3");
    const continental = new Hotel("Continental", 2);
    const board = new Board([continental]);
    const game = new StdGame(tiles, players, board);
    const merger = new Merger(game);
    const gameStats = merger.getGameStats("p1");

    assertEquals(gameStats, {
      board: {
        independentTiles: [],
        activeHotels: [],
        inActiveHotels: [
          {
            name: "Continental",
            tiles: [],
            stocksAvailable: 25,
            stockPrice: 0,
            baseTile: "",
          },
        ],
        mergerTile: null,
      },
      playersId: ["p1", "p2", "p3"],
      currentPlayerId: "p1",
      mergeData: { mode: null, acquirer: null, target: null },
      playerPortfolio: players[0].getPlayerDetails(),
    });
  });

  it("should return playerDetails when id is given", () => {
    const board = new Board([]);
    const game = new StdGame([], createPlayers("p1 p2 p3"), board);
    const merger = new Merger(game);
    const playerDetails = merger.getPlayerDetails("p1");

    assertEquals(playerDetails, {
      playerId: "p1",
      cash: 6000,
      tiles: [],
      stocks: {
        Sackson: 0,
        Tower: 0,
        Festival: 0,
        Worldwide: 0,
        American: 0,
        Continental: 0,
        Imperial: 0,
      },
    });
  });

  it("should return true when player have the stocks", () => {
    const board = new Board([]);
    const game = new StdGame([], createPlayers("p1 p2 p3"), board);
    const player = new Player("Player1");
    const merger = new Merger(game);
    stub(merger, "getPlayer", () => player);
    stub(player, "hasStocksOf", () => true);

    assert(merger.doesPlayerHasStocks());
  });

  it("should return false when player doesn't have the stocks", () => {
    const board = new Board([]);
    const game = new StdGame([], createPlayers("p1 p2 p3"), board);
    const player = new Player("Player1");
    const merger = new Merger(game);
    stub(merger, "getPlayer", () => player);
    stub(player, "hasStocksOf", () => false);

    assertFalse(merger.doesPlayerHasStocks());
  });

  it("should return afftected hotels in merge", () => {
    const imperial = new Hotel("Imperial", 2);
    imperial.addTile("1A");
    imperial.addTile("2A");
    const continental = new Hotel("Continental", 2);
    continental.addTile("4A");
    continental.addTile("5A");
    const board = new Board([imperial, continental]);
    const game = new StdGame(
      ["1A", "2A", "3A", "4A", "5A", "6A"],
      createPlayers("player1"),
      board,
    );
    const merger = new Merger(game);

    assertEquals(merger.getAffectedHotels("3A")[0].getHotelName(), "Imperial");
    assertEquals(
      merger.getAffectedHotels("3A")[1].getHotelName(),
      "Continental",
    );
  });

  it("should return type of merge when two hotels with same length are merging", () => {
    const imperial = new Hotel("Imperial", 2);
    imperial.addTile("1A");
    imperial.addTile("2A");
    const continental = new Hotel("Continental", 2);
    continental.addTile("4A");
    continental.addTile("5A");
    const board = new Board([imperial, continental]);
    const game = new StdGame(
      ["1A", "2A", "3A", "4A", "5A", "6A"],
      createPlayers("player1"),
      board,
    );
    const merger = new Merger(game);

    assertEquals(merger.placeTile("3A"), {
      tile: "3A",
      type: TileStatus.Merge,
      mergeDetails: {
        typeofMerge: MergeType.SelectiveMerge,
        hotels: [
          { name: "Imperial", size: 2, baseTile: "" },
          { name: "Continental", size: 2, baseTile: "" },
        ],
      },
    });
  });

  it("should return type of merge when two hotels with different length are merging", () => {
    const imperial = new Hotel("Imperial", 2);
    imperial.addTile("1A");
    imperial.addTile("2A");
    const continental = new Hotel("Continental", 2);
    continental.addTile("4A");
    continental.addTile("5A");
    continental.addTile("6A");
    const board = new Board([imperial, continental]);
    const game = new StdGame(
      ["1A", "2A", "3A", "4A", "5A", "6A"],
      createPlayers("player1"),
      board,
    );
    const merger = new Merger(game);

    assertEquals(merger.placeTile("3A"), {
      tile: "3A",
      type: TileStatus.Merge,
      mergeDetails: {
        typeofMerge: MergeType.AutoMerge,
        acquirer: { name: "Continental", size: 3, baseTile: "" },
        target: [{ name: "Imperial", size: 2, baseTile: "" }],
      },
    });
  });

  it("should return player details when the trade and sell stocks", () => {
    const imperial = new Hotel("Imperial", 2);
    imperial.addTile("1A");
    imperial.addTile("2A");
    const continental = new Hotel("Continental", 2);
    continental.addTile("4A");
    continental.addTile("5A");
    continental.addTile("6A");
    const board = new Board([imperial, continental]);
    const game = new StdGame(
      ["1A", "2A", "3A", "4A", "5A", "6A"],
      createPlayers("player1"),
      board,
    );
    const player = new Player("player1");
    player.addStock(5, "Continental");

    const mergerGame = new Merger(game);
    stub(game, "getPlayer", () => player);
    stub(game, "getPlayerDetails", () => player.getPlayerDetails());

    const tradeStats: TradeStats = {
      acquirer: "Imperial",
      target: "Continental",
      count: 2,
    };
    const playerId = "player1";
    const sellStocks: BuyStocks[] = [{ hotel: "Continental", count: 2 }];
    assertEquals(
      mergerGame.tradeAndSellStocks(tradeStats, sellStocks, playerId),
      {
        playerId: "player1",
        cash: 7000,
        tiles: [],
        stocks: {
          Sackson: 0,
          Tower: 0,
          Festival: 0,
          Worldwide: 0,
          American: 0,
          Continental: 1,
          Imperial: 1,
        },
      },
    );
  });

  it("should return the acquirer and targets along with the players who got the primart and secondary bonuses.", () => {
    const imperial = new Hotel("Imperial", 2);
    imperial.addTile("1A");
    imperial.addTile("2A");
    const continental = new Hotel("Continental", 2);
    continental.addTile("4A");
    continental.addTile("5A");
    const board = new Board([imperial, continental]);
    const game = new StdGame(
      ["1A", "2A", "3A", "4A", "5A", "6A"],
      createPlayers("player1"),
      board,
    );
    const merger = new Merger(game);

    merger.placeTile("3A");
    stub(merger, "distributeBonus", () => undefined);
    const mergerHotelsDetails = merger.setupMergerEntities("Imperial");
    assertEquals(mergerHotelsDetails, {
      acquirer: "Imperial",
      target: ["Continental"],
    });
  });

  it("should return the acquirer and targets along with the players who got the primary and secondary bonuses.", () => {
    const imperial = new Hotel("Imperial", 2);
    imperial.addTile("1A");
    imperial.addTile("2A");
    const continental = new Hotel("Continental", 2);
    continental.addTile("4A");
    continental.addTile("5A");

    const board = new Board([imperial, continental]);
    const game = new StdGame(
      ["1A", "2A", "3A", "4A", "5A", "6A"],
      createPlayers("player1"),
      board,
    );
    const merger = new Merger(game);

    merger.placeTile("3A");
    stub(merger, "distributeBonus", () => undefined);
    const mergerHotelsDetails = merger.setupMergerEntities("Imperial");
    assertEquals(mergerHotelsDetails, {
      acquirer: "Imperial",
      target: ["Continental"],
    });
  });

  it("should return the StdInstance instance if the merger is commpleted", () => {
    const imperial = new Hotel("Imperial", 2);
    imperial.addTile("1A");
    imperial.addTile("2A");
    const continental = new Hotel("Continental", 2);
    continental.addTile("4A");
    continental.addTile("5A");
    const board = new Board([imperial, continental]);
    const game = new StdGame(
      ["1A", "2A", "3A", "4A", "5A", "6A"],
      createPlayers("player1"),
      board,
    );
    const merger = new Merger(game);

    merger.placeTile("3A");
    stub(merger, "distributeBonus", () => undefined);
    merger.setupMergerEntities("Imperial");
    merger.changeTurn();
    merger.changeTurn();
    merger.changeTurn();
    merger.changeTurn();
    merger.changeTurn();
    const instance = merger.playTurn();

    assert(instance instanceof StdGame);
  });

  it("should return the merger instance if the merger is not completed", () => {
    const board = new Board([]);
    const game = new StdGame(["1A"], createPlayers("p1 p2 p3"), board);
    const merger = new Merger(game);
    const instance = merger.playTurn("1A");

    assert(instance instanceof Merger);
  });

  it("should return changed player Id when the player does not have stocks and turn over", () => {
    let index = 0;
    const game = new StdGame([], createPlayers("p1 p2 p3"), new Board([]));
    const merger = new Merger(game);
    stub(merger, "doesPlayerHasStocks", () => {
      return false;
    });
    stub(merger, "isMergerRoundOver", () => {
      const value = [true, false][index++];
      return value;
    });

    const status = merger.changeTurn();

    assertEquals(status, { status: "p3" });
  });

  it("should return the stdGame after every turn is done", () => {
    const imperial = new Hotel("Imperial", 2);
    imperial.addTile("1A");
    imperial.addTile("2A");
    imperial.addTile("1B");
    const continental = new Hotel("Continental", 2);
    continental.addTile("4A");
    continental.addTile("5A");
    const board = new Board([imperial, continental]);

    const game = new StdGame(
      ["1A", "2A", "3A", "4A", "5A", "6A", "1B"],
      [new Player("player1")],
      board,
    );

    const merger = game.playTurn("3A") as Merger;
    stub(merger, "distributeBonus", () => undefined);
    merger.isMergerRoundOver();
    stub(merger, "doesPlayerHasStocks", () => true);

    merger.placeTile("3A");
    merger.setupMergerEntities("Imperial");
    merger.changeTurn();
    merger.playTurn();
    merger.changeTurn();
    merger.playTurn();
    merger.changeTurn();
    const stdGame = merger.playTurn();

    stdGame.buyStocks([], "player1");
    assert(stdGame instanceof StdGame);
  });

  it("should return the bonus details", () => {
    const imperial = new Hotel("Imperial", 2);
    imperial.addTile("1A");
    imperial.addTile("2A");
    const continental = new Hotel("Continental", 2);
    continental.addTile("4A");
    continental.addTile("5A");
    const game = new StdGame(
      ["1A", "2A", "3A", "4A", "5A", "6A"],
      createPlayers("player1"),
      new Board([continental, imperial]),
    );
    const merger = game.playTurn("3A");
    merger.placeTile("3A");
    stub(game, "distributeBonus", (): BonusDistribution => []);
    const mergerHotelsDetails = merger.setupMergerEntities("Imperial");
    assertEquals(mergerHotelsDetails, {
      acquirer: "Imperial",
      target: ["Continental"],
    });
  });

  it("should return false when game is not ended", () => {
    const imperial = new Hotel("Imperial", 2);
    const board = new Board([imperial]);
    const tiles = csv(
      "6A 7A 8A 9A 9B 10B 11B 10A 6B 7B 12B 1I 10I 11H 10H 6H 7H 12H 1H",
    );
    imperial.toggleStatus();

    const game = new StdGame(tiles, createPlayers("Adi Malli"), board);
    const merger = new Merger(game);

    assertFalse(merger.isGameEnd());
  });

  describe("winner()", () => {
    it("should return the winner id", () => {
      const imperial = new Hotel("Imperial", 2);
      const tiles = csv(
        "6A 7A 8A 9A 9B 10B 11B 10A 6B 7B 12B 1I 10I 11H 10H 6H 7H 12H 1H",
      );
      const player1 = new Player("1");
      const player2 = new Player("2");
      const board = new Board([imperial]);
      const game = new StdGame(tiles, [player1, player2], board);
      player1.creditCash(2000);
      const merger = new Merger(game);

      const winner = merger.winner();

      assertEquals(winner, "1");
    });
  });

  describe("distributeEndGameBonus()", () => {
    it("Should credit the avg of primary & secondary bonus among the players if there are multiple eligible players for highest equal number of stocks", () => {
      const tiles = csv(
        "6A 7A 8A 9A 9B 10B 11B 10A 6B 7B 12B 1I 10I 11H 10H 6H 7H 12H 1H",
      );
      const imperial = new Hotel("Imperial", 2);
      const continental = new Hotel("Continental", 2);
      const player1 = new Player("1");
      const player2 = new Player("2");
      const player3 = new Player("3");

      stub(imperial, "getPrimaryBonus", () => 2000);
      stub(imperial, "getSecondaryBonus", () => 1000);
      stub(continental, "getPrimaryBonus", () => 5000);
      stub(continental, "getSecondaryBonus", () => 2500);
      player1?.addStock(5, "Imperial");
      player2?.addStock(4, "Imperial");
      player3?.addStock(3, "Imperial");

      player1?.addStock(5, "Continental");
      player2?.addStock(4, "Continental");
      player3?.addStock(3, "Continental");
      const board = new Board([imperial, continental]);
      stub(board, "getHotels", (): HotelName[] => ["Imperial", "Continental"]);
      const game = new StdGame(tiles, [player1, player2, player3], board);
      const merger = new Merger(game);

      assertEquals(merger.getPlayerDetails("1")?.cash, 6000);
      assertEquals(merger.getPlayerDetails("2")?.cash, 6000);

      merger.distributeEndGameBonus();

      assertEquals(merger.getPlayerDetails("1")?.cash, 13000);
      assertEquals(merger.getPlayerDetails("2")?.cash, 9500);
    });
  });
});
