import { Acquire } from "./game.ts";
class GameManager {
  private gamesMap: Map<string, Acquire>;
  private tiles: string[];

  constructor(tiles: string[]) {
    this.tiles = tiles;
    this.gamesMap = new Map();
  }

  createGame(gameId: string, playerIds: string[]): Acquire {
    const acquire = new Acquire(this.tiles, playerIds);
    this.gamesMap.set(gameId, acquire);

    return acquire;
  }

  getGame(gameId: string): Acquire | undefined {
    return this.gamesMap.get(gameId);
  }
}

export { GameManager };
