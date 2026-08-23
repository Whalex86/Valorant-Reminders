// Valorant Hydration Reminder — background.js
//
// Subscribes to Overwolf's Game Events Provider (GEP) for Valorant
// (game id 21640) and fires a desktop notification when the overall
// GAME ends — win, loss, or draw — based on the official
// match_info.match_outcome field. Not memory reading or process
// hooking; this is a sanctioned Riot/Overwolf data feed.
//
// Notification text is read from localStorage, which the user sets
// in the "desktop" settings window (desktop.html / desktop.js).

const REQUIRED_FEATURES = ["match_info", "game_info"];

const DEFAULTS = {
  enabled: true,
  winMessage: "GG, you won! Grab some water.",
  lossMessage: "GG. Take a breather and hydrate.",
  drawMessage: "Draw! Still worth a water break.",
};

// Guards against firing twice for the same match if GEP resends the
// same info update (it sometimes does).
let lastHandledOutcome = null;

function getSetting(key) {
  const val = localStorage.getItem(key);
  return val === null ? DEFAULTS[key] : val;
}

function getBoolSetting(key) {
  const val = localStorage.getItem(key);
  return val === null ? DEFAULTS[key] : val === "true";
}

function notify(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  } else {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") new Notification(title, { body });
    });
  }
}

function notifyMatchOutcome(outcome) {
  if (!getBoolSetting("enabled")) return;

  const normalized = (outcome || "").toLowerCase();
  if (normalized === "victory") {
    notify("Match over — Victory", getSetting("winMessage"));
  } else if (normalized === "defeat") {
    notify("Match over — Defeat", getSetting("lossMessage"));
  } else if (normalized === "draw") {
    notify("Match over — Draw", getSetting("drawMessage"));
  } else {
    // Unexpected value — still remind, generically.
    notify("Match over", getSetting("winMessage"));
  }
}

function setRequiredFeatures() {
  overwolf.games.events.setRequiredFeatures(REQUIRED_FEATURES, (result) => {
    if (!result.success) {
      console.log("setRequiredFeatures failed, retrying in 2s:", result);
      setTimeout(setRequiredFeatures, 2000);
      return;
    }
    console.log("Subscribed to features:", result.supportedFeatures);
  });
}

function handleInfoUpdate(infoUpdate) {
  // infoUpdate looks like:
  // { feature: "match_info", info: { match_info: { match_outcome: "victory" } } }
  const matchInfo = infoUpdate?.info?.match_info;
  if (!matchInfo) return;

  if (matchInfo.match_outcome !== undefined) {
    const outcome = matchInfo.match_outcome;
    if (outcome && outcome !== lastHandledOutcome) {
      notifyMatchOutcome(outcome);
      lastHandledOutcome = outcome;
    }
  }
}

function handleGameInfoUpdate(event) {
  // Used only to reset state once we're back in menus, so the next
  // match's match_outcome is treated as new.
  const scene = event?.info?.game_info?.scene;
  if (scene && scene !== "match") {
    lastHandledOutcome = null;
  }
}

function registerListeners() {
  overwolf.games.events.onInfoUpdates2.addListener((infoUpdate) => {
    handleInfoUpdate(infoUpdate);
    handleGameInfoUpdate(infoUpdate);
  });

  overwolf.games.events.onNewEvents.addListener((events) => {
    console.log("Game events:", events);
  });

  overwolf.games.onGameInfoUpdated.addListener((event) => {
    if (event?.gameChanged || event?.runningChanged) {
      if (event.gameInfo && event.gameInfo.isRunning) {
        console.log("Valorant launched — subscribing to features");
        setRequiredFeatures();
      } else {
        console.log("Valorant closed");
        lastHandledOutcome = null;
      }
    }
  });
}

// If the game is already running when this background page loads
// (e.g. app was auto-launched by launch_events), subscribe right away.
overwolf.games.getRunningGameInfo((info) => {
  if (info && info.isRunning) {
    setRequiredFeatures();
  }
});

registerListeners();
