import { CurrentGame } from "./CurrentGame.ts";

import { Hotel } from "./hotel.ts";
import _ from "lodash";
import { StdGame } from "./stdGame.ts";
import { Player } from "./player.ts";
import { Board } from "./board.ts";

export const createHotels = (): Hotel[] => {
  const hotelData = [
    { name: "Tower", rank: 0 },
    { name: "Sackson", rank: 0 },
    { name: "Festival", rank: 1 },
    { name: "American", rank: 1 },
    { name: "Worldwide", rank: 1 },
    { name: "Imperial", rank: 2 },
    { name: "Continental", rank: 2 },
  ];

  return hotelData.map(({ name, rank }) => new Hotel(name, rank));
};

const tiles = JSON.parse(await Deno.readTextFile("./src/data/tiles.json"));
const generateShuffledTiles = () => _.shuffle(tiles);

class GameManager {
  private gamesMap: Map<string, StdGame>;
  private gameStateMap: Map<string, CurrentGame>;
  private tileGenerator: () => string[];
  private hotels: () => Hotel[];

  constructor(
    tileGenerator: () => string[] = generateShuffledTiles,
    hotelGenerator: () => Hotel[] = createHotels,
  ) {
    this.tileGenerator = tileGenerator;
    this.gamesMap = new Map();
    this.hotels = hotelGenerator;
    this.gameStateMap = new Map();
  }

  private createPlayers(playerIds: string[]): Player[] {
    return playerIds.map((playerId) => new Player(playerId));
  }

  createGame(gameId: string, playerIds: string[]): StdGame {
    const game = new StdGame(
      this.tileGenerator(),
      this.createPlayers(playerIds),
      new Board(this.hotels()),
    );
    const currentGame = new CurrentGame(game);
    this.gamesMap.set(gameId, game);
    this.gameStateMap.set(gameId, currentGame);

    return game;
  }

  getGame(gameId: string): StdGame | undefined {
    return this.gamesMap.get(gameId);
  }

  getCurrentGame(gameId: string): CurrentGame | undefined {
    return this.gameStateMap.get(gameId);
  }
}

export { GameManager };
