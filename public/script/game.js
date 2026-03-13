import Collapse from "./collapse.js";
import {
  BoardView,
  BuyStocksView,
  HotelsView,
  PlayersView,
  PlayerTurnView,
  PortfolioView,
  StockExchangeView,
  toggleBlur,
} from "./views.js";
import Poller from "./polling.js";

export const getResource = async (path) => {
  try {
    const res = await fetch(path);
    return await res.json();
  } catch (error) {
    console.error(`In getResource: ${path}, ${error}`);
  }
};

const renderPlayerTurn = (isMyTurn, tiles, poller) => {
  if (!isMyTurn) return;

  new PlayerTurnView(tiles, poller).enableTurn();
};

const renderPortfolio = ({ tiles, stocks, cash }) => {
  new PortfolioView(tiles, stocks, cash).renderPortfolio();
};

const renderPlaceTilesBoard = (board) => {
  new BoardView(board).render();
};

const renderStocksAndPlayers = (
  players,
  currentPlayer,
  inActiveHotels,
  activeHotels,
) => {
  new HotelsView(activeHotels, inActiveHotels).renderStocks();
  new PlayersView(players, currentPlayer).renderPlayers();
};

const renderPlayerTiles = (tilesContainer, tiles) => {
  const tilesEle = tiles.map((tile) => {
    const playerTile = cloneTemplate("assigned-tile").querySelector(
      ".player-tile",
    );
    playerTile.textContent = tile;
    return playerTile;
  });

  tilesContainer.replaceChildren(...tilesEle);
};

const showStartingTilesPopup = async () => {
  const hasPopupShown = localStorage.getItem("hasPopupShown");
  if (hasPopupShown) return;

  toggleBlur();
  const stats = await getResource("/acquire/game-stats");
  const { playerPortfolio } = stats;
  const { tiles } = playerPortfolio;
  const container = document.getElementById("tiles-container");
  renderPlayerTiles(container, tiles);

  setTimeout(() => {
    const popup = document.getElementById("tiles-popup");
    toggleBlur();
    popup.style.display = "none";
    localStorage.setItem("hasPopupShown", "true");
  }, 2000);
};

export const cloneTemplate = (id) => {
  const template = document.getElementById(id);
  return template.content.cloneNode(true);
};

const createTile = (tileLabel) => {
  const board = cloneTemplate("board");
  const tile = board.querySelector(".tile");
  tile.textContent = tileLabel;
  tile.id = tileLabel;
  return tile;
};

const renderGameBoard = () => {
  const tiles = [];
  const gameBoard = document.querySelector(".gameBoard");
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

  rows.forEach((row) => {
    for (let col = 1; col <= 12; col++) {
      const tileLabel = `${col}${row}`;
      tiles.push(createTile(tileLabel));
    }
  });

  gameBoard.replaceChildren(...tiles);
};

const renderWinner = (winnerPlayer) => {
  const ele = document.querySelector(".blur");
  ele.style.display = "flex";
  const winnerPopup = document.querySelector(".winner-popup");
  winnerPopup.classList.add("display");
  const winner = document.querySelector(".winner");
  winner.textContent = `${winnerPlayer} is the Merger Tycoon!`;
  setTimeout(() => winnerPopup.classList.remove("display"), 30000);
};

const renderGameEndBtn = async () => {
  const { winner } = await (await fetch("/acquire/end-game")).json();
  renderWinner(winner);
};

const keepSellTrade = (portfolio, { acquirer, target }, poller) => {
  poller.pause();
  const stocks = portfolio.stocks[target];

  new StockExchangeView(stocks, acquirer, target, poller).render();
};

const renderFlashMsg = (msg) => {
  const msgBox = document.getElementById("flash-msg-box");
  msgBox.style.visibility = "visible";
  const textBox = msgBox.querySelector("p");
  textBox.textContent = msg;
  setTimeout(() => {
    msgBox.style.visibility = "hidden";
    textBox.textContent = null;
    renderGameEndBtn();
  }, 3000);
};

const buyStocksAfterMerger = (board, playerPortfolio, poller) => {
  poller.pause();
  new BuyStocksView(board.activeHotels, playerPortfolio.cash, poller).render();
};

const startGamePolling = async (poller) => {
  const stats = await getResource("/acquire/game-stats");
  const {
    players,
    board,
    isMyTurn,
    currentPlayer,
    gameState,
    playerPortfolio,
    isGameEnd,
    mergeData,
  } = stats;

  const { tiles } = playerPortfolio;
  const { inActiveHotels, activeHotels } = board;

  if (isGameEnd) {
    poller.pause();
    const msg = "You can end the game";
    renderFlashMsg(msg);
    await renderGameEndBtn();
    setTimeout(async () => {
      await fetch("/acquire/back-to-home");
      localStorage.removeItem("hasPopupShown");
      globalThis.location = "/";
    }, 30000);
  }

  renderStocksAndPlayers(players, currentPlayer, inActiveHotels, activeHotels);
  renderPortfolio(playerPortfolio);
  renderPlaceTilesBoard(board);

  if (mergeData?.mode === "Merge" && isMyTurn) {
    keepSellTrade(playerPortfolio, mergeData, poller);
  } else if (gameState === "postMerge" && isMyTurn) {
    buyStocksAfterMerger(board, playerPortfolio, poller);
  } else {
    renderPlayerTurn(isMyTurn, tiles, poller);
  }
};

const handleLogout = async () => {
  await fetch("./logout", { method: "GET" });
  localStorage.removeItem("hasPopupShown");
  globalThis.location.href = "./login";
};

const logout = () => {
  const logoutButton = document.getElementById("logout-button");
  logoutButton.addEventListener("click", handleLogout);
};

const main = () => {
  const portfolio = new Collapse("tray-header", "tray-body");
  const sideBar = new Collapse("portfolio-header", "portfolio-body");
  portfolio.init();
  sideBar.init();
  showStartingTilesPopup();
  renderGameBoard();
  logout();

  const polling = new Poller(1000, startGamePolling);
  polling.start();
};

globalThis.onload = main;
