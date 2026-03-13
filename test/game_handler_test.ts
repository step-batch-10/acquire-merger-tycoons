import { assertEquals, assertFalse } from "assert";
import { describe, it } from "testing/bdd";
import { createApp } from "../src/app.ts";
import { Sessions } from "../src/models/sessions.ts";
import { GameManager } from "../src/models/game_manager.ts";
import { Hotel } from "../src/models/hotel.ts";
import { assertSpyCallArgs, stub } from "testing/mock";
import { Lobby } from "../src/models/lobby.ts";
import { StdGame } from "../src/models/stdGame.ts";
import { CurrentGame } from "../src/models/CurrentGame.ts";
import { BuyStocks, Merger } from "../src/models/merger.ts";
import { EndBonusDetails, Game, MergerData } from "../src/models/game.ts";
import { Player } from "../src/models/player.ts";
import { Board } from "../src/models/board.ts";

const createPlayers = (idTexts: string): Player[] =>
  idTexts.split(" ").map((id: string) => new Player(id));

describe("App: /login", () => {
  it("should receive a cookie and redirect to index page", async () => {
    const idGenerator = () => "1";

    const formData = new FormData();
    formData.set("playerName", "Adhi");
    const tileGenerator = () => ["1A"];
    const gameManager = new GameManager(tileGenerator);
    const sessions = new Sessions(idGenerator);
    const app = createApp(sessions, gameManager);
    const res = await app.request("/loginDetails", {
      method: "POST",
      body: formData,
    });

    assertEquals(res.headers.getSetCookie(), ["sessionId=1; Path=/"]);
    assertEquals(res.status, 303);
  });

  it("should redirect to index page if already loggedin", async () => {
    const tileGenerator = () => ["1A"];
    const gameManager = new GameManager(tileGenerator);
    const idGenerator = () => "1";
    const sessions = new Sessions(idGenerator);
    sessions.addPlayer("likhi");
    const app = createApp(sessions, gameManager);
    const res = await app.request("/login", {
      headers: { cookie: "sessionId=1;gameId=1" },
    });

    assertEquals(res.status, 303);
  });

  it("should open login page if not logged in .", async () => {
    const idGenerator = () => "1";
    const tileGenerator = () => ["1A"];
    const gameManager = new GameManager(tileGenerator);
    const sessions = new Sessions(idGenerator);
    const app = createApp(sessions, gameManager);

    const res = await app.request("/login");
    await res.text();
    assertEquals(res.status, 200);
  });
});

describe("App: acquire/game-status", () => {
  it("should return the game status when only one player", async () => {
    let id = 0;
    const idGenerator = () => `${id++}`;
    const tileGenerator = () => ["1A"];
    const gameManager = new GameManager(tileGenerator);
    const sessions = new Sessions(idGenerator);
    const playerId = sessions.addPlayer("Adi");
    const lobby = new Lobby(idGenerator);
    lobby.addToWaitingList("0", gameManager, sessions.getPlayer(playerId));

    const app = createApp(sessions, gameManager, lobby);
    const res = await app.request("/acquire/game-status", {
      method: "GET",
      headers: { cookie: "sessionId=0;gameId=1" },
    });

    assertEquals(await res.json(), {
      gameId: "1",
      players: [{ name: "Adi", status: "Waiting" }],
    });
    assertEquals(res.status, 200);
  });

  it("should return the game status as START when required number of players join the game", async () => {
    let id = 0;
    const idGenerator = () => `${id++}`;
    const gameManager = new GameManager();
    const sessions = new Sessions(idGenerator);
    const player1 = sessions.addPlayer("Adi");
    const player2 = sessions.addPlayer("Bdi");
    const player3 = sessions.addPlayer("Cdi");
    const lobby = new Lobby(idGenerator);
    lobby.addToWaitingList("0", gameManager, sessions.getPlayer(player1));
    lobby.addToWaitingList("1", gameManager, sessions.getPlayer(player2));
    lobby.addToWaitingList("2", gameManager, sessions.getPlayer(player3));

    const app = createApp(sessions, gameManager);
    const res = await app.request("/acquire/game-status", {
      method: "GET",
      headers: { cookie: "sessionId=1;gameId=3" },
    });

    assertEquals(await res.json(), { status: "START" });
    assertEquals(res.status, 200);
  });
});

describe("App: acquire/home/quick-play", () => {
  it("should add player in waiting list", async () => {
    const sessions = new Sessions(() => "1");
    sessions.addPlayer("Krishna");
    const gameManager = new GameManager();
    const lobby = new Lobby(() => "1");
    const app = createApp(sessions, gameManager, lobby);
    const res = await app.request("/acquire/home/quick-play", {
      method: "POST",
      headers: {
        cookie: "sessionId=1",
      },
    });

    assertEquals(res.status, 200);
    assertEquals(await res.json(), "1");
  });

  it("should set gameId to a player", async () => {
    const sessions = new Sessions(() => "1");
    sessions.addPlayer("Krishna");
    const tileGenerator = () => ["A1", "A2"];
    const gameManager = new GameManager(tileGenerator);
    const lobby = new Lobby(() => "1");
    const app = createApp(sessions, gameManager, lobby);
    const res = await app.request("/acquire/home/quick-play", {
      method: "POST",
      headers: {
        cookie: "sessionId=1",
      },
    });

    assertEquals(res.headers.getSetCookie(), ["gameId=1; Path=/"]);
  });
});

describe("App: /", () => {
  it("should redirect to waiting page when player already have gameId and is waiting", async () => {
    const sessions = new Sessions(() => "1");
    sessions.addPlayer("Krishna");
    const tileGenerator = () => ["A1", "A2"];
    const gameManager = new GameManager(tileGenerator);
    const app = createApp(sessions, gameManager);
    const res = await app.request("/", {
      headers: {
        cookie: "sessionId=1;gameId=1",
      },
    });

    assertEquals(res.status, 303);
    assertEquals(res.headers.get("location"), "/lobby");
  });

  it("should redirect to game page when three players started the game", async () => {
    let i = 1;
    const idGenerator = () => `${i++}`;
    const sessions = new Sessions(idGenerator);
    const gameManager = new GameManager();
    const p1 = sessions.addPlayer("Krishna");
    const p2 = sessions.addPlayer("Sudheer");
    const p3 = sessions.addPlayer("Adi");
    const lobby = new Lobby(idGenerator);
    lobby.addToWaitingList("1", gameManager, sessions.getPlayer(p1));
    lobby.addToWaitingList("2", gameManager, sessions.getPlayer(p2));
    lobby.addToWaitingList("3", gameManager, sessions.getPlayer(p3));

    const app = createApp(sessions, gameManager, lobby);
    const res = await app.request("/", {
      headers: {
        cookie: "sessionId=1;gameId=4",
      },
    });

    assertEquals(res.status, 303);
    assertEquals(res.headers.get("location"), "/gameSetup");
  });

  it("should redirect to game page when accessing lobby", async () => {
    let i = 0;
    const idGenerator = () => `${i++}`;
    const sessions = new Sessions(idGenerator);
    const gameManager = new GameManager();
    const p1 = sessions.addPlayer("Krishna");
    const p2 = sessions.addPlayer("Sudheer");
    const p3 = sessions.addPlayer("Adi");
    const lobby = new Lobby(idGenerator);
    lobby.addToWaitingList("0", gameManager, sessions.getPlayer(p1));
    lobby.addToWaitingList("1", gameManager, sessions.getPlayer(p2));
    lobby.addToWaitingList("2", gameManager, sessions.getPlayer(p3));

    const app = createApp(sessions, gameManager, lobby);
    const res = await app.request("/lobby", {
      headers: {
        cookie: "sessionId=1;gameId=3",
      },
    });

    assertEquals(res.status, 303);
    assertEquals(res.headers.get("location"), "/gameSetup");
  });

  it("should redirect to game page when accessing game", async () => {
    let i = 0;
    const idGenerator = () => `${i++}`;
    const sessions = new Sessions(idGenerator);
    const gameManager = new GameManager();
    const p1 = sessions.addPlayer("Krishna");
    const p2 = sessions.addPlayer("Sudheer");
    const p3 = sessions.addPlayer("Adi");
    const lobby = new Lobby(idGenerator);
    lobby.addToWaitingList("0", gameManager, sessions.getPlayer(p1));
    lobby.addToWaitingList("1", gameManager, sessions.getPlayer(p2));
    lobby.addToWaitingList("2", gameManager, sessions.getPlayer(p3));

    const app = createApp(sessions, gameManager, lobby);
    const res = await app.request("/gameSetup", {
      headers: {
        cookie: "sessionId=1;gameId=3",
      },
    });
    await res.text();

    assertEquals(res.status, 200);
  });

  it("should redirect to lobby when accessing game page", async () => {
    let i = 0;
    const idGenerator = () => `${i++}`;
    const sessions = new Sessions(idGenerator);
    const tileGenerator = () => ["A1", "A2"];
    const gameManager = new GameManager(tileGenerator);
    sessions.addPlayer("Krishna");
    const lobby = new Lobby();
    lobby.addToWaitingList("1", gameManager, {
      name: "Adi",
      status: "Waiting",
    });

    const app = createApp(sessions, gameManager);
    const res = await app.request("/gameSetup", {
      headers: {
        cookie: "sessionId=1;gameId=0",
      },
    });

    assertEquals(res.status, 303);
    assertEquals(res.headers.get("location"), "/lobby");
  });

  it("should remove cookies when logout", async () => {
    let i = 0;
    const idGenerator = () => `${i++}`;
    const sessions = new Sessions(idGenerator);
    const tileGenerator = () => ["A1", "A2"];
    const gameManager = new GameManager(tileGenerator);
    sessions.addPlayer("Krishna");
    const lobby = new Lobby();
    lobby.addToWaitingList("1", gameManager, {
      name: "Adi",
      status: "Waiting",
    });

    const app = createApp(sessions, gameManager);
    const res = await app.request("/logout", {
      headers: {
        cookie: "sessionId=1;gameId=0",
      },
    });

    assertEquals(res.status, 303);
  });

  it("should redirect to lobby when accessing lobby page", async () => {
    let i = 1;
    const idGenerator = () => `${i++}`;
    const sessions = new Sessions(idGenerator);
    const gameManager = new GameManager();
    const lobby = new Lobby();
    const p1 = sessions.addPlayer("Krishna");
    lobby.addToWaitingList("1", gameManager, sessions.getPlayer(p1));

    const app = createApp(sessions, gameManager);
    const res = await app.request("/lobby", {
      headers: {
        cookie: "sessionId=1;gameId=2",
      },
    });

    await res.text();
    assertEquals(res.status, 200);
  });

  it("should return the home page", async () => {
    const idGenerator = () => "1";
    const sessions = new Sessions(idGenerator);
    const tileGenerator = () => ["A1", "A2"];
    const gameManager = new GameManager(tileGenerator);
    sessions.addPlayer("Krishna");

    const app = createApp(sessions, gameManager);
    const res = await app.request("/", {
      headers: {
        cookie: "sessionId=1",
      },
    });
    await res.text();

    assertEquals(res.status, 200);
  });

  it("should return to index page when accesing game", async () => {
    const idGenerator = () => "1";
    const sessions = new Sessions(idGenerator);
    const tileGenerator = () => ["A1", "A2"];
    const gameManager = new GameManager(tileGenerator);
    sessions.addPlayer("Krishna");

    const app = createApp(sessions, gameManager);
    const res = await app.request("/gameSetup", {
      headers: {
        cookie: "sessionId=1",
      },
    });
    await res.text();

    assertEquals(res.status, 303);
  });

  it("should return to index page when accesing lobby", async () => {
    const idGenerator = () => "1";
    const sessions = new Sessions(idGenerator);
    const tileGenerator = () => ["A1", "A2"];
    const gameManager = new GameManager(tileGenerator);
    sessions.addPlayer("Krishna");

    const app = createApp(sessions, gameManager);
    const res = await app.request("/lobby", {
      headers: {
        cookie: "sessionId=1",
      },
    });
    await res.text();

    assertEquals(res.status, 303);
  });

  it("should return the login page", async () => {
    const idGenerator = () => "1";
    const sessions = new Sessions(idGenerator);
    const tileGenerator = () => ["1A"];
    const gameManager = new GameManager(tileGenerator);

    const app = createApp(sessions, gameManager);
    const res = await app.request("/");
    await res.text();

    assertEquals(res.status, 303);
  });
});

describe("App: /game-stats", () => {
  const csv = (text: string, separator = " ") => text.split(separator);
  it("should return game stats when game starts", async () => {
    const tiles = csv(
      "6A 7A 8A 9A 9B 10B 11B 10A 6B 7B 12B 1I 10I 11H 10H 6H 7H 12H 1H",
    );
    let id = 1;
    const idGenerator = () => `${id++}`;
    const tileGenerator = () => tiles;
    const gameManager = new GameManager(tileGenerator, () => [
      new Hotel("Imperial", 2),
    ]);
    const sessions = new Sessions(idGenerator);
    const player1 = sessions.addPlayer("Adi");
    const player2 = sessions.addPlayer("bisht");
    const player3 = sessions.addPlayer("malli");
    const lobby = new Lobby(idGenerator);
    lobby.addToWaitingList("1", gameManager, sessions.getPlayer(player1));
    lobby.addToWaitingList("2", gameManager, sessions.getPlayer(player2));
    lobby.addToWaitingList("3", gameManager, sessions.getPlayer(player3));

    const app = createApp(sessions, gameManager, lobby);
    const res = await app.request("/acquire/game-stats", {
      method: "GET",
      headers: { cookie: "sessionId=1;gameId=4" },
    });
    const expected = {
      board: {
        independentTiles: [],
        activeHotels: [],
        inActiveHotels: [
          {
            baseTile: "",
            name: "Imperial",
            stockPrice: 0,
            stocksAvailable: 25,
            tiles: [],
          },
        ],
        mergerTile: null,
      },
      playerPortfolio: {
        cash: 6000,
        playerId: "1",
        stocks: {
          American: 0,
          Continental: 0,
          Festival: 0,
          Imperial: 0,
          Sackson: 0,
          Tower: 0,
          Worldwide: 0,
        },
        tiles: ["6A", "7A", "8A", "9A", "9B", "10B"],
      },
      players: [
        { isTheSamePlayer: true, name: "Adi" },
        { isTheSamePlayer: false, name: "bisht" },
        { isTheSamePlayer: false, name: "malli" },
      ],
      currentPlayer: "Adi",
      isMyTurn: true,
      isGameEnd: false,
      gameState: null,
    };

    assertEquals(res.status, 200);
    assertEquals(await res.json(), expected);
  });

  it("should return the first player as current player when game starts", async () => {
    let id = 1;
    const idGenerator = () => `${id++}`;
    const tileGenerator = () => ["1A"];
    const gameManager = new GameManager(tileGenerator);
    const sessions = new Sessions(idGenerator);
    const player1 = sessions.addPlayer("Adi");
    const player2 = sessions.addPlayer("bisht");
    const player3 = sessions.addPlayer("malli");
    const lobby = new Lobby(idGenerator);
    lobby.addToWaitingList("1", gameManager, sessions.getPlayer(player1));
    lobby.addToWaitingList("2", gameManager, sessions.getPlayer(player2));
    lobby.addToWaitingList("3", gameManager, sessions.getPlayer(player3));

    const app = createApp(sessions, gameManager, lobby);
    const res = await app.request("/acquire/game-stats", {
      method: "GET",
      headers: { cookie: "sessionId=2;gameId=4" },
    });
    const gameStats = await res.json();
    assertEquals(gameStats.currentPlayer, "Adi");
    assertEquals(gameStats.players, [
      { isTheSamePlayer: false, name: "Adi" },
      { isTheSamePlayer: true, name: "bisht" },
      { isTheSamePlayer: false, name: "malli" },
    ]);
    assertEquals(res.status, 200);
  });
});

describe("App: /acquire/place-tile/:tile", () => {
  it("should return true if tile placed", async () => {
    let id = 1;
    const idGenerator = () => `${id++}`;
    const tileGenerator = () => ["1A", "2A"];
    const gameManager = new GameManager(tileGenerator);
    const sessions = new Sessions(idGenerator);
    const player1 = sessions.addPlayer("Adi");
    const player2 = sessions.addPlayer("bisht");
    const player3 = sessions.addPlayer("malli");
    const lobby = new Lobby(idGenerator);
    lobby.addToWaitingList("1", gameManager, sessions.getPlayer(player1));
    lobby.addToWaitingList("2", gameManager, sessions.getPlayer(player2));
    lobby.addToWaitingList("3", gameManager, sessions.getPlayer(player3));

    const app = createApp(sessions, gameManager, lobby);
    const res = await app.request("/acquire/place-tile/1A", {
      method: "PATCH",
      headers: { cookie: "sessionId=1;gameId=4" },
    });

    assertEquals(await res.json(), { type: "Independent", tile: "1A" });
    assertEquals(res.status, 200);
  });

  it("should return true if tile placed", async () => {
    let id = 1;
    const idGenerator = () => `${id++}`;
    const tileGenerator = () => ["1A", "2A"];
    const gameManager = new GameManager(tileGenerator);
    const sessions = new Sessions(idGenerator);
    const player1 = sessions.addPlayer("Adi");
    const player2 = sessions.addPlayer("bisht");
    const player3 = sessions.addPlayer("malli");
    const lobby = new Lobby(idGenerator);
    lobby.addToWaitingList("1", gameManager, sessions.getPlayer(player1));
    lobby.addToWaitingList("2", gameManager, sessions.getPlayer(player2));
    lobby.addToWaitingList("3", gameManager, sessions.getPlayer(player3));

    const app = createApp(sessions, gameManager);
    const res = await app.request("/acquire/place-tile/3A", {
      method: "PATCH",
      headers: { cookie: "sessionId=1;gameId=4" },
    });

    assertFalse((await res.json()).status);
    assertEquals(res.status, 200);
  });
});

describe("App: /acquire/place-tile/:tile/:hotel", () => {
  it("should return the new hotel info when the hotel build request is send with the hotel name", async () => {
    let id = 1;
    const idGenerator = () => `${id++}`;
    const tileGenerator = () => ["2A", "3A"];
    const imperial = () => [new Hotel("Imperial", 2)];
    const gameManager = new GameManager(tileGenerator, imperial);
    const sessions = new Sessions(idGenerator);
    const player1 = sessions.addPlayer("Adi");
    const player2 = sessions.addPlayer("bisht");
    const player3 = sessions.addPlayer("malli");
    const lobby = new Lobby(idGenerator);
    lobby.addToWaitingList("1", gameManager, sessions.getPlayer(player1));
    lobby.addToWaitingList("2", gameManager, sessions.getPlayer(player2));
    lobby.addToWaitingList("3", gameManager, sessions.getPlayer(player3));

    const app = createApp(sessions, gameManager);

    await app.request("/acquire/place-tile/3A", {
      method: "PATCH",
      headers: { cookie: "sessionId=1;gameId=4" },
    });

    const res = await app.request("/acquire/place-tile/2A/Imperial", {
      method: "PATCH",
      headers: { cookie: "sessionId=1;gameId=4" },
    });

    assertEquals(await res.json(), {
      hotel: {
        baseTile: "2A",
        name: "Imperial",
        stockPrice: 400,
        stocksAvailable: 24,
        tiles: ["3A"],
      },
      stockAllotted: true,
    });
    assertEquals(res.status, 200);
  });
});

const createTestAppWithLoggedInUser = (username: string) => {
  let id = 0;
  const idGenerator = () => `${id++}`;
  const gameManager = new GameManager();
  const sessions = new Sessions(idGenerator);
  const imperial = new Hotel("Imperial", 2);
  const board = new Board([imperial]);
  const game = new StdGame([], [], board);
  const app = createApp(sessions, gameManager);
  stub(sessions, "isSessionIdExist", () => true);
  stub(sessions, "getPlayerName", () => username);

  return { app, sessions, gameManager, game };
};

describe("buyStocks() method", () => {
  it("with mock", async () => {
    const playerPortfolio = {
      cash: 4800,
      playerId: "2",
      stocks: {
        American: 0,
        Continental: 0,
        Festival: 0,
        Imperial: 4,
        Sackson: 0,
        Tower: 0,
        Worldwide: 0,
      },
      tiles: [],
    };
    const { game, gameManager, app } = createTestAppWithLoggedInUser(
      "Kungfu Panda",
    );

    const currentGame = new CurrentGame(game);

    const buyStockStub = stub(game, "buyStocks", () => playerPortfolio);

    stub(gameManager, "getCurrentGame", () => currentGame);

    const stocks: BuyStocks[] = [{ hotel: "Imperial", count: 3 }];
    const res = await app.request("/acquire/buy-stocks", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        cookie: "sessionId=2;gameId=0",
      },
      body: JSON.stringify(stocks),
    });
    assertEquals(res.status, 200);
    assertEquals(await res.json(), playerPortfolio);
    assertSpyCallArgs(buyStockStub, 0, [stocks, "2"]);
  });

  it("should update cash and stocks after buying", async () => {
    let id = 1;
    const idGenerator = () => `${id++}`;
    const tileGenerator = () => ["2A", "3A"];
    const imperial = () => [new Hotel("Imperial", 2)];
    const gameManager = new GameManager(tileGenerator, imperial);
    const sessions = new Sessions(idGenerator);
    const player1 = sessions.addPlayer("Adi");
    const player2 = sessions.addPlayer("bisht");
    const player3 = sessions.addPlayer("malli");
    const lobby = new Lobby(idGenerator);
    lobby.addToWaitingList("1", gameManager, sessions.getPlayer(player1));
    lobby.addToWaitingList("2", gameManager, sessions.getPlayer(player2));
    lobby.addToWaitingList("3", gameManager, sessions.getPlayer(player3));

    const app = createApp(sessions, gameManager, lobby);

    await app.request("/acquire/place-tile/3A", {
      method: "PATCH",
      headers: { cookie: "sessionId=1;gameId=4" },
    });

    await app.request("/acquire/end-turn", {
      method: "PATCH",
      headers: { cookie: "sessionId=1;gameId=4" },
    });

    await app.request("/acquire/place-tile/2A/Imperial", {
      method: "PATCH",
      headers: { cookie: "sessionId=2;gameId=4" },
    });

    const stocks: BuyStocks[] = [{ hotel: "Imperial", count: 3 }];
    const res = await app.request("/acquire/buy-stocks", {
      method: "PATCH",
      body: JSON.stringify(stocks),
      headers: {
        "content-type": "application/json",
        cookie: "sessionId=2;gameId=4",
      },
    });

    assertEquals(await res.json(), {
      cash: 4800,
      playerId: "2",
      stocks: {
        American: 0,
        Continental: 0,
        Festival: 0,
        Imperial: 4,
        Sackson: 0,
        Tower: 0,
        Worldwide: 0,
      },
      tiles: [],
    });
  });
});

const createTestAppWithMergerStocks = (username: string) => {
  let id = 0;
  const idGenerator = () => `${id++}`;

  const gameManager = new GameManager();
  const sessions = new Sessions(idGenerator);
  const app = createApp(sessions, gameManager);
  stub(sessions, "isSessionIdExist", () => true);
  stub(sessions, "getPlayerName", () => username);

  const imperial = new Hotel("Imperial", 2);
  const continental = new Hotel("Continental", 2);
  const board = new Board([continental, imperial]);

  const game = new StdGame(
    ["1A", "2A", "3A", "4A", "5A", "6A"],
    createPlayers("player1"),
    board,
  );

  const mergerGame = new Merger(game) as Game;

  return { app, gameManager, mergerGame, sessions, game };
};

describe("tradeAndSellStocks() method", () => {
  it("should return the playerDetails and using mock methods", async () => {
    const playerDetails = {
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
    };
    const { mergerGame, gameManager, app } = createTestAppWithMergerStocks(
      "Kungfu Panda",
    );

    const currentGame = new CurrentGame(mergerGame);
    stub(gameManager, "getCurrentGame", () => currentGame);
    const stubedTradeAndSell = stub(
      mergerGame,
      "tradeAndSellStocks",
      () => playerDetails,
    );

    const tradeStats = {
      acquirer: "Imperial",
      target: "Continental",
      count: 2,
    };
    const playerId = "2";
    const stocks: BuyStocks[] = [{ hotel: "Continental", count: 2 }];

    const data = { tradeStats, stocks, playerId };
    const res = await app.request("/acquire/merger/sell-trade-stocks", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        cookie: "sessionId=2;gameId=0",
      },
      body: JSON.stringify(data),
    });

    assertEquals(res.status, 200);
    assertEquals(await res.json(), playerDetails);
    assertSpyCallArgs(stubedTradeAndSell, 0, [tradeStats, stocks, playerId]);
  });
});

describe("handleMerge() method", () => {
  it("should update and return acquirer and target", async () => {
    const mergerInfo: MergerData = { acquirer: "Tower", target: ["Sackson"] };
    const { mergerGame, gameManager, app } = createTestAppWithMergerStocks(
      "Kungfu Panda",
    );

    const currentGame = new CurrentGame(mergerGame);
    stub(gameManager, "getCurrentGame", () => currentGame);
    const stubedSetupMergerEntities = stub(
      mergerGame,
      "setupMergerEntities",
      () => mergerInfo,
    );

    const acquirer = "Imperial";
    const res = await app.request(`/acquire/continue-merge/${acquirer}`, {
      method: "PATCH",
      headers: {
        cookie: "sessionId=2;gameId=0",
      },
    });

    assertEquals(res.status, 200);
    assertEquals(await res.json(), mergerInfo);
    assertSpyCallArgs(stubedSetupMergerEntities, 0, [acquirer]);
  });

  describe("handleGameEnd()", () => {
    it("should update game end bonus and respond with the game winner", async () => {
      const { game, app, gameManager } = createTestAppWithMergerStocks("Ramu");
      const currentGame = new CurrentGame(game);
      stub(gameManager, "getCurrentGame", () => currentGame);
      stub(game, "distributeEndGameBonus", () => {
        return {} as EndBonusDetails;
      });
      stub(game, "winner", () => "2");

      const res = await app.request(`/acquire/end-game`, {
        method: "GET",
        headers: {
          cookie: "sessionId=2;gameId=0",
        },
      });

      assertEquals(res.status, 200);
      assertEquals((await res.json()).winner, "Ramu");
    });
    it("should update game end bonus and respond with the game winner as empty string", async () => {
      const { game, app, gameManager } = createTestAppWithMergerStocks("");
      const currentGame = new CurrentGame(game);
      stub(gameManager, "getCurrentGame", () => currentGame);
      stub(game, "distributeEndGameBonus", () => {
        return {} as EndBonusDetails;
      });
      stub(game, "winner", () => undefined);

      const res = await app.request(`/acquire/end-game`, {
        method: "GET",
        headers: {
          cookie: "sessionId=2;gameId=0",
        },
      });

      assertEquals(res.status, 200);
      assertEquals((await res.json()).winner, "");
    });
  });

  describe("handleGameEnd()", () => {
    it("should update game end bonus and respond with the game winner", async () => {
      const { app } = createTestAppWithMergerStocks("Ramu");

      const res = await app.request(`/acquire/back-to-home`, {
        method: "GET",
        headers: {
          cookie: "sessionId=2;gameId=0",
        },
      });

      assertEquals(res.status, 303);
    });
  });
});

describe("setTile() handler", () => {
  const createTestAppWithGame = () => {
    const gameManager = new GameManager();
    const sessions = new Sessions(() => "1");
    const imperial = new Hotel("Imperial", 2);
    const board = new Board([imperial]);
    const game = new StdGame(["1A"], createPlayers("player1"), board);
    const app = createApp(sessions, gameManager);
    const currentGame = new CurrentGame(game);

    stub(sessions, "isSessionIdExist", () => true);
    stub(game, "setNextTile", (tile) => tile);
    stub(gameManager, "getCurrentGame", () => currentGame);

    return { app };
  };

  describe("GET /acquire/set-tile/:tile", () => {
    it("should call setNextTile and return the tile", async () => {
      const { app } = createTestAppWithGame();

      const res = await app.request("/acquire/set-tile/5A", {
        method: "GET",
        headers: { cookie: "sessionId=0;gameId=1" },
      });

      assertEquals(res.status, 200);
      assertEquals(await res.text(), "5A");
    });
  });
});
