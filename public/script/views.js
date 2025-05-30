import { cloneTemplate, getResource } from "./game.js";

export const toggleBlur = () => {
  const ele = document.querySelector(".blur");
  const style = ele.style.display;
  if (style === "flex") {
    ele.style.display = "none";
    return;
  }

  ele.style.display = "flex";
  return;
};
class TileView {
  #label;
  constructor(label) {
    this.#label = label;
  }

  render() {
    const playerTile = cloneTemplate("assigned-tile").querySelector(
      ".player-tile",
    );
    playerTile.textContent = this.#label;
    const tile = document.getElementById(this.#label);
    playerTile.addEventListener("mouseover", () => {
      tile.classList.add("highlight-on-hover");
    });
    playerTile.addEventListener("mouseleave", () => {
      tile.classList.remove("highlight-on-hover");
    });

    return playerTile;
  }
}

class CashView {
  #cash;
  constructor(cash) {
    this.#cash = cash;
  }

  render() {
    const cashInfo = document.querySelector("#money-available");
    cashInfo.textContent = `$${this.#cash}`;
  }
}

export class PortfolioView {
  #tiles;
  #stocks;
  #cash;

  constructor(tiles, stocks, cash) {
    this.#tiles = tiles.map((tile) => new TileView(tile));
    this.#stocks = Object.entries(stocks);
    this.#cash = new CashView(cash);
  }

  #renderStocks([name, count]) {
    const hotelStocks = cloneTemplate("stocks-template").querySelector(
      ".hotel-stocks",
    );

    hotelStocks.classList.add(name.toLowerCase());
    hotelStocks.classList.add("shares-info");

    hotelStocks.style.backgroundColor = hotelLookup(name).backgroundColor;
    const [stockCount, hotelName] = hotelStocks.children;

    hotelName.textContent = name;
    stockCount.textContent = count;

    return hotelStocks;
  }

  renderPortfolio() {
    const tilesContainer = document.querySelector("#portfolio-tiles");
    tilesContainer.replaceChildren(...this.#tiles.map((tile) => tile.render()));

    const stocksContainer = document.querySelector("#stock-info");
    stocksContainer.replaceChildren(...this.#stocks.map(this.#renderStocks));

    this.#cash.render();
  }
}

class HotelView {
  #name;
  #stocksAvailable;
  #stockPrice;
  constructor(name, stocksAvailable, stockPrice) {
    this.#name = name;
    this.#stocksAvailable = stocksAvailable;
    this.#stockPrice = stockPrice;
  }

  renderStocks() {
    const hotelStocks = cloneTemplate(
      "available-stocks-template",
      "available-stocks-template",
      "available-stocks-template",
    ).querySelector(".hotel-stocks");
    hotelStocks.style.backgroundColor = hotelLookup(this.#name).backgroundColor;

    const [hotelName, img, stockCount, price] = hotelStocks.children;

    img.src = `/images/hotels/${this.#name.toLowerCase()}.png`;
    hotelName.textContent = this.#name;
    stockCount.textContent = `Left:${this.#stocksAvailable}`;
    price.textContent = `Value:$${this.#stockPrice}`;
    hotelStocks.classList.add("available-stocks");

    return hotelStocks;
  }

  static fromHotel(hotel) {
    return new HotelView(hotel.name, hotel.stocksAvailable, hotel.stockPrice);
  }
}

export class HotelsView {
  #activeHotels;
  #inactiveHotels;
  constructor(activeHotels, inActiveHotels) {
    this.#activeHotels = activeHotels;
    this.#inactiveHotels = inActiveHotels;
  }

  renderStocks() {
    const stocksSection = document.querySelector("#stocks-section");
    const hotelElements = this.#activeHotels
      .concat(this.#inactiveHotels)
      .map((hotel) => HotelView.fromHotel(hotel))
      .map((hotelView) => hotelView.renderStocks());

    stocksSection.replaceChildren(...hotelElements);
  }
}

export class PlayersView {
  #players;
  #currentPlayer;
  constructor(players, currentPlayer) {
    this.#players = players;
    this.#currentPlayer = currentPlayer;
  }

  #createPlayerAvatar({ name, isTheSamePlayer }) {
    const playerTemplate = cloneTemplate("players-template");
    const player = playerTemplate.querySelector("#player");
    const avatar = player.querySelector(".player-avatar");

    player.querySelector(".player-name").textContent = isTheSamePlayer
      ? `${name} (YOU)`
      : name;
    this.#currentPlayer === name && avatar.classList.add("active-player");
    return player;
  }

  renderPlayers() {
    const playerSection = document.getElementById("players");
    const playersEle = this.#players.map(this.#createPlayerAvatar.bind(this));

    playerSection.replaceChildren(...playersEle);
  }
}

export class BoardView {
  #independentTiles;
  #hotelTiles;
  #mergerTile;
  #hotels;

  constructor({ independentTiles, activeHotels = [], mergerTile }) {
    this.#independentTiles = independentTiles;
    this.#hotelTiles = activeHotels;
    this.#mergerTile = mergerTile;
    this.#hotels = [
      "tower",
      "sackson",
      "festival",
      "american",
      "worldwide",
      "imperial",
      "continental",
    ];
  }

  #renderIndependentTile() {
    this.#independentTiles.forEach((tile) => {
      const tileNode = document.getElementById(tile);
      tileNode.classList.add("place-tile");
    });
  }

  #renderMergerTile() {
    const mergerTile = document.getElementById(this.#mergerTile);
    mergerTile.style.backgroundColor = "navy";
    mergerTile.style.color = "white";
    mergerTile.textContent = "Merger";
  }

  #getCleanTileNode(tile) {
    const tileNode = document.getElementById(tile);
    this.#hotels.forEach((h) => {
      tileNode.classList.remove(h);
      tileNode.classList.remove("base-tile");
    });

    return tileNode;
  }

  #renderHotel = ({ name, tiles, baseTile }) => {
    tiles.forEach((tile) => {
      const tileNode = this.#getCleanTileNode(tile);

      tileNode.style.border = `none`;
      tileNode.textContent = tile;
      tileNode.style.backgroundColor = hotelLookup(name).backgroundColor;
      tileNode.style.color = hotelLookup(name).color;
    });

    const hotelTile = document.getElementById(baseTile);
    hotelTile.classList.add(name.toLowerCase());
    hotelTile.classList.add("base-tile");
    hotelTile.textContent = "";
  };

  #renderHotelTiles() {
    this.#hotelTiles.forEach(this.#renderHotel);
  }

  render() {
    this.#renderIndependentTile();
    if (this.#mergerTile) this.#renderMergerTile();
    if (this.#hotelTiles.length) this.#renderHotelTiles();
  }
}

export class BuyStocksView {
  #activeHotels;
  #cash;
  #poller;
  #cashAvailable;
  #hotelsContainer;

  constructor(activeHotels, cash, poller) {
    this.#activeHotels = activeHotels;
    this.#cash = cash;
    this.#poller = poller;
    this.#cashAvailable = document.getElementById("cash-available");
    this.#hotelsContainer = document.getElementById("active-hotels");
  }

  #updateMax() {
    const allInputs = this.#hotelsContainer.querySelectorAll("input");

    const totalSelected = Array.from(allInputs).reduce((sum, input) => {
      return sum + parseInt(input.value || 0);
    }, 0);

    allInputs.forEach((input) => {
      const currentValue = parseInt(input.value || 0);
      const originalMax = parseInt(input.dataset.originalMax, 10);
      const otherTotal = totalSelected - currentValue;
      input.max = Math.max(0, originalMax - otherTotal);
    });
  }

  #setHotelInfo(template, name, price, maxStocks) {
    template.querySelector(".hotel-name").textContent = name;
    template.querySelector(".stock-value").textContent = `$${price}`;

    const input = template.querySelector("input");
    input.id = name;
    input.dataset.originalMax = maxStocks;
    input.max = maxStocks;
    input.value = 0;
  }

  #attachInputHandlers(input) {
    input.addEventListener("input", () => {
      this.#updateMax();
    });
  }

  #debitCash(amount) {
    const current = Number(this.#cashAvailable.textContent);
    this.#cashAvailable.textContent = current - amount;
  }

  #creditCash(amount) {
    const current = Number(this.#cashAvailable.textContent);
    this.#cashAvailable.textContent = current + amount;
  }

  #incrementValue(input, stockPrice) {
    const currentCash = Number(this.#cashAvailable.textContent);
    if (currentCash < stockPrice) {
      alert("Insufficient balance");
      return;
    }
    const preValue = input.value;
    input.stepUp();
    const curValue = input.value;
    if (preValue < curValue) this.#debitCash(stockPrice);
    input.dispatchEvent(new Event("input"));
  }

  #decrementValue(input, stockPrice) {
    const preValue = input.value;
    input.stepDown();
    const curValue = input.value;
    if (preValue > curValue) this.#creditCash(stockPrice);
    input.dispatchEvent(new Event("input"));
  }

  #attachStepButtons(template, input, stockPrice) {
    const [decrement, increment] = template.querySelectorAll("button");
    increment.addEventListener(
      "click",
      () => this.#incrementValue(input, stockPrice),
    );
    decrement.addEventListener(
      "click",
      () => this.#decrementValue(input, stockPrice),
    );
  }

  #renderHotel({ name, stocksAvailable, stockPrice }) {
    const template = cloneTemplate("hotel-template");
    const maxStocks = stocksAvailable >= 3 ? 3 : stocksAvailable;
    const hotel = template.querySelector(".hotel");
    const input = template.querySelector("input");

    hotel.style.backgroundColor = hotelLookup(name).backgroundColor;
    this.#setHotelInfo(template, name, stockPrice, maxStocks);
    this.#attachInputHandlers(input);
    this.#attachStepButtons(template, input, stockPrice);

    return template;
  }

  #renderAllHotels() {
    const hotels = this.#activeHotels.filter(
      ({ stocksAvailable }) => stocksAvailable,
    );
    if (!hotels.length) return this.#changeTurn();

    const buyStocksEle = document.getElementById("buy-stocks");
    buyStocksEle.classList.add("display");
    toggleBlur();
    const hotelNode = hotels.map((hotel) => {
      return this.#renderHotel(hotel);
    });
    this.#hotelsContainer.replaceChildren(...hotelNode);
  }

  #setCash() {
    const cashAvailable = document.getElementById("cash-available");
    cashAvailable.textContent = this.#cash;
  }

  async #handleBuy() {
    const activeHotels = document.getElementById("active-hotels");
    const children = activeHotels.children;
    const stocksToBuy = [];

    for (const child of children) {
      const hotel = child.querySelector(".hotel-name").textContent;
      const count = +child.querySelector("input").value;
      if (count) stocksToBuy.push({ hotel, count });
    }

    const buyStocksEle = document.getElementById("buy-stocks");
    buyStocksEle.classList.remove("display");
    toggleBlur();

    await fetch("/acquire/buy-stocks", {
      method: "PATCH",
      body: JSON.stringify(stocksToBuy),
      headers: {
        "content-type": "application/json",
      },
    });
    await this.#changeTurn();
    renderGamerBoard();
  }

  async #changeTurn() {
    await fetch("/acquire/end-turn", { method: "PATCH" });
    this.#poller.start();
  }

  render() {
    if (this.#activeHotels.length <= 0) {
      return this.#changeTurn();
    }

    renderMinimap();
    const submit = document.getElementById("buy");
    submit.addEventListener("click", this.#handleBuy.bind(this), {
      once: true,
    });

    this.#setCash();
    this.#renderAllHotels();
  }
}

const renderMinimap = () => {
  const minimap = document.querySelector(".gameBoard");
  minimap.classList.add("minimap");
  const children = minimap.children;

  for (const child of children) {
    child.classList.add("mini-tile");
  }
};

const renderGamerBoard = () => {
  const minimap = document.querySelector(".gameBoard");
  minimap.classList.remove("minimap");
  const children = minimap.children;

  for (const child of children) {
    child.classList.remove("mini-tile");
  }
};

export class PlayerTurnView {
  #tiles;
  #poller;
  #tileListener;

  constructor(tiles, poller) {
    this.#tiles = tiles;
    this.#poller = poller;
    this.#tileListener = this.#handleTileClick.bind(this);
  }

  #toggleHighlightTiles() {
    this.#tiles.forEach((tile) => {
      document.getElementById(tile).classList.toggle("highlight");
    });
  }

  #placeIndependentTile(tileLabel) {
    const tileNode = document.getElementById(tileLabel);
    tileNode.classList.add("place-tile");

    this.#buyStocks();
  }

  async #buyStocks() {
    const { board, playerPortfolio } = await getResource("/acquire/game-stats");

    new BuyStocksView(
      board.activeHotels,
      playerPortfolio.cash,
      this.#poller,
    ).render();
  }

  async #placeDependentTile({ tile, hotel }) {
    const tileNode = document.getElementById(tile);
    tileNode.style.backgroundColor = hotelLookup(hotel.name).backgroundColor;
    await this.#buyStocks();
  }

  async #handleFoundHotel(tileLabel, hotelName) {
    const res = await fetch(`/acquire/place-tile/${tileLabel}/${hotelName}`, {
      method: "PATCH",
    });
    const { stockAllotted } = await res.json();

    if (!stockAllotted) {
      alert("No stocks available for this hotel...");
    }

    renderGamerBoard();
    const container = document.querySelector("#popup");
    container.style.display = "none";
    toggleBlur();
    renderGamerBoard();
    await this.#buyStocks();
  }

  async #renderSelectHotel(inActiveHotels, tileLabel) {
    const container = document.querySelector("#popup");
    const hotelList = document.querySelector("#hotel-container");

    toggleBlur();
    container.style.display = "flex";
    renderMinimap();

    const hotels = inActiveHotels.map((hotel) => {
      const outerDiv = document.createElement("div");
      const hotelName = document.createElement("span");
      hotelName.textContent = hotel.name;
      outerDiv.style.zIndex = 99;

      const div = document.createElement("div");
      div.classList.add(hotel.name.toLowerCase(), "select-hotel");

      outerDiv.appendChild(hotelName);
      outerDiv.appendChild(div);

      outerDiv.addEventListener(
        "click",
        () => this.#handleFoundHotel(tileLabel, hotel.name),
      );
      return outerDiv;
    });
    hotelList.replaceChildren(...hotels);

    if (inActiveHotels.length === 0) {
      await buyStocks(this.#poller);
    }
  }

  async #handleTileClick(event) {
    const tileLabel = event.target.id;
    if (!this.#tiles.includes(tileLabel)) return;

    const res = await fetch(`/acquire/place-tile/${tileLabel}`, {
      method: "PATCH",
    });
    const placeInfo = await res.json();

    this.#toggleHighlightTiles();
    this.#removeTileListeners();

    switch (placeInfo.type) {
      case "Independent":
        this.#placeIndependentTile(tileLabel);
        break;

      case "Dependent":
        await this.#placeDependentTile(placeInfo);
        break;

      case "Build":
        await this.#renderSelectHotel(placeInfo.inActiveHotels, tileLabel);
        break;

      case "Merge":
        new MergerView(placeInfo.mergeDetails, tileLabel, this.#poller).merge();
        break;
    }
  }

  #removeTileListeners() {
    const board = document.querySelector(".gameBoard");
    board.removeEventListener("click", this.#tileListener);
  }

  #activateTileListeners() {
    const board = document.querySelector(".gameBoard");
    board.addEventListener("click", this.#tileListener);
  }

  enableTurn() {
    this.#poller.pause();
    this.#toggleHighlightTiles();
    this.#activateTileListeners();
  }
}

class MergerView {
  #mergerEle;
  #mergeInfo;
  #tile;
  #listener;
  #acquirer;
  #target;
  #hotels;
  #board;
  #poller;

  constructor(mergeInfo, tile, poller) {
    this.#poller = poller;
    this.#tile = tile;
    this.#mergeInfo = mergeInfo;
    this.#mergerEle = document.querySelector(".merge-popup");
    this.#target = "";
    this.#hotels = [];
    this.#listener = this.#handleHotelMerge.bind(this);
    this.#board = document.querySelector(".gameBoard");
  }

  async #handleHotelMerge(event) {
    const id = event.target.id;
    const baseTiles = this.#hotels.map(({ baseTile }) => baseTile);
    if (!baseTiles.includes(id)) return;

    this.#acquirer = this.#hotels.find(({ baseTile }) => baseTile === id);
    this.#target = [this.#hotels.find(({ baseTile }) => baseTile !== id)];
    this.#toggleHighlight();
    this.#attachImgs();
    toggleBlur();
    this.#toggleDisplay();
    setTimeout(() => {
      this.#toggleDisplay();
      toggleBlur();
    }, 2500);
    await this.#handleMerge(this.#acquirer.name);
    this.#board.removeEventListener("click", this.#listener);

    const tileNode = document.getElementById(this.#tile);
    tileNode.textContent = tileNode.id;
    this.#tile = null;

    this.#poller.start();
  }

  #attachImgs() {
    const target = this.#target[0].name;
    const acquirer = this.#acquirer.name;
    const acquirerEle = this.#mergerEle.querySelector("#acquirer");
    acquirerEle.src = `/images/hotels/${acquirer.toLowerCase()}.png`;

    const targetEle = this.#mergerEle.querySelector("#target");
    targetEle.src = `/images/hotels/${target.toLowerCase()}.png`;
  }

  #indicateMergingTile() {
    const mergerTile = document.getElementById(this.#tile);
    mergerTile.style.backgroundColor = "navy";
    mergerTile.style.color = "white";
    mergerTile.textContent = "Merger";
  }

  async #handleMerge(acquirer) {
    const res = await fetch(`/acquire/continue-merge/${acquirer}`, {
      method: "PATCH",
    });
    return await res.json();
  }

  async #autoMerge() {
    toggleBlur();
    this.#toggleDisplay();
    this.#acquirer = this.#mergeInfo.acquirer;
    this.#target = this.#mergeInfo.target;

    this.#attachImgs();
    setTimeout(() => {
      this.#toggleDisplay();
      toggleBlur();
    }, 2500);
    this.#indicateMergingTile();
    await this.#handleMerge(this.#acquirer.name);
  }

  #toggleHighlight() {
    [...this.#hotels].forEach(({ baseTile }) => {
      document.getElementById(baseTile).classList.toggle("highlight");
    });
  }

  #selectiveMerge() {
    this.#hotels = this.#mergeInfo.hotels;
    this.#indicateMergingTile();
    this.#toggleHighlight();
    this.#board.addEventListener("click", this.#listener);
  }

  #toggleDisplay() {
    this.#mergerEle.classList.toggle("display");
  }

  merge() {
    this.#poller.start();
    if (this.#mergeInfo.typeofMerge === "AutoMerge") return this.#autoMerge();
    this.#poller.pause();
    return this.#selectiveMerge();
  }
}

export class StockExchangeView {
  #stockAvailable;
  #keep;
  #sell;
  #trade;
  #button;
  #acquirer;
  #target;
  #popup;
  #poller;
  #incrementListener;
  #decrementListener;
  #incrementTradeListener;
  #decrementTradeListener;

  constructor(stocksAvailable, acquirer, target, poller) {
    this.#poller = poller;
    this.#stockAvailable = stocksAvailable;
    this.#acquirer = acquirer;
    this.#target = target;
    this.#keep = document.querySelector("#keep");
    this.#sell = document.querySelector("#sell");
    this.#trade = document.querySelector("#trade");
    this.#button = document.querySelector("#merger");
    this.#popup = document.querySelector("#merger-pop");
    this.#incrementListener = this.#incrementSellValue.bind(this);
    this.#decrementListener = this.#decrementSellValue.bind(this);
    this.#incrementTradeListener = this.#incrementValue.bind(this);
    this.#decrementTradeListener = this.#decrementValue.bind(this);
  }

  renderKeep() {
    this.#keep.value = this.#stockAvailable;
    this.#keep.max = this.#stockAvailable;
    this.#keep.min = 0;
  }

  #incrementValue() {
    const keepValue = Number(this.#keep.value);
    if (keepValue < 2) return;

    this.#trade.value = Number(this.#trade.value) + 2;
    this.#keep.value = keepValue - 2;
  }

  #decrementValue() {
    const tradeValue = Number(this.#trade.value);
    if (tradeValue <= 0) return;

    this.#trade.stepDown();
    this.#keep.value = Number(this.#keep.value) + 2;
    this.#keep.max = this.#stockAvailable;
  }

  #attachStepTradeButtons(increment, decrement) {
    increment.addEventListener("click", this.#incrementTradeListener);
    decrement.addEventListener("click", this.#decrementTradeListener);
  }

  #decrementSellValue() {
    const tradeValue = Number(this.#sell.value);
    if (tradeValue <= 0) return;

    this.#sell.stepDown();
    this.#keep.value = Number(this.#keep.value) + 1;
    this.#keep.max = this.#stockAvailable;
  }

  #incrementSellValue() {
    const keepValue = Number(this.#keep.value);
    if (keepValue <= 0) return;

    this.#sell.value = Number(this.#sell.value) + 1;
    this.#keep.value = keepValue - 1;
  }

  #attachStepSellButtons(increment, decrement) {
    increment.addEventListener("click", this.#incrementListener);
    decrement.addEventListener("click", this.#decrementListener);
  }

  renderSell() {
    this.#sell.max = this.#stockAvailable;
    this.#sell.min = 0;

    const increment = document.querySelector(".sell-step-up");
    const decrement = document.querySelector(".sell-step-down");

    this.#attachStepSellButtons(increment, decrement);
  }

  renderTrade() {
    this.#trade.max = Math.floor(this.#stockAvailable / 2);
    this.#trade.min = 0;

    const increment = document.querySelector(".trade-step-up");
    const decrement = document.querySelector(".trade-step-down");

    this.#attachStepTradeButtons(increment, decrement);
  }

  #removeStepUpListener() {
    const incrementTrade = document.querySelector(".trade-step-up");
    const decrementTrade = document.querySelector(".trade-step-down");
    incrementTrade.removeEventListener("click", this.#incrementTradeListener);
    decrementTrade.removeEventListener("click", this.#decrementTradeListener);

    const incrementSell = document.querySelector(".sell-step-up");
    const decrementSell = document.querySelector(".sell-step-down");
    incrementSell.removeEventListener("click", this.#incrementListener);
    decrementSell.removeEventListener("click", this.#decrementListener);
  }

  async #completeMerge() {
    const stocks = [{ hotel: this.#target, count: Number(this.#sell.value) }];
    const trade = Number(this.#trade.value);
    const tradeStats = {
      acquirer: this.#acquirer,
      target: this.#target,
      count: trade,
    };

    await fetch("/acquire/merger/sell-trade-stocks", {
      body: JSON.stringify({ tradeStats, stocks }),
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
    });

    await fetch("/acquire/end-turn", { method: "PATCH" });
    this.#poller.start();

    this.#popup.classList.add("hidden");
    this.#popup.classList.remove("merger-pop-container");
    this.#resetValue();
    this.#removeStepUpListener();
    renderGamerBoard();
  }

  #resetValue() {
    this.#keep.value = 0;
    this.#sell.value = 0;
    this.#trade.value = 0;
  }

  render() {
    renderMinimap();
    this.#popup.classList.add("merger-pop-container");
    this.#popup.classList.remove("hidden");
    this.renderKeep();
    this.renderSell();
    this.renderTrade();
    this.#button.addEventListener("click", this.#completeMerge.bind(this), {
      once: true,
    });
  }
}

const hotelLookup = (name) => {
  const colors = {
    Tower: { backgroundColor: "#ffb404", color: "white" },
    Sackson: { backgroundColor: "#ff5454", color: "white" },
    Festival: { backgroundColor: "#2EA47A", color: "white" },
    Continental: { backgroundColor: "#28c4e4", color: "white" },
    Imperial: { backgroundColor: "#ff7c14", color: "white" },
    Worldwide: { backgroundColor: "#8054f4", color: "white" },
    American: { backgroundColor: "#288ce4", color: "white" },
  };

  return colors[name];
};
