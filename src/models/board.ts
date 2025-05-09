import { BoardDetails, PlaceTile } from "./game.ts";
import { Hotel } from "./hotel.ts";
import _ from "lodash";

type Tile = string;

export enum TileStatus {
  Build = "Build",
  Dependent = "Dependent",
  Independent = "Independent",
  Merge = "Merge",
  InValid = "Invalid",
}

export type HotelDetails = {
  name: string;
  tiles: string[];
  stocksAvailable: number;
  stockPrice: number;
  baseTile: string;
};

export type InactiveHotels = {
  name: string;
  tiles: string[];
  stocksAvailable: number;
  stockPrice: number;
  baseTile: string;
}[];

export type buildingHotel = {
  hotel: HotelDetails | undefined;
  stockAllotted: boolean;
};

type HotelName =
  | "Sackson"
  | "Tower"
  | "Festival"
  | "Worldwide"
  | "American"
  | "Continental"
  | "Imperial";

export class Board {
  hotels: Hotel[];
  independentTiles: Set<Tile>;
  mergerTile: Tile | null;

  constructor(hotels: Hotel[]) {
    this.hotels = hotels;
    this.independentTiles = new Set();
    this.mergerTile = null;
  }

  private getInactiveHotels() {
    return this.hotels
      .filter((hotel) => !hotel.isActive())
      .map((hotel) => hotel.getHotel());
  }

  private getActiveHotels() {
    return this.hotels
      .filter((hotel) => hotel.isActive())
      .map((hotel) => hotel.getHotel());
  }

  placeIndependentTile(tile: Tile): string {
    this.independentTiles.add(tile);
    return tile;
  }

  getPlaceTileType(tile: Tile): {
    tile: string;
    type: TileStatus;
  } {
    const adjacentTiles = this.getAdjacentTiles(tile, new Set());
    const inActiveHotels = this.getInactiveHotels();
    if (this.isMerger(tile) && this.validateMergeTile(tile)) {
      this.mergerTile = tile;
      return { tile, type: TileStatus.Merge };
    }

    if (this.isDependent(tile)) {
      return { tile, type: TileStatus.Dependent };
    }

    if (adjacentTiles.size === 0 || inActiveHotels.length === 0) {
      return { tile, type: TileStatus.Independent };
    }

    return {
      type: TileStatus.Build,
      tile,
    };
  }

  validateMergeTile(tile: Tile): boolean {
    const hotelsInMerge = this.dependentHotels(tile);
    const hotelsInMergeSize = hotelsInMerge.map((hotel) => hotel.getSize());
    const countOfSafeHotel = hotelsInMergeSize.filter((size) => size >= 11);
    if (countOfSafeHotel.length >= 2) return false;

    return true;
  }

  placeATile(tile: Tile): PlaceTile {
    if (this.isMerger(tile)) {
      this.mergerTile = tile;

      return { tile, type: TileStatus.Merge };
    }

    const adjacentTiles = this.getAdjacentTiles(tile);
    if (this.isDependent(tile)) {
      const [hotel] = this.dependentHotels(tile);
      this.moveToHotel([...adjacentTiles, tile], hotel);
      return { tile, type: TileStatus.Dependent, hotel: hotel.getHotel() };
    }

    const inActiveHotels = this.getInactiveHotels();
    if (adjacentTiles.size === 0 || inActiveHotels.length === 0) {
      this.placeIndependentTile(tile);
      return { tile, type: TileStatus.Independent };
    }

    return {
      inActiveHotels: this.getInactiveHotels(),
      type: TileStatus.Build,
      tile,
    };
  }

  getHotel(hotelName: string): Hotel | undefined {
    return this.hotels.find((hotel) => hotel.isAMatch(hotelName));
  }

  private moveToHotel(tiles: Tile[], hotel: Hotel | undefined): void {
    tiles.forEach((tile) => {
      this.independentTiles.delete(tile);
      hotel?.addTile(tile);
    });
  }

  buildHotel(tile: Tile, hotelName: string): buildingHotel {
    const hotel = this.hotels.find((hotel) => hotel.isAMatch(hotelName));
    const tiles = [...this.getAdjacentTiles(tile, new Set())];

    const stockAllotted = hotel?.areStocksEnough(1) || false;
    hotel?.toggleStatus();
    hotel?.decrementStocks(1);
    hotel?.storeBaseTile(tile);
    this.moveToHotel(tiles, hotel);

    return { hotel: hotel?.getHotel(), stockAllotted };
  }

  getBoard(): BoardDetails {
    const activeHotels = this.getActiveHotels();
    const inActiveHotels = this.getInactiveHotels();

    return {
      independentTiles: [...this.independentTiles],
      activeHotels,
      inActiveHotels,
      mergerTile: this.mergerTile,
    };
  }

  getAdjacentTiles(
    tile: Tile,
    adjacentTiles: Set<Tile> = new Set(),
  ): Set<Tile> {
    const tilesAdjacent = this.getAdjacentOf(tile);

    const tilesFound = tilesAdjacent.filter(
      (adjTile: Tile) =>
        this.independentTiles.has(adjTile) && !adjacentTiles.has(adjTile),
    );

    for (const adjTile of tilesFound) {
      adjacentTiles.add(adjTile);
      this.getAdjacentTiles(adjTile, adjacentTiles);
    }

    return adjacentTiles;
  }

  parseTile(tile: Tile): number[] {
    const match = tile.match(/^(\d+)([A-I])$/) as RegExpMatchArray;
    const [_, value, letter] = match;
    return [Number(value), letter.charCodeAt(0)];
  }

  getAdjacentOf(tile: Tile): Tile[] {
    const [col, row] = this.parseTile(tile);
    const candidates = [
      [col - 1, row],
      [col + 1, row],
      [col, row - 1],
      [col, row + 1],
    ];

    return candidates
      .filter(
        ([num, letter]) =>
          num >= 1 && num <= 12 && letter >= 65 && letter <= 73,
      )
      .map(([num, letter]) => `${num}${String.fromCharCode(letter)}`);
  }

  private isPlaced(tile: Tile): boolean {
    return (
      this.independentTiles.has(tile) ||
      this.hotels.some((h) => h.isTileBelongs(tile))
    );
  }

  getAdjacentTilesOf(tile: Tile): Tile[] {
    const adjacent = this.getAdjacentOf(tile);

    return adjacent.filter((t: Tile) => this.isPlaced(t));
  }

  isDependent(tile: Tile): boolean {
    return this.dependentHotels(tile).length === 1;
  }

  isMerger(tile: Tile): boolean {
    return this.dependentHotels(tile).length > 1;
  }

  dependentHotels(tile: Tile): Hotel[] {
    const adjacentTiles = this.getAdjacentTilesOf(tile);
    const hotels: Set<Hotel> = new Set();

    for (const tile of adjacentTiles) {
      const hotel = this.hotels.find((hotel) => hotel.isTileBelongs(tile));
      if (hotel) hotels.add(hotel);
    }

    return [...hotels];
  }

  isGameEnd(): boolean {
    const isAnyHotel41 = this.hotels.some((hotel) => hotel.getSize() >= 41);
    const areActiveHotelsSafe = this.hotels.every(
      (hotel) => hotel.isActive() && hotel.getSize() >= 11,
    );

    return isAnyHotel41 || areActiveHotelsSafe;
  }

  getHotels(): HotelName[] {
    return [
      "Sackson",
      "Tower",
      "Festival",
      "Worldwide",
      "American",
      "Continental",
      "Imperial",
    ];
  }
}
