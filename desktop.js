// desktop.js — settings window
// Reads/writes the same localStorage the background page uses, so
// whatever the user types here is what background.js will show them.

const DEFAULTS = {
  enabled: true,
  winMessage: "GG, you won! Grab some water.",
  lossMessage: "GG. Take a breather and hydrate.",
  drawMessage: "Draw! Still worth a water break.",
};

function loadSettings() {
  const enabled = localStorage.getItem("enabled");
  document.getElementById("enabled").checked =
    enabled === null ? DEFAULTS.enabled : enabled === "true";

  document.getElementById("winMessage").value =
    localStorage.getItem("winMessage") || DEFAULTS.winMessage;
  document.getElementById("lossMessage").value =
    localStorage.getItem("lossMessage") || DEFAULTS.lossMessage;
  document.getElementById("drawMessage").value =
    localStorage.getItem("drawMessage") || DEFAULTS.drawMessage;
}

function saveSettings() {
  localStorage.setItem("enabled", document.getElementById("enabled").checked);

  const win = document.getElementById("winMessage").value.trim();
  const loss = document.getElementById("lossMessage").value.trim();
  const draw = document.getElementById("drawMessage").value.trim();

  localStorage.setItem("winMessage", win || DEFAULTS.winMessage);
  localStorage.setItem("lossMessage", loss || DEFAULTS.lossMessage);
  localStorage.setItem("drawMessage", draw || DEFAULTS.drawMessage);

  const status = document.getElementById("status");
  status.textContent = "Saved ✓";
  setTimeout(() => (status.textContent = ""), 1500);
}

document.addEventListener("DOMContentLoaded", loadSettings);
document.getElementById("saveBtn")?.addEventListener("click", saveSettings);
