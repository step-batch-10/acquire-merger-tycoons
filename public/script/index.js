const postRequest = async (path) => {
  const res = await fetch(path, { method: "POST" });
  return await res.json();
};

const quickPlayHandler = async () => {
  await postRequest("/acquire/home/quick-play");
  globalThis.location.href = "/lobby";
};

const handleQuickPlay = () => {
  const quickPlay = document.getElementById("quick-play");
  quickPlay.addEventListener("click", quickPlayHandler);
};

const main = () => {
  handleQuickPlay();
};

globalThis.onload = main;
