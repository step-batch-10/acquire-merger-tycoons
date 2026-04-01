import _ from "lodash";
import { HotelName, Player } from "./player.ts";
import { Board, TileStatus } from "./board.ts";
import {
  BoardDetails,
  BonusDistribution,
  Game,
  GameStats,
  MergerData,
  PlaceTile,
  PlayerDetails,
  Tile,
} from "./game.ts";
import { Hotel } from "./hotel.ts";

export type HotelDetails = {
  name: string;
  size: number;
  baseTile: string;
};

export type TradeStats = {
  acquirer: HotelName;
  target: HotelName;
  count: number;
};

export type BuyStocks = {
  hotel: HotelName;
  count: number;
};

export type MergerType =
  | {
    typeofMerge: MergeType;
    hotels: {
      name: string;
      size: number;
      baseTile: Tile;
    }[];
  }
  | {
    typeofMerge: MergeType;
    acquirer: HotelDetails;
    target: HotelDetails[];
    hotels?: undefined;
  };

export enum MergeType {
  AutoMerge = "AutoMerge",
  SelectiveMerge = "SelectiveMerge",
}

export class Merger implements Game {
  private original;
  private acquirer: HotelName | null;
  private target: HotelName[];
  private hotelsAffected: HotelDetails[];
  private currentPlayerIndex;
  private playersIds;
  private countOfTurns;
  private mode: string | null;
  private turnsIndex: number;
  private mergerTile: null | string;

  constructor(game: Game) {
    this.original = game;
    this.currentPlayerIndex = this.getCurrentPlayerIndex();
    this.countOfTurns = 0;
    this.playersIds = this.getPlayerIds();
    this.acquirer = null;
    this.target = [];
    this.hotelsAffected = [];
    this.mode = null;
    this.turnsIndex = 0;
    this.mergerTile = null;
  }

  playTurn(tile: Tile = "default"): Game {
    if (tile === "default" && this.countOfTurns <= this.turnsIndex) {
      this.mergeTarget(this.target[0]);
      return this.original;
    }

    return this;
  }

  private mergeTarget(target: HotelName) {
    const targetInstance = this.getHotel(target);
    const acquirerInstance = this.getHotel(this.acquirer as HotelName);
    targetInstance?.toggleStatus();
    const tiles = targetInstance?.getAllTiles();
    targetInstance?.removeBaseTile();
    const mergerTiles = this.getBoardInstance().getAdjacentTilesOf(
      this.mergerTile as string,
    );
    tiles?.push(this.mergerTile as string, ...mergerTiles);
    tiles?.forEach((tile) => acquirerInstance?.addTile(tile));
  }

  getBoardInstance(): Board {
    return this.original.getBoardInstance();
  }

  placeTile(tile: Tile): PlaceTile {
    this.mergerTile = tile;
    this.getPlayer(this.getCurrentPlayer())?.removeTile(tile);

    const game = this.original;
    const hotelsInMerge = game.getAffectedHotels(tile);

    const mergeDetails = this.findMergeType(hotelsInMerge);
    return { tile, type: TileStatus.Merge, mergeDetails };
  }

  private isEveryHotelOfSameSize(hotels: HotelDetails[]) {
    const sizeOfHotel = hotels[0].size;
    return hotels.every(({ size }) => size === sizeOfHotel);
  }

  private getHotelInfo(hotelsInMerge: Hotel[]) {
    this.hotelsAffected = hotelsInMerge.map((hotel) => ({
      name: hotel.getHotelName(),
      size: hotel.getSize(),
      baseTile: hotel.getBaseTile(),
    }));

    return this.hotelsAffected;
  }

  private getHighestAndSmallestHotel(hotels: HotelDetails[]): HotelDetails[] {
    const highest = _.maxBy(hotels, "size")!;
    const lowest = _.minBy(hotels, "size")!;

    return [highest, lowest];
  }

  private findMergeType(hotelsInMerge: Hotel[]) {
    const hotels = this.getHotelInfo(hotelsInMerge);

    if (this.isEveryHotelOfSameSize(hotels)) {
      return { typeofMerge: MergeType.SelectiveMerge, hotels };
    }
    const [highest, lowest] = this.getHighestAndSmallestHotel(hotels);

    this.acquirer = highest.name as HotelName;
    this.target.push(lowest.name as HotelName);

    return {
      typeofMerge: MergeType.AutoMerge,
      acquirer: highest,
      target: [lowest],
    };
  }

  buyStocks(_hotels: BuyStocks[], _playerId: string) {
    return { error: "Not valid in Merger Mode" };
  }

  foundHotel(_tile: Tile, _hotel: HotelName) {
    return { error: "Not valid in Merger Mode" };
  }

  getPlayerIds() {
    return this.original.getPlayerIds();
  }

  getCurrentPlayerIndex(): number {
    return this.original.getCurrentPlayerIndex();
  }

  getPlayerDetails(playerId: string) {
    return this.original.getPlayerDetails(playerId);
  }

  getBoard(): BoardDetails {
    return this.original.getBoard();
  }

  getGameStats(playerId: string): GameStats {
    const board = this.getBoard();
    const currentPlayerId = this.getCurrentPlayer();
    const playersId = this.getPlayerIds();
    const playerPortfolio = this.getPlayerDetails(playerId);

    return {
      board,
      playersId,
      currentPlayerId,
      mergeData: {
        mode: this.mode,
        acquirer: this.acquirer,
        target: this.target[0] || null,
      },
      playerPortfolio,
    };
  }

  getAffectedHotels(tile: Tile) {
    return this.original.getAffectedHotels(tile);
  }

  private sellStocks(player: Player, stocks: BuyStocks[]) {
    for (const { hotel, count } of stocks) {
      const hotelInstance = this.getHotel(hotel);
      const priceGained = hotelInstance?.calculatePrice(count) as number;

      player.creditCash(priceGained);
      player.deductStock(count, hotel);
      hotelInstance?.incrementStocks(count);
    }

    return player.getPlayerDetails();
  }

  private tradeStocks(player: Player, { acquirer, target, count }: TradeStats) {
    const acquirerHotel = this.getHotel(acquirer);
    acquirerHotel?.decrementStocks(Math.floor(count / 2));
    player.addStock(Math.floor(count / 2), acquirer);
    const targetHotel = this.getHotel(target);
    targetHotel?.incrementStocks(count);
    player.deductStock(count, target);

    return player.getPlayerDetails();
  }

  tradeAndSellStocks(
    tradeStats: TradeStats,
    stocks: BuyStocks[],
    playerId: string,
  ): PlayerDetails | undefined {
    const player = this.getPlayer(playerId) as Player;
    this.sellStocks(player, stocks);
    this.tradeStocks(player, tradeStats);

    return this.getPlayerDetails(playerId);
  }

  private getCurrentPlayer(): string {
    return this.playersIds[this.currentPlayerIndex];
  }

  doesPlayerHasStocks() {
    const player = this.getPlayer(this.getCurrentPlayer());

    return player?.hasStocksOf(this.target[0]);
  }

  private updatePlayerIndex() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) %
      this.playersIds.length;
    this.turnsIndex += 1;
  }

  isMergerRoundOver() {
    return this.countOfTurns >= this.turnsIndex;
  }

  changeTurn() {
    this.updatePlayerIndex();

    if (!this.doesPlayerHasStocks() && this.isMergerRoundOver()) {
      this.changeTurn();
    }

    return { status: this.getCurrentPlayer() };
  }

  getPlayer(playerId: string) {
    return this.original.getPlayer(playerId);
  }

  getHotel(hotelName: HotelName) {
    return this.original.getHotel(hotelName);
  }

  private initiateProcess() {
    this.countOfTurns = this.target.length * 3;
    this.distributeBonus(this.target[0]);
    if (!this.doesPlayerHasStocks() && this.isMergerRoundOver()) {
      this.changeTurn();
    }
  }

  setupMergerEntities(acquirer: HotelName): MergerData {
    this.acquirer = acquirer;
    this.target = this.hotelsAffected
      .filter(({ name }) => name !== acquirer)
      .map(({ name }) => name as HotelName);
    this.mode = "Merge";
    this.initiateProcess();

    return { acquirer: this.acquirer, target: this.target };
  }

  distributeBonus(hotelName: HotelName): undefined | BonusDistribution {
    return this.original.distributeBonus(hotelName);
  }

  isGameEnd() {
    return this.original.isGameEnd();
  }

  distributeEndGameBonus() {
    return this.original.distributeEndGameBonus();
  }

  winner() {
    return this.original.winner();
  }
}
