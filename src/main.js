/** Game loop, input, glass HUD, save/cloud, mobile, divine whisper. */

import { Renderer } from "./renderer.js";
import { Simulation } from "./simulation.js";

const SAVE_KEY = "emberkin_save_v2";
const CLOUD_KEY = "emberkin_jsonbin_key";
const CLOUD_ROOM = "emberkin_jsonbin_room";

const canvas = document.getElementById("game");
const renderer = new Renderer(canvas);

const HINTS = {
  inspect: "Tap a villager to inspect. Hold dilemmas ❓ to guide them.",
  possess: "Click a villager to possess. WASD/arrows move · Space acts · Esc frees them.",
  bless: "Bless a villager — heal, feed, clear sickness.",
  inspire: "Strike a villager with an idea.",
  whisper: "Whisper a divine command to a villager.",
  food: "Drop manna on the land.",
  lightning: "Call down lightning.",
  hurricane: "Set a hurricane's eye.",
  wildfire: "Kindle wildfire.",
  hut: "Mark a hut (needs Mud Huts tech + 10 wood)."
};

const GROUND = new Set(["food", "lightning", "hurricane", "wildfire", "hut"]);
const PERSON = new Set(["bless", "inspire", "whisper", "possess"]);
const KEYS = {
  Digit1: "inspect",
  Digit2: "bless",
  Digit3: "inspire",
  Digit4: "food",
  Digit5: "lightning",
  Digit6: "hurricane",
  Digit7: "wildfire",
  Digit8: "hut",
  Digit9: "whisper",
  Digit0: "possess",
  KeyP: "possess"
};

const MOVE_KEYS = {
  KeyW: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0]
};

const WHISPERS = [
  { id: "innovation", label: "Inspire Innovation" },
  { id: "pardon", label: "Pardon Rival" },
  { id: "love", label: "Seek Love" },
  { id: "wilderness", label: "Explore Wilderness" },
  { id: "rain", label: "Pray for Rain" }
];

const $ = (id) => document.getElementById(id);
const portrait = $("portrait");
const pctx = portrait.getContext("2d");

let sim = null;
let paused = false;
let speed = 1;
let animTime = 0;
let last = performance.now();
let relStamp = -1;
let logSig = "";
let studySig = "";
let muted = false;
let audioCtx = null;
let saveAcc = 0;
let pinchDist = 0;
let noticeSig = "";
const heldMove = new Set();
let brushPainting = false;

function boot(fromSave = null) {
  sim = fromSave || new Simulation();
  renderer.terrainRev = -1;
  renderer.miniRev = -1;
  renderer.focus(sim.homeX, sim.homeY);
  logSig = "";
  studySig = "";
  relStamp = 0;
  heldMove.clear();
  $("overlay").classList.add("hidden");
  $("inspector").classList.add("hidden");
  $("choiceOverlay").classList.add("hidden");
  $("saveOverlay").classList.add("hidden");
  clearToolModes();
  setPower("inspect");
}

function clearToolModes() {
  if (!sim) return;
  sim.placementBuild = null;
  sim.brushMode = null;
  document.querySelectorAll("[data-build],[data-brush]").forEach((b) => b.classList.remove("on"));
}

function setPower(id) {
  if (id !== "possess") sim.clearPossession?.();
  clearToolModes();
  sim.activePower = id;
  document.querySelectorAll("#powers button[data-power]").forEach((btn) => {
    btn.classList.toggle("on", btn.dataset.power === id);
  });
  $("powerHint").textContent = HINTS[id] || "";
  document.body.classList.toggle("mode-ground", GROUND.has(id));
  document.body.classList.toggle("mode-person", PERSON.has(id));
  syncPossessChrome();
}

function syncPossessChrome() {
  const on = !!sim?.possessedId;
  document.body.classList.toggle("possessing", on);
  const pad = $("mobilePad");
  if (pad) {
    pad.classList.toggle("force", on || window.innerWidth < 768);
    pad.classList.toggle("hidden", !(on || (window.innerWidth < 768 && document.body.classList.contains("is-mobile"))));
    pad.setAttribute("aria-hidden", on ? "false" : "true");
  }
}

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
  const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
  return {
    x: ((cx - rect.left) / rect.width) * canvas.width,
    y: ((cy - rect.top) / rect.height) * canvas.height
  };
}

function ensureAudio() {
  if (muted) return null;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tone(freq, dur, type, gain, delay = 0) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, gain) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  src.buffer = buf;
  g.gain.value = gain;
  src.connect(g);
  g.connect(ctx.destination);
  src.start();
}

function playSfx() {
  if (!sim.sfx.length) return;
  const queue = sim.sfx.splice(0, sim.sfx.length);
  for (const name of queue) {
    if (name === "discover") {
      tone(523, 0.12, "triangle", 0.05);
      tone(659, 0.14, "triangle", 0.05, 0.1);
    } else if (name === "bless") {
      tone(660, 0.18, "sine", 0.05);
      tone(880, 0.24, "sine", 0.04, 0.08);
    } else if (name === "lightning") {
      noise(0.45, 0.18);
    } else if (name === "storm") noise(0.7, 0.1);
    else if (name === "fire") noise(0.25, 0.08);
    else if (name === "birth" || name === "baby") tone(698, 0.12, "sine", 0.04);
    else if (name === "death") tone(196, 0.35, "sine", 0.05);
    else if (name === "build" || name === "click") tone(330, 0.08, "square", 0.025);
    else if (name === "era") tone(392, 0.25, "triangle", 0.04);
  }
}

function showToast(text, life = 3.2) {
  sim.toast = { text, life };
}

function openChoice(title, text, buttons) {
  $("choiceEyebrow").textContent = "Crossroads";
  $("choiceTitle").textContent = title;
  $("choiceText").textContent = text;
  const box = $("choiceButtons");
  box.innerHTML = "";
  for (const b of buttons) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = b.label;
    btn.addEventListener("click", () => {
      $("choiceOverlay").classList.add("hidden");
      b.fn();
    });
    box.appendChild(btn);
  }
  $("choiceOverlay").classList.remove("hidden");
}

function onMapClick(e) {
  ensureAudio();
  const pt = canvasPoint(e);
  if (renderer.minimapHit(pt.x, pt.y)) {
    const m = renderer.minimap;
    renderer.focus(((pt.x - m.x) / m.w) * sim.w * sim.tile, ((pt.y - m.y) / m.h) * sim.h * sim.tile);
    return;
  }
  const world = renderer.screenToWorld(e.clientX, e.clientY);
  const villager = sim.pickVillager(world.x, world.y);

  if (villager?.dilemma) {
    openChoice(villager.name, villager.dilemma.text, [
      { label: "Guide Good", fn: () => villager.resolveDilemma(sim, "good") },
      { label: "Guide Conflict", fn: () => villager.resolveDilemma(sim, "conflict") },
      { label: "Let Them Decide", fn: () => villager.resolveDilemma(sim, "auto") }
    ]);
    sim.selectedId = villager.id;
    return;
  }

  if (sim.placementBuild) {
    sim.placePlayerBuild(world.x, world.y, sim.placementBuild);
    return;
  }
  if (sim.brushMode) {
    sim.paintBrush(world.x, world.y, sim.brushMode);
    return;
  }

  const power = sim.activePower;
  if (power === "inspect") {
    sim.selectedId = villager ? villager.id : null;
    if (!villager) $("inspector").classList.add("hidden");
    return;
  }
  if (power === "possess") {
    if (!villager) return showToast("Possess needs a villager.");
    sim.possessVillager(villager);
    syncPossessChrome();
    return;
  }
  if (power === "whisper") {
    if (!villager) return showToast("Whisper needs a living mind.");
    openChoice(`Whisper to ${villager.name}`, "What do you put in their heart?", WHISPERS.map((w) => ({
      label: w.label,
      fn: () => sim.castWhisper(villager, w.id)
    })));
    sim.selectedId = villager.id;
    return;
  }
  if (power === "bless") sim.castBless(villager);
  else if (power === "inspire") sim.castInspire(villager);
  else if (power === "food") sim.castFood(world.x, world.y);
  else if (power === "lightning") sim.castLightning(world.x, world.y);
  else if (power === "hurricane") sim.castHurricane(world.x, world.y);
  else if (power === "wildfire") sim.castWildfire(world.x, world.y);
  else if (power === "hut") sim.castHut(world.x, world.y);
  if (villager && PERSON.has(power)) sim.selectedId = villager.id;
}

function bindInput() {
  let dragging = false;
  let moved = 0;
  let lx = 0;
  let ly = 0;
  const pointers = new Map();

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button === 2) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      dragging = false;
      brushPainting = false;
      return;
    }
    const world = renderer.screenToWorld(e.clientX, e.clientY);
    if (sim.brushMode) {
      brushPainting = true;
      sim.paintBrush(world.x, world.y, sim.brushMode);
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      return;
    }
    dragging = true;
    moved = 0;
    lx = e.clientX;
    ly = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    document.body.classList.add("dragging");
  });

  canvas.addEventListener("pointermove", (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0) {
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const before = renderer.screenToWorld(midX, midY);
        renderer.cam.zoom = Math.max(1.35, Math.min(5.2, renderer.cam.zoom * (d / pinchDist)));
        const after = renderer.screenToWorld(midX, midY);
        renderer.cam.x += before.x - after.x;
        renderer.cam.y += before.y - after.y;
      }
      pinchDist = d;
      return;
    }
    const world = renderer.screenToWorld(e.clientX, e.clientY);
    sim.cursor = world;
    const hover = sim.pickVillager(world.x, world.y);
    sim.hoveredId = hover ? hover.id : null;
    if (brushPainting && sim.brushMode) {
      sim.paintBrush(world.x, world.y, sim.brushMode);
      return;
    }
    if (!dragging) return;
    const dx = e.clientX - lx;
    const dy = e.clientY - ly;
    moved += Math.abs(dx) + Math.abs(dy);
    renderer.cam.x -= dx / renderer.cam.zoom;
    renderer.cam.y -= dy / renderer.cam.zoom;
    lx = e.clientX;
    ly = e.clientY;
  });

  const endPtr = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    if (brushPainting) {
      brushPainting = false;
      return;
    }
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove("dragging");
    if (moved < 8 && (e.button === 0 || e.pointerType === "touch")) onMapClick(e);
  };
  canvas.addEventListener("pointerup", endPtr);
  canvas.addEventListener("pointercancel", endPtr);
  canvas.addEventListener("pointerleave", () => { sim.hoveredId = null; });

  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (sim.placementBuild || sim.brushMode) {
      clearToolModes();
      $("powerHint").textContent = HINTS[sim.activePower] || "";
      return;
    }
    if (sim.possessedId) {
      sim.clearPossession();
      syncPossessChrome();
      showToast("You leave their body.");
      return;
    }
    setPower("inspect");
  });

  document.querySelectorAll("[data-build]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.build;
      sim.clearPossession?.();
      sim.brushMode = null;
      document.querySelectorAll("[data-brush]").forEach((b) => b.classList.remove("on"));
      const on = sim.placementBuild !== type;
      sim.placementBuild = on ? type : null;
      document.querySelectorAll("[data-build]").forEach((b) => b.classList.toggle("on", b.dataset.build === sim.placementBuild));
      $("powerHint").textContent = on
        ? `Place ${type} blueprint · right-click cancels`
        : HINTS[sim.activePower];
    });
  });
  document.querySelectorAll("[data-brush]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.brush;
      sim.clearPossession?.();
      sim.placementBuild = null;
      document.querySelectorAll("[data-build]").forEach((b) => b.classList.remove("on"));
      const on = sim.brushMode !== mode;
      sim.brushMode = on ? mode : null;
      document.querySelectorAll("[data-brush]").forEach((b) => b.classList.toggle("on", b.dataset.brush === sim.brushMode));
      $("powerHint").textContent = on
        ? `Brush: ${mode} · drag to paint · right-click cancels`
        : HINTS[sim.activePower];
    });
  });

  const padDirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  $("mobilePad")?.querySelectorAll("[data-dir]").forEach((btn) => {
    const apply = (on) => {
      const key = `pad_${btn.dataset.dir}`;
      if (on) heldMove.add(key);
      else heldMove.delete(key);
      btn._vec = padDirs[btn.dataset.dir];
    };
    btn.addEventListener("pointerdown", (e) => { e.preventDefault(); apply(true); });
    btn.addEventListener("pointerup", () => apply(false));
    btn.addEventListener("pointerleave", () => apply(false));
    btn.addEventListener("pointercancel", () => apply(false));
  });
  $("mobileAct")?.addEventListener("click", () => sim.possessInteract?.());

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const before = renderer.screenToWorld(e.clientX, e.clientY);
    renderer.cam.zoom = Math.max(1.35, Math.min(5.2, renderer.cam.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
    const after = renderer.screenToWorld(e.clientX, e.clientY);
    renderer.cam.x += before.x - after.x;
    renderer.cam.y += before.y - after.y;
  }, { passive: false });

  document.querySelectorAll("#powers button[data-power]").forEach((btn) => {
    btn.addEventListener("click", () => setPower(btn.dataset.power));
  });
  document.querySelectorAll("[data-speed]").forEach((btn) => {
    btn.addEventListener("click", () => {
      speed = Number(btn.dataset.speed);
      document.querySelectorAll("[data-speed]").forEach((b) => b.classList.toggle("on", b === btn));
      if (paused) togglePause();
    });
  });

  $("pauseBtn").addEventListener("click", togglePause);
  $("muteBtn").addEventListener("click", () => {
    muted = !muted;
    $("muteBtn").textContent = muted ? "✕" : "♪";
  });
  $("closeInspector").addEventListener("click", () => {
    sim.selectedId = null;
    $("inspector").classList.add("hidden");
  });
  $("restartBtn").addEventListener("click", () => {
    clearLocalSave();
    boot();
  });

  $("saveBtn").addEventListener("click", () => {
    $("cloudKey").value = localStorage.getItem(CLOUD_KEY) || "";
    $("cloudRoom").value = localStorage.getItem(CLOUD_ROOM) || "";
    $("saveOverlay").classList.remove("hidden");
  });
  $("closeSaveBtn").addEventListener("click", () => $("saveOverlay").classList.add("hidden"));
  $("saveNowBtn").addEventListener("click", () => { saveLocal(); showToast("Saved locally."); });
  $("loadLocalBtn").addEventListener("click", () => {
    if (loadLocal()) {
      $("saveOverlay").classList.add("hidden");
      showToast("Loaded local save.");
    } else showToast("No local save found.");
  });
  $("newGameBtn").addEventListener("click", () => {
    clearLocalSave();
    boot();
    $("saveOverlay").classList.add("hidden");
    showToast("A new age begins.");
  });
  $("exportBtn").addEventListener("click", () => {
    $("saveCode").value = btoa(unescape(encodeURIComponent(JSON.stringify(sim.serialize()))));
    navigator.clipboard?.writeText($("saveCode").value).catch(() => {});
    showToast("Save code ready.");
  });
  $("importBtn").addEventListener("click", () => {
    try {
      const raw = JSON.parse(decodeURIComponent(escape(atob($("saveCode").value.trim()))));
      boot(Simulation.fromSave(raw));
      saveLocal();
      $("saveOverlay").classList.add("hidden");
      showToast("Imported save.");
    } catch (_) {
      showToast("Invalid save code.");
    }
  });
  $("cloudSaveBtn").addEventListener("click", () => cloudSave());
  $("cloudLoadBtn").addEventListener("click", () => cloudLoad());

  window.addEventListener("keydown", (e) => {
    if (MOVE_KEYS[e.code] && sim.possessedId) {
      e.preventDefault();
      heldMove.add(e.code);
      return;
    }
    if (e.code === "Space") {
      e.preventDefault();
      if (sim.possessedId) {
        sim.possessInteract();
        return;
      }
      togglePause();
      return;
    }
    if (e.code === "Escape") {
      if (sim.possessedId) {
        sim.clearPossession();
        syncPossessChrome();
        showToast("You leave their body.");
      }
      clearToolModes();
      setPower("inspect");
      $("choiceOverlay").classList.add("hidden");
      $("saveOverlay").classList.add("hidden");
      return;
    }
    if (KEYS[e.code]) setPower(KEYS[e.code]);
  });
  window.addEventListener("keyup", (e) => {
    heldMove.delete(e.code);
  });

  window.addEventListener("resize", () => renderer.resize());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveLocal();
  });
  window.addEventListener("beforeunload", () => saveLocal());

  syncMobileChrome();
  window.matchMedia("(max-width: 768px)").addEventListener?.("change", syncMobileChrome);
}

function syncMobileChrome() {
  document.body.classList.toggle("is-mobile", window.innerWidth < 768);
}

function togglePause() {
  paused = !paused;
  $("pauseBtn").textContent = paused ? "Play" : "Pause";
  $("pauseBtn").classList.toggle("on", paused);
}

function bar(id, value) {
  const el = $(id);
  if (el) el.style.width = `${Math.max(0, Math.min(100, value))}%`;
}

function scoreBar(id, score) {
  bar(id, (score + 100) / 2);
}

function saveLocal() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(sim.serialize()));
  } catch (_) {}
}

function clearLocalSave() {
  localStorage.removeItem(SAVE_KEY);
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    boot(Simulation.fromSave(JSON.parse(raw)));
    return true;
  } catch (_) {
    return false;
  }
}

async function cloudSave() {
  const key = $("cloudKey").value.trim();
  if (!key) return showToast("Paste a JSONBin API key first.");
  localStorage.setItem(CLOUD_KEY, key);
  const body = sim.serialize();
  const room = $("cloudRoom").value.trim();
  try {
    let res;
    if (room) {
      res = await fetch(`https://api.jsonbin.io/v3/b/${room}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Master-Key": key },
        body: JSON.stringify(body)
      });
    } else {
      res = await fetch("https://api.jsonbin.io/v3/b", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": key,
          "X-Bin-Name": "emberkin-save"
        },
        body: JSON.stringify(body)
      });
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Cloud error");
    const id = data.metadata?.id || room;
    $("cloudRoom").value = id;
    localStorage.setItem(CLOUD_ROOM, id);
    showToast(`Cloud room: ${id}`);
  } catch (err) {
    showToast(`Cloud save failed: ${err.message || err}`);
  }
}

async function cloudLoad() {
  const key = $("cloudKey").value.trim();
  const room = $("cloudRoom").value.trim();
  if (!key || !room) return showToast("Need API key and Room ID.");
  localStorage.setItem(CLOUD_KEY, key);
  localStorage.setItem(CLOUD_ROOM, room);
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${room}/latest`, {
      headers: { "X-Master-Key": key }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Cloud error");
    boot(Simulation.fromSave(data.record));
    saveLocal();
    $("saveOverlay").classList.add("hidden");
    showToast("Loaded from cloud.");
  } catch (err) {
    showToast(`Cloud load failed: ${err.message || err}`);
  }
}

function updateNotices() {
  const bar = $("noticeBar");
  let html = "";
  if (sim.pendingNomads) {
    html = `<span>${sim.pendingNomads.n} wanderer(s) seek shelter.</span>
      <button type="button" id="acceptNomads">Accept</button>
      <button type="button" id="rejectNomads">Turn away</button>`;
  } else if (sim.prayerRequest) {
    html = `<span>🙏 ${escapeHtml(sim.prayerRequest.text)}</span>
      <button type="button" id="grantPrayer">Grant</button>`;
  }
  const sig = html;
  if (sig !== noticeSig) {
    noticeSig = sig;
    if (!html) {
      bar.classList.add("hidden");
      bar.innerHTML = "";
    } else {
      bar.classList.remove("hidden");
      bar.innerHTML = html;
      $("acceptNomads")?.addEventListener("click", () => sim.acceptNomads());
      $("rejectNomads")?.addEventListener("click", () => sim.rejectNomads());
      $("grantPrayer")?.addEventListener("click", () => sim.grantPrayer());
    }
  }
}

function updateHud() {
  const stock = sim.totalStock();
  const pop = sim.popBreakdown();
  $("eraName").textContent = sim.eraName;
  $("eraPip").className = `era-pip ${sim.era}`;
  const study = sim.getStudyList()[0];
  const tribeNote = sim.tribes.length > 1 ? ` · ${sim.tribes.length} tribes` : "";
  $("eraSub").textContent = `${study ? `Seeking ${study.name}` : "The old arts are known"}${tribeNote}`;
  $("pop").textContent = String(pop.total);
  $("popBreak").textContent = `${pop.adults} adults · ${pop.children} children`;
  const morale = Math.round(sim.morale);
  bar("moraleBar", morale);
  $("moraleVal").textContent = String(morale);
  $("when").textContent = `${["❀", "☀", "❧", "❄"][sim.seasonIndex]} ${sim.seasonName}`;
  const day = (Math.floor(sim.time / sim.dayLength) % sim.daysPerSeason) + 1;
  $("whenSub").textContent = `Year ${sim.year} · Day ${day}`;
  if (sim.religion) {
    $("faithName").textContent = sim.religion.name;
    $("faithSub").textContent = sim.religion.deity === "player" ? "Turned toward you" : "Turned toward the wild";
  } else {
    $("faithName").textContent = "Unnamed";
    $("faithSub").textContent = "No rite yet";
  }
  $("resFood").textContent = String(Math.floor(stock.food));
  $("resWood").textContent = String(Math.floor(stock.wood));
  $("resStone").textContent = String(Math.floor(stock.stone));

  document.querySelectorAll("#powers button[data-power]").forEach((btn) => {
    const id = btn.dataset.power;
    const cd = sim.cooldowns[id] || 0;
    const max = sim.cooldownMax[id] || 1;
    const mask = btn.querySelector(".cd");
    if (mask) mask.style.height = cd > 0 ? `${(cd / max) * 100}%` : "0%";
  });

  const sig = sim.events.map((ev) => ev.t + ev.text).join("|");
  if (sig !== logSig) {
    logSig = sig;
    $("log").innerHTML = sim.events.slice(0, 10).map((ev) =>
      `<li class="${ev.type}"><span class="yr">${ev.season} · Year ${ev.year}</span>${escapeHtml(ev.text)}</li>`
    ).join("");
  }

  const studies = sim.getStudyList();
  const ssig = studies.map((s) => `${s.id}:${Math.floor(s.pct)}`).join(",");
  if (ssig !== studySig) {
    studySig = ssig;
    $("studies").innerHTML = studies.length
      ? studies.map((s) => `
        <div class="study">
          <div class="study-top"><span>${escapeHtml(s.name)}</span><span>${Math.floor(s.pct)}%</span></div>
          <div class="track"><div class="fill study" style="width:${s.pct}%"></div></div>
        </div>`).join("")
      : `<p class="meta">Nothing left to wonder in this age.</p>`;
  }

  if (sim.toast && sim.toast.life > 0) {
    $("toast").classList.remove("hidden");
    $("toast").textContent = sim.toast.text;
  } else $("toast").classList.add("hidden");

  updateNotices();

  const selected = sim.selectedId ? sim.villagerById(sim.selectedId) : null;
  if (!selected || selected.dead) {
    if (sim.selectedId) sim.selectedId = null;
    $("inspector").classList.add("hidden");
  } else {
    $("inspector").classList.remove("hidden");
    const tribe = sim.tribeOf(selected.tribeId);
    $("vName").textContent = selected.name;
    $("vMeta").textContent = `${selected.isChild ? "Child" : `Age ${selected.age}`} · IQ ${Math.round(selected.intelligence)} · ${selected.moodLabel()}`;
    $("vTribe").textContent = `${tribe ? tribe.name : "Wanderer"}${selected.partnerId ? " · paired" : ""}${selected.illness ? ` · ${selected.illness.type}` : ""}`;
    $("vLineage").textContent = selected.isFounder
      ? `Founder · line ${selected.founderLineName || selected.name}`
      : `Gen ${selected.generation || 0} · blood of ${selected.founderLineName || "unknown"}`;
    $("vTrait").textContent = `${selected.trait}${(selected.traitTags || []).length ? " · " + selected.traitTags.join(", ") : ""}`;
    bar("mHunger", selected.hunger);
    bar("mEnergy", selected.energy);
    bar("mHealth", selected.health);
    bar("mBelief", selected.religionBelief);
    scoreBar("mEmp", selected.empathyScore || 0);
    scoreBar("mBold", selected.boldnessScore || 0);
    scoreBar("mPeace", selected.peacefulnessScore || 0);
    scoreBar("mGodA", selected.godAlignmentScore || 0);
    $("nHunger").textContent = String(Math.round(selected.hunger));
    $("nEnergy").textContent = String(Math.round(selected.energy));
    $("nHealth").textContent = String(Math.round(selected.health));
    $("nBelief").textContent = String(Math.round(selected.religionBelief));
    $("nEmp").textContent = String(Math.round(selected.empathyScore || 0));
    $("nBold").textContent = String(Math.round(selected.boldnessScore || 0));
    $("nPeace").textContent = String(Math.round(selected.peacefulnessScore || 0));
    $("nGodA").textContent = String(Math.round(selected.godAlignmentScore || 0));
    $("vMood").textContent = selected.moodLabel();
    $("vTask").textContent = selected.taskLabel || "Idle";
    $("vUrge").textContent = selected.urge ? `Studies ${selected.urge}` : `Insights ${Math.floor(selected.insightTotal || 0)}`;
    const genes = [];
    if (selected.geneticHealth != null) genes.push(`Vitality ${Math.round(selected.geneticHealth)}`);
    if (selected.inbreedingCoefficient) genes.push(`Inbreed ${(selected.inbreedingCoefficient * 100) | 0}%`);
    if (selected.hereditaryTraits?.length) genes.push(selected.hereditaryTraits.join(", "));
    $("vGenes").textContent = genes.join(" · ");
    if ($("vBody") && selected.body) {
      const parts = Object.entries(selected.body).map(([k, v]) => {
        const p = selected.prosthetics?.[k];
        return `${k}:${Math.round(v)}${p ? `(${p})` : ""}`;
      });
      $("vBody").textContent = parts.join(" · ");
    }
    const mem = selected.memories[0];
    $("vMemory").textContent = mem ? `“${mem.text}”` : "No memory worth keeping yet.";
    $("vMemList").innerHTML = (selected.personalityXP || selected.memories || []).slice(0, 4)
      .map((m) => `<li>${escapeHtml(m.text)}${m.year ? ` · Y${m.year}` : ""}</li>`).join("");
    $("vInfluence").innerHTML = (selected.influenceHistory || []).slice(0, 4)
      .map((m) => `<li>${escapeHtml(m.text)}</li>`).join("") || "<li>No divine whispers yet</li>";
    if (animTime - relStamp > 0.35) {
      relStamp = animTime;
      const rels = selected.describeRelations(sim);
      $("vRels").innerHTML = rels.length
        ? rels.map((r) => `<li><span>${escapeHtml(r.name)}</span><span class="tag ${r.label.toLowerCase()}">${r.label}</span><span>${r.aff}</span></li>`).join("")
        : "<li><span>No bonds yet</span></li>";
    }
    $("vStores").textContent = tribe
      ? `Stores · ${Math.floor(tribe.food)} food · ${Math.floor(tribe.wood)} wood · ${Math.floor(tribe.stone)} stone`
      : "";
    renderer.drawPortrait(pctx, selected, sim, animTime);
  }

  if (sim.over) {
    $("overlay").classList.remove("hidden");
    $("overlayTitle").textContent = "Silence";
    $("overlayText").textContent = "Every voice has gone quiet. The ages keep whatever they learned.";
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function frame(now) {
  const raw = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!paused) animTime += raw * speed;
  if (sim.possessedId && !paused) {
    let mx = 0;
    let my = 0;
    for (const code of heldMove) {
      if (MOVE_KEYS[code]) {
        mx += MOVE_KEYS[code][0];
        my += MOVE_KEYS[code][1];
      } else if (code.startsWith("pad_")) {
        const btn = document.querySelector(`[data-dir="${code.slice(4)}"]`);
        const vec = btn?._vec || { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[code.slice(4)];
        if (vec) {
          mx += vec[0];
          my += vec[1];
        }
      }
    }
    if (mx || my) {
      const len = Math.hypot(mx, my) || 1;
      sim.movePossessed(mx / len, my / len, raw * speed);
    }
    const host = sim.possessedVillager();
    if (host) {
      renderer.cam.x += (host.x - renderer.cam.x) * Math.min(1, raw * 4);
      renderer.cam.y += (host.y - renderer.cam.y) * Math.min(1, raw * 4);
    } else syncPossessChrome();
  }
  sim.update(paused ? 0 : raw * speed);
  saveAcc += raw;
  if (saveAcc > 60) {
    saveAcc = 0;
    saveLocal();
  }
  renderer.draw(sim, animTime);
  updateHud();
  playSfx();
  requestAnimationFrame(frame);
}

if (loadLocal()) showToast("Restored local save.");
else boot();
bindInput();
requestAnimationFrame(frame);
