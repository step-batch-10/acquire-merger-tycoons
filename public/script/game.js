import Collapse from "./collapse.js";

const getResource = async (path) => {
  const res = await fetch(path);
  return await res.json();
};

const getAvatar = () => {
  const avatarStore = [
    "/avatar1.jpeg",
    "/avatar2.jpeg",
    "/avatar3.jpeg",
    "/avatar4.jpeg",
    "/avatar5.jpeg",
    "/avatar6.jpeg",
    "/avatar7.jpeg",
    "/avatar8.jpeg",
    "/avatar9.jpeg",
  ];
  const randomIndex = Math.floor(Math.random() * avatarStore.length);

  return "/images/avatars" + avatarStore[randomIndex];
};

const cloneTemplates = (id) => {
  const template = document.getElementById(id);
  return template.content.cloneNode(true);
};

const applyPlayerTemplate = (player) => {
  const playerTemplate = cloneTemplates("players-template");
  playerTemplate
    .getElementById("player-avatar")
    .setAttribute("src", getAvatar());
  playerTemplate.getElementById("player-name").textContent = player;

  return playerTemplate;
};

const renderPlayers = async () => {
  const players = await getResource("../acquire/players");
  const playerSection = document.getElementById("players");

  players.forEach((p) => {
    playerSection.appendChild(applyPlayerTemplate(p));
  });
};

const renderTile = (gameBoard) => {
  return (tileInfo) => {
    const board = cloneTemplates("board");
    const tile = board.querySelector(".tile");

    tile.innerText = tileInfo.label;
    gameBoard.appendChild(tile);
  };
};

const renderGameBoard = async () => {
  const board = await getResource("/acquire/gameboard");
  const gameBoard = document.querySelector("#gameBoard");

  board.forEach(renderTile(gameBoard));
};

const updateTiles = (tiles, values) => {
  tiles.forEach((tile, i) => (tile.textContent = values[i] || ""));
};

const setup = () => {
  // const player = await getResource("acquire/player-details");
  const parent = document.getElementById("tiles");
  const tiles = [...parent.children];
  // const tileData = [...player.tiles];
  const tileData = ["1a", "1a", "1a", "1a", "1a", "1a"];

  updateTiles(tiles, tileData);

  setTimeout(() => {
    const popup = document.getElementById("tiles-popup");
    popup.style.display = "none";
  }, 2500);
};

function renderStocks(stocks) {
  const hotelNamesRow = document.getElementById("hotel-names-row");
  const sharesRow = document.getElementById("shares-row");

  hotelNamesRow.innerHTML = "";
  sharesRow.innerHTML = "";

  Object.entries(stocks).forEach(([hotel, shares]) => {
    const nameCell = document.createElement("th");
    nameCell.textContent = hotel;

    const shareCell = document.createElement("td");
    shareCell.textContent = shares;

    hotelNamesRow.appendChild(nameCell);
    sharesRow.appendChild(shareCell);
  });
}

const updatePortfolio = () => {
  try {
    // const data = await getResource("/acquire/player-details");
    const data = {
      tiles: ["1a", "1a", "1a", "1a", "1a", "1a"],
      stocks: {
        Sackson: 3,
        Tower: 5,
        Continental: 2,
        Imperial: 0,
        Festival: 4,
        Worldwide: 6,
        American: 1,
      },
    };
    const tilesData = ["1a", "1a", "1a", "1a", "1a", "1a"];

    document.getElementById("cash-info").textContent = "$6000";
    renderStocks(data.stocks);

    const tiles = document.querySelectorAll("#portfolio-tiles .player-tile");

    updateTiles(tiles, tilesData);
  } catch (error) {
    console.error("Failed to update portfolio:", error);
  }
};

const startPortfolioPolling = (interval = 500) => {
  updatePortfolio();
  setInterval(updatePortfolio, interval);
};

const main = async () => {
  new Collapse("portfolio-header", "portfolio-body");
  await renderGameBoard();
  setup();
  await renderPlayers();
  startPortfolioPolling();
};

globalThis.onload = main;
