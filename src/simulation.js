/** World state: time, eras, insight, tribes, faith, disasters, and god powers. */

import { Villager, takeName, TRAITS } from "./villager.js";

export const TILE = 16;
export const MAP_W = 96;
export const MAP_H = 68;

export const TECHS = [
  { id: "speech", name: "Basic Speech", field: "culture", era: "stone", cost: 8, requires: [], blurb: "Names for hunger, fear, and sky." },
  { id: "foraging", name: "Foraging Lore", field: "food", era: "stone", cost: 8, requires: [], blurb: "Which red is sweet." },
  { id: "campfire", name: "Campfire", field: "fire", era: "stone", cost: 16, requires: [], blurb: "A tame star." },
  { id: "stone_tools", name: "Stone Tools", field: "tools", era: "stone", cost: 22, requires: [], blurb: "Edges that remember the hand." },
  { id: "mud_huts", name: "Mud Huts", field: "shelter", era: "stone", cost: 26, requires: [], blurb: "Walls of river and straw." },
  { id: "farming", name: "Farming", field: "food", era: "stone", cost: 40, requires: ["foraging"], blurb: "Seed is a promise." },
  { id: "nature_worship", name: "Nature Worship", field: "faith", era: "stone", cost: 26, requires: [], blurb: "The grove has a pulse." },
  { id: "weaving", name: "Weaving", field: "shelter", era: "bronze", cost: 46, requires: ["mud_huts"], blurb: "Thread becomes a second skin." },
  { id: "stronger_shelter", name: "Stronger Shelter", field: "shelter", era: "bronze", cost: 50, requires: ["mud_huts"], blurb: "Roofs that answer the wind." },
  { id: "irrigation", name: "Irrigation", field: "food", era: "bronze", cost: 54, requires: ["farming"], blurb: "Water, taught to stay." },
  { id: "writing", name: "Writing", field: "culture", era: "bronze", cost: 48, requires: ["speech"], blurb: "Memory that outlives the mouth." },
  { id: "kiln", name: "Kiln", field: "fire", era: "bronze", cost: 44, requires: ["campfire"], blurb: "Clay, convinced." },
  { id: "bronze", name: "Bronze Working", field: "tools", era: "bronze", cost: 60, requires: ["stone_tools", "kiln"], blurb: "Copper and tin wake together." },
  { id: "storm_worship", name: "Storm Worship", field: "faith", era: "bronze", cost: 42, requires: ["nature_worship"], blurb: "The hurricane is a god who blinks." },
  { id: "iron", name: "Iron Tools", field: "tools", era: "medieval", cost: 74, requires: ["bronze"], blurb: "A darker, truer edge." },
  { id: "stone_walls", name: "Stone Walls", field: "shelter", era: "medieval", cost: 72, requires: ["stronger_shelter"], blurb: "The camp becomes a place." },
  { id: "crop_rotation", name: "Crop Rotation", field: "food", era: "medieval", cost: 70, requires: ["irrigation"], blurb: "The soil is given a turn to rest." },
  { id: "laws", name: "Laws", field: "culture", era: "medieval", cost: 68, requires: ["writing"], blurb: "Grudges, given a ritual." },
  { id: "divine_cult", name: "Divine Cult", field: "faith", era: "medieval", cost: 66, requires: ["storm_worship"], blurb: "The unseen hand is given a name." },
  { id: "armor", name: "Armor Craft", field: "tools", era: "medieval", cost: 76, requires: ["iron"], blurb: "A body for the body." },
  { id: "carpentry", name: "Carpentry", field: "shelter", era: "bronze", cost: 42, requires: ["mud_huts", "stone_tools"], blurb: "Wood bent to replace what flesh lost." },
  { id: "sanitation", name: "Sanitation", field: "culture", era: "medieval", cost: 58, requires: ["laws"], blurb: "Waste kept from the well." },
  { id: "steam", name: "Steam Works", field: "tools", era: "industrial", cost: 88, requires: ["iron", "kiln"], blurb: "Water forced into labor." },
  { id: "factories", name: "Factories", field: "shelter", era: "industrial", cost: 92, requires: ["steam"], blurb: "Many hands, one machine." },
  { id: "filtration", name: "Filtration", field: "food", era: "industrial", cost: 80, requires: ["irrigation", "steam"], blurb: "Smoke taught not to drink the river." },
  { id: "atomic", name: "Atomic Energy", field: "fire", era: "nuclear", cost: 110, requires: ["steam", "writing"], blurb: "A star in a cage." },
  { id: "reactors", name: "Nuclear Reactors", field: "tools", era: "nuclear", cost: 120, requires: ["atomic"], blurb: "Power that remembers the sun too well." }
];

const ERA_INDEX = { stone: 0, bronze: 1, medieval: 2, industrial: 3, nuclear: 4 };
const ERA_NAME = {
  stone: "Stone Age",
  bronze: "Bronze Age",
  medieval: "Medieval",
  industrial: "Industrial Age",
  nuclear: "Nuclear Age"
};
const ERA_LINES = {
  bronze: "The age turns. Bronze wakes in the clay, and the old stone bows.",
  medieval: "Walls, oaths, and iron. The Medieval age gathers its breath.",
  industrial: "Smoke climbs. The Industrial age begins to cough.",
  nuclear: "A quiet sun is lit under the earth. The Nuclear age opens its eyes."
};

export const BUILD_COSTS = {
  campfire: { wood: 6, stone: 0 },
  hut: { wood: 10, stone: 0 },
  storage: { wood: 8, stone: 4 },
  research: { wood: 6, stone: 2 },
  well: { wood: 4, stone: 6 },
  workbench: { wood: 8, stone: 2 },
  mine: { wood: 6, stone: 8 },
  gaswell: { wood: 8, stone: 10 },
  reactor: { wood: 12, stone: 20 }
};

const NATION_SUFFIX = ["land", "ia", "stan", "mark", "gard", "heim"];
const ANIMAL_KINDS = [
  "deer", "wolf", "boar", "cattle", "fox",
  "rabbit", "bear", "sheep", "goat", "chicken",
  "horse", "snake", "beaver", "moose", "pig"
];
const ANIMAL_HP = {
  wolf: 28, boar: 32, cattle: 40, fox: 14, deer: 18,
  rabbit: 8, bear: 55, sheep: 22, goat: 20, chicken: 6,
  horse: 36, snake: 10, beaver: 16, moose: 48, pig: 26
};
const ANIMAL_SPEED = {
  wolf: 28, fox: 30, rabbit: 34, horse: 36, snake: 16,
  bear: 18, moose: 17, cattle: 14, sheep: 16, chicken: 14,
  beaver: 15, goat: 22, pig: 18, boar: 20, deer: 24
};
const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];
const TRIBE_COLORS = ["#d08a45", "#6fa8c9", "#c46b8a", "#7dba6a"];
const TRIBE_PREFIX = ["Ash", "Reed", "Wolf", "Flint", "River", "Moss", "Cinder", "Hawk", "Yarrow", "Bone"];
const SKINS = ["#f0c7a0", "#e0ac84", "#c6865a", "#8d5524", "#5c3317"];
const HAIRS = ["#2a211c", "#5a3828", "#c4552a", "#d8b15a", "#6e6a72", "#1c1a22"];
const FIELDS = ["food", "tools", "shelter", "fire", "culture", "faith"];

const POWER_MAX = {
  bless: 1.2,
  inspire: 6,
  food: 2.4,
  lightning: 3.4,
  hurricane: 26,
  wildfire: 10,
  hut: 1,
  whisper: 2.5,
  rain: 8,
  quake: 18
};

const GOAL_DEFS = [
  { id: "pop12", label: "Grow to 12 living souls", test: (s) => s.villagers.length >= 12 },
  { id: "bronze", label: "Enter the Bronze Age", test: (s) => s.eraIndex(s.era) >= s.eraIndex("bronze") },
  { id: "faith", label: "Found a religion", test: (s) => !!s.religion },
  { id: "festival", label: "Hold a festival", test: (s) => !!s.goalsDone?.festival },
  { id: "survive5", label: "Reach Year 5", test: (s) => s.year >= 5 }
];

function pickPrayer(sim) {
  const devout = sim?.villagers?.filter((v) => !v.dead && (v.godAlignmentScore > 20 || v.religionBelief > 40)) || [];
  const who = devout.length ? devout[(Math.random() * devout.length) | 0] : null;
  const name = who?.name || "A villager";
  const sickChild = sim?.villagers?.find((v) => v.isChild && v.illness && !v.dead);
  const hungry = sim?.tribes?.some((t) => t.food < 8);
  const lines = [];
  if (sickChild) lines.push(`${name} prays for healing for ${sickChild.name}.`);
  if (hungry) lines.push(`${name} prays the baskets fill before winter.`);
  lines.push(
    `${name} prays for lightning to strike the wolf den.`,
    `${name} prays for rain on the dry fields.`,
    `${name} prays for peace after a bitter quarrel.`,
    `${name} asks that the sick rise by morning.`,
    `${name} begs forgiveness for scraps taken in hunger.`
  );
  return lines[(Math.random() * lines.length) | 0];
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class Simulation {
  constructor() {
    this.tile = TILE;
    this.w = MAP_W;
    this.h = MAP_H;
    this.seed = (Math.random() * 1e9) | 0;
    this.tiles = [];
    this.villagers = [];
    this.byId = new Map();
    this.tribes = [];
    this.structures = [];
    this.blueprints = [];
    this.floaters = [];
    this.fx = [];
    this.bolts = [];
    this.events = [];
    this.sfx = [];
    this.namesUsed = new Set();
    this.nextId = 1;
    this.nextTribe = 1;
    this.time = 18 * 0.34;
    this.dayLength = 18;
    this.daysPerSeason = 3;
    this.year = 1;
    this.seasonIndex = 0;
    this.lastSeason = 0;
    this.dayT = 0.22;
    this.era = "stone";
    this.unlocked = new Set(["speech", "foraging"]);
    this.insight = { food: 0, tools: 0, shelter: 0, fire: 0, culture: 0, faith: 0 };
    this.religion = null;
    this.godScore = 0;
    this.natureScore = 0;
    this.weather = null;
    this.flash = 0;
    this.terrainRev = 1;
    this.terrainDirty = false;
    this.selectedId = null;
    this.hoveredId = null;
    this.activePower = "inspect";
    this.cursor = null;
    this.cooldowns = { bless: 0, inspire: 0, food: 0, lightning: 0, hurricane: 0, wildfire: 0, hut: 0, whisper: 0, possess: 0, rain: 0, quake: 0 };
    this.pendingNomads = null;
    this.prayerRequest = null;
    this.eventAcc = 12;
    this.nextFounderLine = 1;
    this.possessedId = null;
    this.placementBuild = null;
    this.brushMode = null;
    this.animals = [];
    this.pollutionAcc = 0;
    this.festival = null;
    this.festivalCd = 40;
    this.goalsDone = {};
    this.quakeT = 0;
    this.cooldownMax = POWER_MAX;
    this.toast = null;
    this.over = false;
    this.splitCd = 50;
    this.godMemory = 0;
    this.lastDisaster = null;
    this.fireSeen = false;
    this.projectAcc = 0;
    this.splitAcc = 0;
    this.faithAcc = 0;
    this.homeX = 0;
    this.homeY = 0;
    this.graves = [];
    this.vaccineReady = false;
    this.factionMissions = [];
    this.factionAcc = 0;
    this.tribeRelations = {}; // key `${a}-${b}` -> affinity -100..100
    this.wars = [];
    this.warAcc = 0;
    this.nationAcc = 0;
    this.economyAcc = 0;
    this.spectatorHint = true;
    this.generate();
    this.log("Your people wake in the Stone Age. They will build without you — watch, or reach when you wish.", "god");
  }

  get yearLength() {
    return this.dayLength * this.daysPerSeason * 4;
  }

  get seasonName() {
    return SEASONS[this.seasonIndex];
  }

  get eraName() {
    return ERA_NAME[this.era];
  }

  randAt(x, y) {
    let n = Math.imul((x | 0) ^ this.seed, 374761393) + Math.imul(y | 0, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  valueNoise(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const n00 = this.randAt(x0, y0);
    const n10 = this.randAt(x0 + 1, y0);
    const n01 = this.randAt(x0, y0 + 1);
    const n11 = this.randAt(x0 + 1, y0 + 1);
    return lerp(lerp(n00, n10, sx), lerp(n01, n11, sx), sy);
  }

  fbm(x, y) {
    let v = 0;
    let a = 0.55;
    let f = 1;
    let sum = 0;
    for (let i = 0; i < 4; i++) {
      v += a * this.valueNoise(x * f, y * f);
      sum += a;
      a *= 0.5;
      f *= 2;
    }
    return v / sum;
  }

  idx(tx, ty) {
    return ty * this.w + tx;
  }

  inBounds(tx, ty) {
    return tx >= 0 && ty >= 0 && tx < this.w && ty < this.h;
  }

  getTile(tx, ty) {
    if (!this.inBounds(tx, ty)) return null;
    return this.tiles[this.idx(tx, ty)];
  }

  worldToTile(x, y) {
    return {
      tx: clamp(Math.floor(x / this.tile), 0, this.w - 1),
      ty: clamp(Math.floor(y / this.tile), 0, this.h - 1)
    };
  }

  getTileAtPixel(x, y) {
    const t = this.worldToTile(x, y);
    return this.getTile(t.tx, t.ty);
  }

  tileCenter(tx, ty) {
    return { x: tx * this.tile + this.tile / 2, y: ty * this.tile + this.tile / 2 };
  }

  walkable(tx, ty) {
    const t = this.getTile(tx, ty);
    if (!t) return false;
    if (t.type === "water" || t.type === "rock") return false;
    if (t.fire > 0.55) return false;
    return true; // grass, path, sand, barren, farm
  }

  walkablePixel(x, y) {
    const t = this.worldToTile(x, y);
    return this.walkable(t.tx, t.ty);
  }

  tileFire(tx, ty) {
    return this.getTile(tx, ty)?.fire || 0;
  }

  nearestWalkable(tx, ty, maxR = 6) {
    if (this.walkable(tx, ty)) return { tx, ty };
    for (let r = 1; r <= maxR; r++) {
      for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
          if (Math.max(Math.abs(x), Math.abs(y)) !== r) continue;
          if (this.walkable(tx + x, ty + y)) return { tx: tx + x, ty: ty + y };
        }
      }
    }
    return null;
  }

  standNear(tx, ty) {
    const dirs = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    for (const [dx, dy] of dirs) {
      if (this.walkable(tx + dx, ty + dy)) return { tx: tx + dx, ty: ty + dy };
    }
    return this.nearestWalkable(tx, ty, 3) || { tx, ty };
  }

  randomWalkableNear(tx, ty, radius) {
    for (let i = 0; i < 16; i++) {
      const x = tx + ((Math.random() * (radius * 2 + 1)) | 0) - radius;
      const y = ty + ((Math.random() * (radius * 2 + 1)) | 0) - radius;
      if (this.walkable(x, y)) return { tx: x, ty: y };
    }
    return this.nearestWalkable(tx, ty, radius);
  }

  generate() {
    for (let attempt = 0; attempt < 6; attempt++) {
      if (attempt > 0) this.seed = (Math.random() * 1e9) | 0;
      this.tiles = [];
      let water = 0;
      for (let ty = 0; ty < this.h; ty++) {
        for (let tx = 0; tx < this.w; tx++) {
          const h = this.fbm(tx * 0.14, ty * 0.14);
          const moist = this.fbm(tx * 0.14 + 20, ty * 0.14 + 8);
          const river = this.h * 0.58 + Math.sin(tx * 0.22) * 4.2;
          const riverD = Math.abs(ty - river);
          let type = "grass";
          if (h < 0.34 || riverD < 1.35) type = "water";
          else if (h < 0.4 || riverD < 2.35) type = "sand";
          else if (h > 0.8 && moist < 0.52) type = "rock";
          if (type === "water") water++;
          this.tiles.push({
            type,
            res: null,
            amount: 0,
            max: 0,
            growth: 0,
            fire: 0,
            burned: 0,
            regrow: 0,
            nearWater: false,
            wear: 0,
            moist
          });
        }
      }
      if (water / this.tiles.length < 0.42 && water > 20) break;
    }

    for (let ty = 0; ty < this.h; ty++) {
      for (let tx = 0; tx < this.w; tx++) {
        const tile = this.getTile(tx, ty);
        let near = false;
        for (let y = -3; y <= 3 && !near; y++) {
          for (let x = -3; x <= 3; x++) {
            if (this.getTile(tx + x, ty + y)?.type === "water") {
              near = true;
              break;
            }
          }
        }
        tile.nearWater = near;
      }
    }

    let best = null;
    let bestScore = -Infinity;
    for (let ty = 4; ty < this.h - 4; ty++) {
      for (let tx = 4; tx < this.w - 4; tx++) {
        const tile = this.getTile(tx, ty);
        if (tile.type !== "grass" || !tile.nearWater) continue;
        let grass = 0;
        let water = 0;
        for (let y = -4; y <= 4; y++) {
          for (let x = -4; x <= 4; x++) {
            const t = this.getTile(tx + x, ty + y);
            if (!t) continue;
            if (t.type === "grass") grass++;
            if (t.type === "water") water++;
          }
        }
        const score = grass + water * 0.8 - Math.abs(tx - this.w * 0.42) * 0.15;
        if (water >= 4 && grass > 28 && score > bestScore) {
          bestScore = score;
          best = { tx, ty };
        }
      }
    }
    if (!best) best = { tx: (this.w / 2) | 0, ty: (this.h / 2) | 0 };

    for (let y = -6; y <= 6; y++) {
      for (let x = -6; x <= 6; x++) {
        const t = this.getTile(best.tx + x, best.ty + y);
        if (!t || t.type === "water") continue;
        if (x * x + y * y <= 28) {
          t.type = "grass";
          t.res = null;
          t.amount = 0;
        }
      }
    }

    const center = this.tileCenter(best.tx, best.ty);
    this.homeX = center.x;
    this.homeY = center.y;

    const scatter = (res, count, minR, maxR, amount) => {
      let placed = 0;
      let guard = 0;
      while (placed < count && guard++ < 400) {
        const ang = Math.random() * Math.PI * 2;
        const rad = minR + Math.random() * (maxR - minR);
        const tx = best.tx + Math.round(Math.cos(ang) * rad);
        const ty = best.ty + Math.round(Math.sin(ang) * rad);
        const t = this.getTile(tx, ty);
        if (!t || t.type !== "grass" || t.res) continue;
        t.res = res;
        t.amount = amount;
        t.max = amount;
        placed++;
      }
    };
    scatter("bush", 28, 4, 18, 5);
    scatter("tree", 36, 6, 22, 4);
    scatter("stone", 14, 5, 16, 5);

    for (let ty = 0; ty < this.h; ty++) {
      for (let tx = 0; tx < this.w; tx++) {
        const t = this.getTile(tx, ty);
        if (t.res || t.type !== "grass") continue;
        const n = this.randAt(tx * 3 + 9, ty * 5 + 2);
        const far = Math.hypot(tx - best.tx, ty - best.ty);
        if (far < 6) continue;
        if (t.moist > 0.58 && n > 0.72) {
          t.res = "tree";
          t.amount = 3;
          t.max = 3;
        } else if (n > 0.9) {
          t.res = "bush";
          t.amount = 3;
          t.max = 4;
        }
        const nearRock = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([x, y]) => this.getTile(tx + x, ty + y)?.type === "rock");
        if (nearRock && n > 0.55 && !t.res) {
          t.res = "stone";
          t.amount = 4;
          t.max = 4;
        } else if (nearRock && n > 0.82 && !t.res) {
          t.res = "gold";
          t.amount = 3;
          t.max = 5;
        } else if (n > 0.965 && !t.res && t.type === "grass") {
          t.res = "gas";
          t.amount = 4;
          t.max = 6;
        }
      }
    }

    const tribe = {
      id: this.nextTribe++,
      name: "Emberkin",
      color: TRIBE_COLORS[0],
      homeX: center.x,
      homeY: center.y,
      food: 36,
      wood: 14,
      stone: 4,
      gold: 0,
      gas: 0,
      expect: 0,
      arrived: 0,
      announced: true,
      leaderId: null,
      isNation: false,
      nationName: null,
      govTitle: "Elder",
      atWarWith: []
    };
    this.tribes.push(tribe);
    this.structures.push({
      id: this.nextId++,
      type: "campfire",
      tx: best.tx,
      ty: best.ty,
      tribeId: tribe.id,
      hp: 70,
      maxHp: 70
    });

    this.insight = { food: 0, tools: 0, shelter: 0, fire: 0, culture: 0, faith: 0 };
    this.unlocked = new Set(["speech", "foraging"]);
    this.pendingNomads = null;
    this.prayerRequest = null;
    this.eventAcc = 8 + Math.random() * 10;
    this.nextFounderLine = 1;

    const founderPool = [
      ["Grok", "Aggressive"],
      ["Asha", "Inventive"],
      ["Lira", "Devout"],
      ["Nia", "Kind"],
      ["Fen", "Curious"],
      ["Moss", "Lazy"]
    ];
    const nFounders = 2 + ((Math.random() * 3) | 0);
    const starters = founderPool.slice(0, nFounders);
    starters.forEach(([name, trait], i) => {
      this.namesUsed.add(name);
      const ang = (i / starters.length) * Math.PI * 2;
      const lineId = `F${this.nextFounderLine++}`;
      const v = new Villager({
        name,
        trait,
        age: 20 + ((i * 4) % 12),
        hunger: 12 + Math.random() * 14,
        energy: 78 + Math.random() * 18,
        intelligence: 55 + Math.random() * 50 + (trait === "Inventive" ? 25 : trait === "Curious" ? 12 : 0),
        religionBelief: trait === "Devout" ? 32 + Math.random() * 18 : 4 + Math.random() * 14,
        aptitude: FIELDS[i % FIELDS.length],
        tribeId: tribe.id,
        x: center.x + Math.cos(ang) * 22,
        y: center.y + Math.sin(ang) * 18,
        skin: SKINS[i % SKINS.length],
        hair: HAIRS[(i * 2) % HAIRS.length],
        hairStyle: i % 4,
        beard: trait === "Aggressive",
        scale: 0.96 + Math.random() * 0.1,
        isFounder: true,
        generation: 0,
        founderLineId: lineId,
        founderLineName: name,
        surname: name,
        sex: i % 2 === 0 ? "m" : "f"
      });
      v.initPersonalityFromTrait(trait);
      if (!this.walkablePixel(v.x, v.y)) {
        const spot = this.nearestWalkable(best.tx, best.ty, 6) || { tx: best.tx, ty: best.ty };
        const c = this.tileCenter(spot.tx, spot.ty);
        v.x = c.x;
        v.y = c.y;
      }
      this.addVillager(v);
    });
    tribe.leaderId = this.villagers[0]?.id ?? null;
    for (const v of this.villagers) v.initRelations(this.villagers);
    for (const v of this.villagers) v.beginWander(this, 4);
    this.seedWildlife();
    this.log(`${nFounders} founders kindle the first fire. The Stone Age begins with empty hands and open eyes.`, "god");
  }

  addVillager(v) {
    this.villagers.push(v);
    this.byId.set(v.id, v);
  }

  villagerById(id) {
    return this.byId.get(id) || null;
  }

  tribeOf(id) {
    return this.tribes.find((t) => t.id === id) || null;
  }

  tribePop(id) {
    return this.villagers.filter((v) => v.tribeId === id && !v.dead).length;
  }

  nearestTribe(x, y) {
    let best = this.tribes[0];
    let d = Infinity;
    for (const t of this.tribes) {
      const dd = Math.hypot(t.homeX - x, t.homeY - y);
      if (dd < d) {
        d = dd;
        best = t;
      }
    }
    return best;
  }

  totalStock() {
    return this.tribes.reduce(
      (a, t) => {
        a.food += t.food;
        a.wood += t.wood;
        a.stone += t.stone;
        a.gold += t.gold || 0;
        a.gas += t.gas || 0;
        return a;
      },
      { food: 0, wood: 0, stone: 0, gold: 0, gas: 0 }
    );
  }

  get morale() {
    if (!this.villagers.length) return 0;
    let s = 0;
    for (const v of this.villagers) s += v.mood;
    let m = s / this.villagers.length;
    const stock = this.totalStock();
    if (stock.food < this.villagers.length) m -= 8;
    if (this.weather?.type === "hurricane") m -= 14;
    if (this.religion) m += 4;
    return clamp(m, 0, 100);
  }

  hasTech(id) {
    return this.unlocked.has(id);
  }

  eraIndex(era) {
    return ERA_INDEX[era] ?? 0;
  }

  available(tech) {
    if (!tech.requires.every((id) => this.unlocked.has(id))) return false;
    if (this.eraIndex(tech.era) > this.eraIndex(this.era) + 1) return false;
    return true;
  }

  effectiveCost(tech) {
    let cost = tech.cost;
    if (tech.id === "divine_cult" && this.religion?.deity === "player") cost -= 18;
    if (tech.id === "storm_worship" && (this.religion?.deity === "nature" || this.lastDisaster === "hurricane")) cost -= 8;
    if (tech.id === "stronger_shelter" && this.lastDisaster === "hurricane") cost -= 8;
    return Math.max(8, cost);
  }

  log(text, type = "info") {
    this.events.unshift({ text, type, year: this.year, season: this.seasonName, t: this.time });
    if (this.events.length > 28) this.events.pop();
    this.toast = { text, life: 3.4 };
  }

  float(x, y, text, color) {
    this.floaters.push({ x, y, text, color, life: 2.2, max: 2.2 });
    if (this.floaters.length > 40) this.floaters.shift();
  }

  burst(x, y, color, n = 6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 8 + Math.random() * 22;
      this.fx.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 8,
        life: 0.45 + Math.random() * 0.4,
        max: 0.8,
        color,
        size: 1 + (Math.random() * 2) | 0
      });
    }
    if (this.fx.length > 240) this.fx.splice(0, this.fx.length - 240);
  }

  isNight() {
    return this.dayT >= 0.74 || this.dayT < 0.08;
  }

  update(dt) {
    if (this.over) return;
    this.time += dt;
    this._tickPhase = (this._tickPhase | 0) + 1;
    const phase = this._tickPhase;
    this.godMemory = Math.max(0, this.godMemory - dt);
    this.flash = Math.max(0, this.flash - dt * 1.7);
    this.splitCd = Math.max(0, this.splitCd - dt);
    if (this.toast) {
      this.toast.life -= dt;
      if (this.toast.life <= 0) this.toast = null;
    }
    for (const k of Object.keys(this.cooldowns)) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);

    // Always-on: clock, weather, fires, villagers
    this.tickClock(dt);
    this.tickWeather(dt);
    this.tickFires(dt);

    // Stagger heavy world systems across frames (same wall-time feel via 2–4× dt)
    const p4 = phase & 3;
    if (p4 === 0) {
      this.tickResources(dt * 4);
      this.tickPassiveInsight(dt * 4);
    } else if (p4 === 1) {
      this.tickPopulationEvents(dt * 4);
      this.tickDisease(dt * 4);
      this.tickPrayers(dt * 4);
    } else if (p4 === 2) {
      this.tickAnimals(dt * 4);
      this.tickPollution(dt * 4);
      this.tickFallout(dt * 4);
    } else {
      this.tickFestival(dt * 4);
      this.tickQuake(dt * 4);
      this.tickGoals();
      this.tickFactionMissions(dt * 4);
      this.tickOfferings(dt * 4);
    }
    if ((phase & 1) === 0) {
      this.tickNations(dt * 2);
      this.tickWars(dt * 2);
    } else {
      this.tickEconomy(dt * 2);
      this.tickAutonomousGod(dt * 2);
    }

    // Villagers: everyone moves every frame; deep AI staggered in batches
    const n = this.villagers.length;
    const batches = n > 48 ? 4 : n > 24 ? 3 : 2;
    const batch = phase % batches;
    for (let i = 0; i < n; i++) {
      const v = this.villagers[i];
      const deep = (i % batches) === batch;
      v._aiThisFrame = deep;
      v._aiScale = deep ? batches : 1;
      v.update(dt, this);
    }
    if (this.villagers.some((v) => v.dead)) {
      this.villagers = this.villagers.filter((v) => !v.dead);
      this.byId.clear();
      for (const v of this.villagers) this.byId.set(v.id, v);
    }

    if ((phase & 1) === 0) this.tickOverlaps();
    this.projectAcc += dt;
    if (this.projectAcc > 1.2) {
      this.projectAcc = 0;
      this.tickProjects();
    }
    this.splitAcc += dt;
    if (this.splitAcc > 6) {
      this.splitAcc = 0;
      this.tickSplit();
    }
    this.faithAcc += dt;
    if (this.faithAcc > 5) {
      this.faithAcc = 0;
      this.tickReligion();
    }

    for (const f of this.floaters) {
      f.life -= dt;
      f.y -= 8 * dt;
    }
    if (this.floaters.length > 40) this.floaters.length = 40;
    this.floaters = this.floaters.filter((f) => f.life > 0);
    for (const p of this.fx) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 10 * dt;
    }
    if (this.fx.length > 120) this.fx.length = 120;
    this.fx = this.fx.filter((p) => p.life > 0);
    for (const b of this.bolts) b.life -= dt;
    this.bolts = this.bolts.filter((b) => b.life > 0);

    if (this.terrainDirty) {
      this.terrainDirty = false;
      this.terrainRev++;
    }
    if (!this.villagers.length) {
      this.over = true;
      this.log("The last voice goes quiet. The land keeps the ashes.", "bad");
    }
  }

  tickClock() {
    const day = this.dayLength;
    this.dayT = (this.time % day) / day;
    const seasonLen = day * this.daysPerSeason;
    const season = Math.floor(this.time / seasonLen) % 4;
    const year = 1 + Math.floor(this.time / this.yearLength);
    if (season !== this.lastSeason) {
      this.lastSeason = season;
      this.seasonIndex = season;
      this.terrainDirty = true;
      const lines = [
        "Spring loosens the buds.",
        "Summer lays a heavy gold on the grass.",
        "Autumn stains the leaves and the tempers.",
        "Winter arrives with an empty basket."
      ];
      this.log(lines[season], "info");
    } else this.seasonIndex = season;
    if (year !== this.year) {
      this.year = year;
      if (year > 1) this.log(`Year ${year} begins.`, "info");
    } else this.year = year;

    const dawn = this.dayT < 0.03 && this.time > 2;
    if (dawn && !this._dawned) {
      this._dawned = true;
      this.onDawn();
    }
    if (this.dayT > 0.2) this._dawned = false;
  }

  onDawn() {
    if (this.weather?.type === "hurricane" || this.weather?.type === "rain") return;
    if (this.seasonIndex === 3) return;
    const chance = this.seasonIndex === 1 ? 0.18 : 0.38;
    if (Math.random() < chance) {
      this.weather = { type: "rain", t: 0, dur: 9 + Math.random() * 8, eyeX: this.homeX, eyeY: this.homeY };
      this.log("Rain walks in from the hills.", "info");
    }
  }

  tickWeather(dt) {
    if (!this.weather) return;
    this.weather.t += dt;
    if (this.weather.type === "hurricane") {
      this.weather.angle += dt * 2.4;
      const eyeX = this.weather.eyeX;
      const eyeY = this.weather.eyeY;
      for (const v of this.villagers) {
        const dx = v.x - eyeX;
        const dy = v.y - eyeY;
        const d = Math.hypot(dx, dy) || 1;
        const falloff = 1 - Math.min(d, 320) / 320;
        const tx = -dy / d;
        const ty = dx / d;
        const wind = 42 * falloff;
        this.tryMove(v, (tx * wind + (dx / d) * 6) * dt, (ty * wind + (dy / d) * 6) * dt);
        v.energy = Math.max(0, v.energy - 2.2 * dt * (0.4 + falloff));
        if (falloff > 0.25) v.health -= 0.85 * dt;
      }
      if (Math.random() < dt * 2.2) {
        const s = this.structures[(Math.random() * this.structures.length) | 0];
        if (s) this.damageStructure(s, this.hasTech("stronger_shelter") ? 5 : 11, "hurricane");
      }
      if (Math.random() < dt * 8) {
        this.fx.push({
          x: eyeX + Math.cos(this.weather.angle) * (40 + Math.random() * 120),
          y: eyeY + Math.sin(this.weather.angle) * (24 + Math.random() * 70),
          vx: Math.cos(this.weather.angle + 1.2) * 30,
          vy: Math.sin(this.weather.angle + 1.2) * 30,
          life: 0.8,
          max: 0.8,
          color: "#d9d3c8",
          size: 2
        });
      }
    }
    if (this.weather.t >= this.weather.dur) {
      if (this.weather.type === "hurricane") this.resolveHurricane();
      this.weather = null;
    }
  }

  tryMove(v, dx, dy) {
    const nx = v.x + dx;
    const ny = v.y + dy;
    if (this.walkablePixel(nx, ny)) {
      v.x = nx;
      v.y = ny;
    } else if (this.walkablePixel(nx, v.y)) v.x = nx;
    else if (this.walkablePixel(v.x, ny)) v.y = ny;
  }

  tickFires(dt) {
    let any = false;
    const ignite = [];
    for (let i = 0; i < this.tiles.length; i++) {
      const t = this.tiles[i];
      if (t.fire <= 0) continue;
      any = true;
      t.fire -= dt * (t.res === "tree" ? 0.08 : 0.16);
      t.burned = Math.min(1, (t.burned || 0) + dt * 0.3);
      if (t.res === "tree" || t.res === "bush") {
        t.amount -= dt * 0.45;
        if (t.amount <= 0) {
          t.res = null;
          t.amount = 0;
          t.type = t.type === "water" || t.type === "rock" ? t.type : "path";
          this.terrainDirty = true;
        }
      }
      if (t.type === "farm") {
        t.growth = Math.max(0, t.growth - dt * 0.5);
      }
      if (t.fire > 0.45 && Math.random() < dt * 0.55) {
        const tx = i % this.w;
        const ty = (i / this.w) | 0;
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const [dx, dy] = dirs[(Math.random() * 4) | 0];
        ignite.push([tx + dx, ty + dy]);
      }
      if (t.fire < 0) t.fire = 0;
    }
    for (const [tx, ty] of ignite) {
      const n = this.getTile(tx, ty);
      if (!n || n.type === "water" || n.type === "rock") continue;
      if (n.res === "tree" || n.res === "bush" || Math.random() < 0.35) n.fire = Math.max(n.fire, 0.8);
    }
    for (const v of this.villagers) {
      const tile = this.getTileAtPixel(v.x, v.y);
      if (tile && tile.fire > 0.25) {
        v.health -= 7 * dt * (v.isChild ? 0.7 : 1);
        if (v.health <= 0) this.kill(v, "wildfire");
      }
    }
    for (const s of [...this.structures]) {
      const tile = this.getTile(s.tx, s.ty);
      if (tile?.fire > 0.5) this.damageStructure(s, 16 * dt, "wildfire");
    }
    if (this.fireSeen && !any) {
      this.fireSeen = false;
      this.terrainDirty = true;
      this.lastDisaster = "wildfire";
      this.natureScore += 2;
      this.godMemory = Math.max(this.godMemory, 18);
      this.addInsight("fire", 16, this.mostInventive());
      this.addInsight("shelter", 10, null);
      for (const v of this.villagers) {
        if (v.trait === "Devout") {
          v.urge = "faith";
          v.religionBelief = Math.min(100, v.religionBelief + 8);
          v.remember("The fire ran like an animal", this.year);
        } else if (Math.random() < 0.5) {
          v.urge = "shelter";
          v.remember("We need ground the flames will not eat", this.year);
        }
      }
      this.log("The wildfire dies. Survivors argue for stronger shelter.", "bad");
    }
  }

  tickResources(dt) {
    const spring = this.seasonIndex === 0;
    const winter = this.seasonIndex === 3;
    const rain = this.weather?.type === "rain" || this.weather?.type === "hurricane";
    for (const t of this.tiles) {
      if (t.res === "bush" && t.amount < t.max && t.fire <= 0) {
        t.regrow += dt * (spring ? 0.05 : 0.028) * (winter ? 0.25 : 1) * (rain ? 1.3 : 1);
        if (t.regrow >= 1) {
          t.amount++;
          t.regrow = 0;
        }
      }
      if (t.res === "tree" && t.amount <= 0) {
        t.regrow += dt * 0.025;
        if (t.regrow > 10) {
          t.amount = t.max || 3;
          t.regrow = 0;
        }
      }
      if (t.type === "farm" && t.fire <= 0) {
        let g = 0.02;
        if (spring) g *= 1.35;
        if (this.seasonIndex === 1) g *= 1.15;
        if (this.seasonIndex === 2) g *= 0.85;
        if (winter) g *= 0.22;
        if (t.nearWater) g *= this.hasTech("irrigation") ? 1.85 : 1.25;
        else if (this.hasTech("irrigation")) g *= 1.25;
        if (rain && this.weather?.type === "rain") g *= 1.35;
        if (this.hasTech("crop_rotation")) g *= 1.2;
        t.growth = Math.min(1.4, t.growth + g * dt);
      }
    }
  }

  tickPassiveInsight(dt) {
    for (const v of this.villagers) {
      if (v.isChild || v.dead) continue;
      if (v.trait === "Inventive") this.addInsight(v.urge || v.aptitude, 0.09 * dt, null);
      else if (v.trait === "Curious") this.addInsight(FIELDS[(v.id + (this.time | 0)) % FIELDS.length], 0.05 * dt, null);
    }
  }

  tickOverlaps() {
    const vs = this.villagers;
    for (let i = 0; i < vs.length; i++) {
      for (let j = i + 1; j < vs.length; j++) {
        const a = vs[i];
        const b = vs[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.001;
        const min = 11;
        if (d >= min) continue;
        const push = (min - d) / 2;
        dx /= d;
        dy /= d;
        if (a.job?.type !== "talk") this.tryMove(a, -dx * push, -dy * push);
        if (b.job?.type !== "talk") this.tryMove(b, dx * push, dy * push);
      }
    }
  }

  tickProjects() {
    for (const tribe of this.tribes) {
      if (this.villagers.some((v) => v.tribeId === tribe.id && v.migrating)) continue;
      const pop = this.tribePop(tribe.id);
      const huts = this.countStructures(tribe.id, ["hut", "longhouse"]);
      const pending = this.blueprints.filter((b) => b.tribeId === tribe.id).length;
      if (pending > 0) continue;
      if (this.hasTech("mud_huts") && huts < Math.ceil(pop / 3) && tribe.wood >= 10) {
        const site = this.findBuildSite(tribe, 2, 6);
        if (site) {
          tribe.wood -= 10;
          this.blueprints.push({ id: this.nextId++, type: "hut", tx: site.tx, ty: site.ty, tribeId: tribe.id, progress: 0 });
          continue;
        }
      }
      if (!this.structures.some((s) => s.tribeId === tribe.id && s.type === "campfire") && this.hasTech("campfire") && tribe.wood >= 6) {
        const site = this.findBuildSite(tribe, 0, 3);
        if (site) {
          tribe.wood -= 6;
          this.blueprints.push({ id: this.nextId++, type: "campfire", tx: site.tx, ty: site.ty, tribeId: tribe.id, progress: 0 });
          continue;
        }
      }
      if (this.religion && !this.structures.some((s) => s.tribeId === tribe.id && s.type === "shrine") && tribe.stone >= 6) {
        const site = this.findBuildSite(tribe, 2, 5);
        if (site) {
          tribe.stone -= 6;
          this.blueprints.push({ id: this.nextId++, type: "shrine", tx: site.tx, ty: site.ty, tribeId: tribe.id, progress: 0 });
          continue;
        }
      }
      if ((this.hasTech("kiln") || this.hasTech("bronze")) && !this.structures.some((s) => s.tribeId === tribe.id && s.type === "forge") && tribe.stone >= 8 && tribe.wood >= 4) {
        const site = this.findBuildSite(tribe, 2, 5);
        if (site) {
          tribe.stone -= 8;
          tribe.wood -= 4;
          this.blueprints.push({ id: this.nextId++, type: "forge", tx: site.tx, ty: site.ty, tribeId: tribe.id, progress: 0 });
          continue;
        }
      }
      if (this.hasTech("stone_walls") && this.countStructures(tribe.id, ["wall"]) < 5 && tribe.stone >= 4 && Math.random() < 0.5) {
        const site = this.findBuildSite(tribe, 3, 7);
        if (site) {
          tribe.stone -= 4;
          this.blueprints.push({ id: this.nextId++, type: "wall", tx: site.tx, ty: site.ty, tribeId: tribe.id, progress: 0 });
          continue;
        }
      }
      if (this.hasTech("carpentry") && !this.structures.some((s) => s.tribeId === tribe.id && s.type === "workbench") && tribe.wood >= 8 && tribe.stone >= 2) {
        const site = this.findBuildSite(tribe, 2, 5);
        if (site) {
          tribe.wood -= 8;
          tribe.stone -= 2;
          this.blueprints.push({ id: this.nextId++, type: "workbench", tx: site.tx, ty: site.ty, tribeId: tribe.id, progress: 0 });
          continue;
        }
      }
      if (this.hasTech("factories") && this.countStructures(tribe.id, ["factory"]) < 1 && tribe.wood >= 14 && tribe.stone >= 10) {
        const site = this.findBuildSite(tribe, 3, 7);
        if (site) {
          tribe.wood -= 14;
          tribe.stone -= 10;
          this.blueprints.push({ id: this.nextId++, type: "factory", tx: site.tx, ty: site.ty, tribeId: tribe.id, progress: 0 });
          continue;
        }
      }
      if (this.hasTech("reactors") && this.countStructures(tribe.id, ["reactor"]) < 1 && tribe.stone >= 20 && tribe.wood >= 12) {
        const site = this.findBuildSite(tribe, 4, 8);
        if (site) {
          tribe.wood -= 12;
          tribe.stone -= 20;
          this.blueprints.push({ id: this.nextId++, type: "reactor", tx: site.tx, ty: site.ty, tribeId: tribe.id, progress: 0 });
        }
      }
    }
  }

  findBuildSite(tribe, minR, maxR) {
    const home = this.worldToTile(tribe.homeX, tribe.homeY);
    for (let i = 0; i < 30; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = minR + Math.random() * (maxR - minR);
      const tx = home.tx + Math.round(Math.cos(ang) * rad);
      const ty = home.ty + Math.round(Math.sin(ang) * rad);
      const t = this.getTile(tx, ty);
      if (!t || (t.type !== "grass" && t.type !== "path" && t.type !== "sand" && t.type !== "barren")) continue;
      if (t.res || t.fire > 0) continue;
      if (this.structures.some((s) => s.tx === tx && s.ty === ty)) continue;
      if (this.blueprints.some((s) => s.tx === tx && s.ty === ty)) continue;
      return { tx, ty };
    }
    return null;
  }

  countStructures(tribeId, types) {
    return this.structures.filter((s) => s.tribeId === tribeId && types.includes(s.type)).length;
  }

  tribeMorale(tribeId) {
    const members = this.villagers.filter((v) => v.tribeId === tribeId && !v.dead);
    if (!members.length) return 0;
    return members.reduce((s, v) => s + v.mood, 0) / members.length;
  }

  tribeRelKey(a, b) {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  getTribeRel(a, b) {
    if (a === b) return 100;
    return this.tribeRelations[this.tribeRelKey(a, b)] ?? 0;
  }

  addTribeRel(a, b, delta) {
    if (a === b) return;
    const k = this.tribeRelKey(a, b);
    this.tribeRelations[k] = clamp((this.tribeRelations[k] ?? 0) + delta, -100, 100);
  }

  tickSplit() {
    if (this.splitCd > 0 || this.tribes.length >= 3) return;
    if (this.weather?.type === "hurricane") return;
    for (const tribe of [...this.tribes]) {
      const members = this.villagers.filter((v) => v.tribeId === tribe.id && !v.isChild && !v.migrating && v.age >= 16);
      if (members.length < 6) continue;
      const morale = this.tribeMorale(tribe.id);
      let malcontent = null;
      let worst = 0;
      for (const v of members) {
        let grudges = 0;
        for (const o of members) {
          if (o.id !== v.id && v.affinityTo(o.id) <= -25) grudges++;
        }
        if (grudges > worst) {
          worst = grudges;
          malcontent = v;
        }
      }
      // Hate clusters OR settlement harmony below 40%
      const lowMorale = morale < 40 && members.length >= 7;
      if (!malcontent && lowMorale) {
        malcontent = members.sort((a, b) => a.mood - b.mood)[0];
        worst = 2;
      }
      if (!malcontent || (worst < 2 && !lowMorale)) continue;
      if (!lowMorale && worst < 2) continue;
      const friends = members.filter((o) => o.id !== malcontent.id && (
        malcontent.affinityTo(o.id) >= 18 || (lowMorale && o.mood < 45)
      ));
      const leaving = [malcontent, ...friends].slice(0, lowMorale ? 5 : 4);
      if (members.length - leaving.length < 3) continue;
      const site = this.sampleFarTile(tribe);
      if (!site) continue;
      this.foundTribe(tribe, leaving, site);
      this.addTribeRel(tribe.id, this.tribes[this.tribes.length - 1].id, lowMorale ? -25 : -40);
      this.log(lowMorale
        ? `Low harmony splits ${tribe.name} — pioneers leave for a colder fire.`
        : `Hate kindles a schism from ${tribe.name}.`, "bad");
      return;
    }
  }

  sampleFarTile(fromTribe) {
    let best = null;
    let bestD = 0;
    for (let i = 0; i < 50; i++) {
      const tx = 3 + ((Math.random() * (this.w - 6)) | 0);
      const ty = 3 + ((Math.random() * (this.h - 6)) | 0);
      const t = this.getTile(tx, ty);
      if (!t || t.type !== "grass" || t.res) continue;
      const c = this.tileCenter(tx, ty);
      let minD = Infinity;
      for (const tr of this.tribes) minD = Math.min(minD, Math.hypot(tr.homeX - c.x, tr.homeY - c.y));
      if (minD > 220 && minD > bestD) {
        bestD = minD;
        best = { tx, ty, x: c.x, y: c.y };
      }
    }
    return best;
  }

  foundTribe(oldTribe, members, site) {
    const prefix = TRIBE_PREFIX[(Math.random() * TRIBE_PREFIX.length) | 0];
    const tribe = {
      id: this.nextTribe++,
      name: `${prefix}kin`,
      color: TRIBE_COLORS[this.tribes.length % TRIBE_COLORS.length],
      homeX: site.x,
      homeY: site.y,
      food: Math.max(2, Math.round(oldTribe.food * 0.3)),
      wood: Math.max(2, Math.round(oldTribe.wood * 0.3)),
      stone: Math.max(0, Math.round(oldTribe.stone * 0.3)),
      gold: Math.max(0, Math.round((oldTribe.gold || 0) * 0.25)),
      gas: 0,
      expect: members.length,
      arrived: 0,
      announced: false,
      leaderId: members[0]?.id ?? null,
      isNation: false,
      nationName: null,
      govTitle: "Elder",
      atWarWith: []
    };
    oldTribe.food -= tribe.food;
    oldTribe.wood -= tribe.wood;
    oldTribe.stone -= tribe.stone;
    this.tribes.push(tribe);
    this.structures.push({
      id: this.nextId++,
      type: "campfire",
      tx: site.tx,
      ty: site.ty,
      tribeId: tribe.id,
      hp: 60,
      maxHp: 60
    });
    for (const v of members) {
      v.tribeId = tribe.id;
      v.migrating = true;
      v.job = null;
      v.remember("We left the old fire", this.year);
    }
    this.splitCd = 110;
    this.log(`A schism. ${members.map((m) => m.displayName).join(", ")} become the ${tribe.name}.`, "info");
    // New tribe starts cool toward parent
    this.addTribeRel(oldTribe.id, tribe.id, -30);
  }

  tickFactionMissions(dt) {
    if (this.tribes.length < 2) return;
    this.factionAcc = (this.factionAcc || 0) + dt;
    // Advance active missions
    for (const m of this.factionMissions) {
      m.t -= dt;
      if (m.t > 0) continue;
      const from = this.tribeOf(m.fromId);
      const to = this.tribeOf(m.toId);
      if (!from || !to) {
        m.done = true;
        continue;
      }
      if (m.type === "trade") {
        const give = Math.min(4, Math.floor(from.food * 0.15));
        const wood = Math.min(3, Math.floor(from.wood * 0.12));
        from.food -= give;
        from.wood -= wood;
        to.food += give + 1;
        to.wood += wood;
        this.addTribeRel(from.id, to.id, 12);
        this.log(`${from.name} traders reach ${to.name} (+${give} food).`, "good");
        this.float(to.homeX, to.homeY - 20, "trade", "#8fd0a4");
      } else if (m.type === "raid") {
        const steal = Math.min(6, Math.floor(to.food * 0.2) + 1);
        to.food = Math.max(0, to.food - steal);
        from.food += Math.floor(steal * 0.7);
        this.addTribeRel(from.id, to.id, -22);
        // Injure a defender
        const victim = this.villagers.find((v) => v.tribeId === to.id && !v.dead && !v.isChild);
        if (victim) {
          victim.injure("Torso", 12 + Math.random() * 10, this);
          victim.safetyNeed = Math.max(0, victim.safetyNeed - 25);
          victim.remember(`Raided by ${from.name}`, this.year);
        }
        this.log(`${from.name} raids ${to.name} — ${steal} food taken.`, "bad");
        this.float(to.homeX, to.homeY - 20, "raid!", "#e07a62");
      } else if (m.type === "gold_trade") {
        const g = Math.min(3, Math.floor((from.gold || 0) * 0.25) + 1);
        const food = Math.min(5, Math.floor(to.food * 0.1) + 1);
        from.gold = Math.max(0, (from.gold || 0) - g);
        to.gold = (to.gold || 0) + g;
        to.food = Math.max(0, to.food - food);
        from.food += food;
        this.addTribeRel(from.id, to.id, 16);
        this.log(`${from.name} exchange ${g} gold for ${food} food with ${to.name}.`, "good");
        this.float(to.homeX, to.homeY - 20, "gold↔", "#f0d78c");
      }
      m.done = true;
    }
    this.factionMissions = this.factionMissions.filter((m) => !m.done);
    if (this.factionAcc < 18) return;
    this.factionAcc = 0;
    if (this.factionMissions.length >= 2) return;
    const a = this.tribes[(Math.random() * this.tribes.length) | 0];
    const others = this.tribes.filter((t) => t.id !== a.id);
    if (!others.length) return;
    const b = others[(Math.random() * others.length) | 0];
    const rel = this.getTribeRel(a.id, b.id);
    const atWar = a.atWarWith?.includes(b.id) || b.atWarWith?.includes(a.id);
    let type = "trade";
    if (atWar) type = "raid";
    else if ((a.isNation || b.isNation) && ((a.gold || 0) > 2 || (b.gold || 0) > 2) && rel > -5 && Math.random() < 0.45) type = "gold_trade";
    else if (rel > 10 || (rel > -20 && Math.random() < 0.55)) type = "trade";
    else type = "raid";
    if (type === "trade" && a.food < 4) return;
    if (type === "raid" && this.villagers.filter((v) => v.tribeId === a.id && !v.isChild).length < 3) return;
    if (type === "gold_trade" && (a.gold || 0) < 1) type = "trade";
    this.factionMissions.push({ type, fromId: a.id, toId: b.id, t: 6 + Math.random() * 5 });
    const label = type === "gold_trade" ? "gold merchants" : type === "trade" ? "a trading caravan" : "a war band";
    this.log(`${a.nationName || a.name} send ${label} toward ${b.nationName || b.name}.`, type === "raid" ? "bad" : "info");
  }

  tickNations(dt) {
    this.nationAcc = (this.nationAcc || 0) + dt;
    if (this.nationAcc < 10) return;
    this.nationAcc = 0;
    for (const tribe of this.tribes) {
      tribe.gold = tribe.gold ?? 0;
      tribe.gas = tribe.gas ?? 0;
      tribe.atWarWith = tribe.atWarWith || [];
      const pop = this.villagers.filter((v) => v.tribeId === tribe.id && !v.dead).length;
      // Form a nation when large + cultured enough
      if (!tribe.isNation && pop >= 9 && (this.hasTech("writing") || this.hasTech("laws") || this.eraIndex(this.era) >= 1)) {
        tribe.isNation = true;
        const root = tribe.name.replace(/kin$/i, "") || "Ash";
        const suf = NATION_SUFFIX[(Math.random() * NATION_SUFFIX.length) | 0];
        tribe.nationName = `${root}${suf}`;
        tribe.govTitle = this.eraIndex(this.era) >= 3 ? "President" : this.eraIndex(this.era) >= 2 ? "King" : "Chief";
        this.ensureLeader(tribe);
        const leader = this.villagerById(tribe.leaderId);
        this.log(`${tribe.name} becomes the nation of ${tribe.nationName}. ${leader?.displayName || "A leader"} is named ${tribe.govTitle}.`, "god");
        this.float(tribe.homeX, tribe.homeY - 24, tribe.nationName, tribe.color);
        this.sfx.push("era");
      }
      // Upgrade title with era
      if (tribe.isNation) {
        const want = this.eraIndex(this.era) >= 3 ? "President" : this.eraIndex(this.era) >= 2 ? "King" : "Chief";
        if (tribe.govTitle !== want && this.eraIndex(this.era) >= 3) {
          tribe.govTitle = "President";
          this.holdElection(tribe);
        } else if (tribe.govTitle === "Chief" && this.eraIndex(this.era) >= 2) {
          tribe.govTitle = "King";
          this.log(`${tribe.nationName || tribe.name} crowns a ${tribe.govTitle}.`, "god");
        }
      }
      // Autonomously place mines / gas wells
      if (pop >= 6 && tribe.wood >= 6 && tribe.stone >= 6 && !this.structures.some((s) => s.tribeId === tribe.id && s.type === "mine")) {
        const ore = this.findOreNear(tribe, "gold");
        if (ore && Math.random() < 0.4) {
          this.blueprints.push({
            id: this.nextId++, type: "mine", tx: ore.tx, ty: ore.ty, tribeId: tribe.id, progress: 0
          });
          tribe.wood -= 4;
          tribe.stone -= 4;
        }
      }
      if (this.eraIndex(this.era) >= 3 && pop >= 8 && tribe.stone >= 8
        && !this.structures.some((s) => s.tribeId === tribe.id && s.type === "gaswell")) {
        const gas = this.findOreNear(tribe, "gas");
        if (gas && Math.random() < 0.35) {
          this.blueprints.push({
            id: this.nextId++, type: "gaswell", tx: gas.tx, ty: gas.ty, tribeId: tribe.id, progress: 0
          });
          tribe.wood -= 4;
          tribe.stone -= 6;
        }
      }
    }
  }

  findOreNear(tribe, res) {
    const home = this.worldToTile(tribe.homeX, tribe.homeY);
    let best = null;
    let bestD = Infinity;
    for (let ty = 0; ty < this.h; ty++) {
      for (let tx = 0; tx < this.w; tx++) {
        const t = this.getTile(tx, ty);
        if (!t || t.res !== res) continue;
        if (this.structures.some((s) => s.tx === tx && s.ty === ty)) continue;
        const d = Math.hypot(tx - home.tx, ty - home.ty);
        if (d < bestD && d < 28) {
          bestD = d;
          best = { tx, ty };
        }
      }
    }
    return best;
  }

  ensureLeader(tribe) {
    if (tribe.leaderId && this.villagerById(tribe.leaderId) && !this.villagerById(tribe.leaderId).dead) return;
    const candidates = this.villagers.filter((v) => v.tribeId === tribe.id && !v.dead && !v.isChild);
    if (!candidates.length) {
      tribe.leaderId = null;
      return;
    }
    candidates.sort((a, b) =>
      (b.skills?.lead || 0) - (a.skills?.lead || 0)
      || (b.boldnessScore + b.empathyScore) - (a.boldnessScore + a.empathyScore)
      || b.age - a.age
    );
    tribe.leaderId = candidates[0].id;
    candidates[0].gainSkill?.("lead", 8);
  }

  holdElection(tribe) {
    const adults = this.villagers.filter((v) => v.tribeId === tribe.id && !v.dead && !v.isChild && v.age >= 18);
    if (adults.length < 2) return;
    // Popularity = lead skill + empathy + age + random
    const scored = adults.map((v) => ({
      v,
      score: (v.skills?.lead || 0) * 2 + v.empathyScore + v.age * 0.5 + Math.random() * 30 + (v.intelligence / 5)
    })).sort((a, b) => b.score - a.score);
    const winner = scored[0].v;
    const prev = this.villagerById(tribe.leaderId);
    tribe.leaderId = winner.id;
    tribe.govTitle = "President";
    winner.gainSkill?.("lead", 12);
    winner.remember(`Elected President of ${tribe.nationName || tribe.name}`, this.year);
    this.log(`${winner.displayName} is elected President of ${tribe.nationName || tribe.name}${prev && prev.id !== winner.id ? ` (succeeding ${prev.name})` : ""}.`, "god");
    this.float(winner.x, winner.y - 20, "President", "#f0d78c");
  }

  tickWars(dt) {
    this.warAcc = (this.warAcc || 0) + dt;
    // Resolve ongoing wars
    for (const w of this.wars) {
      w.t -= dt;
      w.clashAcc = (w.clashAcc || 0) + dt;
      if (w.clashAcc > 4) {
        w.clashAcc = 0;
        this.resolveWarClash(w);
      }
      if (w.t <= 0) this.endWar(w, "stalemate");
    }
    this.wars = this.wars.filter((w) => !w.done);
    if (this.warAcc < 22 || this.tribes.length < 2) return;
    this.warAcc = 0;
    // Chance to declare war between hostile nations/tribes
    for (const a of this.tribes) {
      for (const b of this.tribes) {
        if (a.id >= b.id) continue;
        if (a.atWarWith?.includes(b.id)) continue;
        const rel = this.getTribeRel(a.id, b.id);
        const popA = this.villagers.filter((v) => v.tribeId === a.id && !v.isChild).length;
        const popB = this.villagers.filter((v) => v.tribeId === b.id && !v.isChild).length;
        if (popA < 4 || popB < 4) continue;
        if (rel < -35 && Math.random() < 0.35) {
          this.declareWar(a, b);
          return;
        }
        if ((a.isNation && b.isNation) && rel < -15 && Math.random() < 0.15) {
          this.declareWar(a, b);
          return;
        }
      }
    }
  }

  declareWar(a, b) {
    a.atWarWith = a.atWarWith || [];
    b.atWarWith = b.atWarWith || [];
    if (!a.atWarWith.includes(b.id)) a.atWarWith.push(b.id);
    if (!b.atWarWith.includes(a.id)) b.atWarWith.push(a.id);
    this.addTribeRel(a.id, b.id, -30);
    this.wars.push({ a: a.id, b: b.id, t: 40 + Math.random() * 30, clashAcc: 0, done: false });
    const na = a.nationName || a.name;
    const nb = b.nationName || b.name;
    this.log(`War! ${na} and ${nb} take up arms.`, "bad");
    this.toast = { text: `War: ${na} vs ${nb}`, life: 5 };
    this.sfx.push("storm");
  }

  resolveWarClash(w) {
    const a = this.tribeOf(w.a);
    const b = this.tribeOf(w.b);
    if (!a || !b) {
      w.done = true;
      return;
    }
    const fightersA = this.villagers.filter((v) => v.tribeId === a.id && !v.dead && !v.isChild && v.age >= 16);
    const fightersB = this.villagers.filter((v) => v.tribeId === b.id && !v.dead && !v.isChild && v.age >= 16);
    if (!fightersA.length || !fightersB.length) {
      this.endWar(w, !fightersA.length ? "b" : "a");
      return;
    }
    const fa = fightersA[(Math.random() * fightersA.length) | 0];
    const fb = fightersB[(Math.random() * fightersB.length) | 0];
    // March toward enemy
    const midX = (a.homeX + b.homeX) / 2;
    const midY = (a.homeY + b.homeY) / 2;
    fa.x += (midX - fa.x) * 0.15;
    fa.y += (midY - fa.y) * 0.15;
    fb.x += (midX - fb.x) * 0.15;
    fb.y += (midY - fb.y) * 0.15;
    fa.taskLabel = `At war with ${b.nationName || b.name}`;
    fb.taskLabel = `At war with ${a.nationName || a.name}`;
    const powA = 10 + (fa.skills?.combat || 0) * 0.4 + fa.boldnessScore * 0.05 + (this.hasTech("iron") ? 8 : 0);
    const powB = 10 + (fb.skills?.combat || 0) * 0.4 + fb.boldnessScore * 0.05 + (this.hasTech("iron") ? 8 : 0);
    const dmgA = 6 + Math.random() * powA * 0.4;
    const dmgB = 6 + Math.random() * powB * 0.4;
    fa.health -= dmgB;
    fb.health -= dmgA;
    fa.gainSkill?.("combat", 2);
    fb.gainSkill?.("combat", 2);
    fa.injure?.(Math.random() < 0.5 ? "LeftArm" : "Torso", dmgB * 0.4, this);
    fb.injure?.(Math.random() < 0.5 ? "RightArm" : "Torso", dmgA * 0.4, this);
    this.float(midX, midY - 10, "clash", "#e07a62");
    if (fa.health <= 0) this.kill(fa, "wounds");
    if (fb.health <= 0) this.kill(fb, "wounds");
    // Steal gold on clash
    if (Math.random() < 0.3 && (b.gold || 0) > 0) {
      const g = 1;
      b.gold -= g;
      a.gold = (a.gold || 0) + g;
    }
    const leftA = this.villagers.filter((v) => v.tribeId === a.id && !v.dead && !v.isChild).length;
    const leftB = this.villagers.filter((v) => v.tribeId === b.id && !v.dead && !v.isChild).length;
    if (leftA < 2) this.endWar(w, "b");
    else if (leftB < 2) this.endWar(w, "a");
  }

  endWar(w, winner) {
    w.done = true;
    const a = this.tribeOf(w.a);
    const b = this.tribeOf(w.b);
    if (a) a.atWarWith = (a.atWarWith || []).filter((id) => id !== w.b);
    if (b) b.atWarWith = (b.atWarWith || []).filter((id) => id !== w.a);
    if (winner === "stalemate") {
      this.addTribeRel(w.a, w.b, 8);
      this.log(`War ends in exhaustion between ${a?.nationName || a?.name} and ${b?.nationName || b?.name}.`, "info");
      return;
    }
    const win = winner === "a" ? a : b;
    const lose = winner === "a" ? b : a;
    if (win && lose) {
      const loot = Math.floor((lose.food || 0) * 0.25);
      lose.food = Math.max(0, lose.food - loot);
      win.food += loot;
      win.gold = (win.gold || 0) + Math.floor((lose.gold || 0) * 0.4);
      lose.gold = Math.floor((lose.gold || 0) * 0.6);
      this.addTribeRel(win.id, lose.id, -10);
      this.log(`${win.nationName || win.name} wins the war against ${lose.nationName || lose.name}.`, "bad");
    }
  }

  tickEconomy(dt) {
    this.economyAcc = (this.economyAcc || 0) + dt;
    // Mines and gas wells produce slowly
    for (const s of this.structures) {
      const tribe = this.tribeOf(s.tribeId);
      if (!tribe) continue;
      if (s.type === "mine") {
        tribe.gold = (tribe.gold || 0) + 0.08 * dt;
        const t = this.getTile(s.tx, s.ty);
        if (t?.res === "gold" && Math.random() < dt * 0.1) {
          t.amount = Math.max(0, t.amount - 1);
          tribe.gold += 0.5;
          if (t.amount <= 0) t.res = null;
        }
      }
      if (s.type === "gaswell" && this.eraIndex(this.era) >= 3) {
        tribe.gas = (tribe.gas || 0) + 0.1 * dt;
        const t = this.getTile(s.tx, s.ty);
        if (t?.res === "gas" && Math.random() < dt * 0.08) {
          t.amount = Math.max(0, t.amount - 1);
          tribe.gas += 0.6;
          if (t.amount <= 0) t.res = null;
        }
      }
    }
    if (this.economyAcc < 12) return;
    this.economyAcc = 0;
    // Local markets: skilled traders convert surplus food ↔ gold
    for (const tribe of this.tribes) {
      const trader = this.villagers.find((v) =>
        v.tribeId === tribe.id && !v.dead && (v.skills?.trade || 0) > 15
      );
      if (!trader) continue;
      if (tribe.food > this.tribePop(tribe.id) * 3 && Math.random() < 0.5) {
        tribe.food -= 2;
        tribe.gold = (tribe.gold || 0) + 1;
        trader.gainSkill?.("trade", 1.5);
        trader.personalGold = (trader.personalGold || 0) + 0.2;
      } else if ((tribe.gold || 0) > 3 && tribe.food < this.tribePop(tribe.id) && Math.random() < 0.5) {
        tribe.gold -= 1;
        tribe.food += 3;
        trader.gainSkill?.("trade", 1.5);
      }
    }
  }

  /** Soft autonomy — civilization doesn't wait on the player. */
  tickAutonomousGod(dt) {
    // Inventors push tech without Inspiration
    if (Math.random() < dt * 0.04) {
      const mind = this.villagers
        .filter((v) => !v.dead && !v.isChild && (v.trait === "Inventive" || v.intelligence > 120 || (v.skills?.craft || 0) > 30))
        .sort((a, b) => b.intelligence - a.intelligence)[0];
      if (mind) {
        const field = mind.aptitude || "tools";
        const boost = 0.8 + (mind.skills?.craft || 0) * 0.02 + mind.intelligence / 200;
        this.addInsight(field, boost, mind);
        mind.gainSkill?.("craft", 0.4);
      }
    }
    // Unanswered prayers slowly harden into self-reliance (not total ignore despair)
    if (this.prayerRequest && this.prayerRequest.t < 8 && Math.random() < dt * 0.15) {
      const v = this.villagerById(this.prayerRequest.familyIds?.[0]);
      if (v) {
        v.shiftPersonality?.(0, 2, 0, -2, "Learned to endure unanswered", this);
        v.gainSkill?.("lead", 1);
      }
    }
    // Periodic elections for presidential nations
    if (Math.random() < dt * 0.008) {
      for (const t of this.tribes) {
        if (t.govTitle === "President" && Math.random() < 0.4) this.holdElection(t);
      }
    }
  }

  tickOfferings(dt) {
    // Soft prompt: if shrine has offerings, nudge player via toast occasionally
    for (const s of this.structures) {
      if (s.type !== "shrine" || !s.offerings) continue;
      const total = (s.offerings.food || 0) + (s.offerings.wood || 0) + (s.offerings.stone || 0);
      if (total >= 3 && Math.random() < dt * 0.02 && !this.toast) {
        this.toast = { text: "Offerings wait on the shrine — Bless near it to accept", life: 4 };
      }
    }
  }

  collectOfferingsNear(x, y) {
    let collected = false;
    for (const s of this.structures) {
      if (s.type !== "shrine" || !s.offerings) continue;
      const c = this.tileCenter(s.tx, s.ty);
      if (Math.hypot(c.x - x, c.y - y) > 48) continue;
      const o = s.offerings;
      const total = (o.food || 0) + (o.wood || 0) + (o.stone || 0);
      if (total <= 0) continue;
      // God "accepts" — remove offerings, boost faith
      s.offerings = { food: 0, wood: 0, stone: 0 };
      collected = true;
      this.godScore += 3;
      this.witness(c.x, c.y, 100, (v) => {
        v.religionBelief = Math.min(100, v.religionBelief + 14);
        v.shiftPersonality?.(3, 0, 2, 10, "God accepted our sacrifice", this);
        v.prayerBuffT = Math.max(v.prayerBuffT, 16);
        v.remember("God accepted our sacrifice", this.year);
        v.logInfluence?.("Sacrifice accepted", this.year);
      });
      this.burst(c.x, c.y - 8, "#f0d78c", 16);
      this.float(c.x, c.y - 20, "accepted", "#f0d78c");
      this.log("You accept the offerings on the shrine. Faith blooms.", "god");
    }
    return collected;
  }

  migrantArrived(v) {
    v.migrating = false;
    const tribe = this.tribeOf(v.tribeId);
    if (!tribe || tribe.announced) return;
    tribe.arrived = (tribe.arrived || 0) + 1;
    if (tribe.arrived >= tribe.expect) {
      tribe.announced = true;
      this.log(`${tribe.name} raise a fire of their own.`, "good");
    }
  }

  tickReligion() {
    const devouts = this.villagers.filter((v) => v.trait === "Devout" && !v.isChild);
    if (!this.religion) {
      if (!devouts.length) return;
      const avg = this.villagers.reduce((s, v) => s + v.religionBelief, 0) / this.villagers.length;
      const sparked = devouts.some((v) => v.religionBelief > 60);
      if (avg > 46 || sparked) {
        const deity = this.godScore >= this.natureScore ? "player" : "nature";
        const names = deity === "player"
          ? ["The Open Palm", "Watchers Above", "The Unseen Hearth"]
          : ["The Root Circle", "Storm and Seed", "The Green Silence"];
        const founder = devouts.sort((a, b) => b.religionBelief - a.religionBelief)[0];
        this.religion = {
          name: names[(Math.random() * names.length) | 0],
          deity,
          founderId: founder.id,
          foundedYear: this.year
        };
        founder.remember(
          deity === "player" ? "I gave a name to the hand that watches" : "The grove answered, so I listened",
          this.year
        );
        founder.ideaTimer = Math.max(founder.ideaTimer, 3);
        this.addInsight("faith", 14, founder);
        const who = deity === "player" ? "you" : "the wild itself";
        this.log(`${founder.name} founds ${this.religion.name}, a faith aimed at ${who}.`, "god");
        this.sfx.push("discover");
      }
      return;
    }
    for (const v of this.villagers) {
      if (v.religionBelief > 35) v.religionBelief = Math.min(100, v.religionBelief + 0.4);
    }
  }

  hazardAt(x, y) {
    if (this.weather?.type === "hurricane") return "hurricane";
    const t = this.getTileAtPixel(x, y);
    if (t?.fire > 0.3) return "fire";
    return null;
  }

  threatPoint(x, y) {
    if (this.weather?.type === "hurricane") return { x: this.weather.eyeX, y: this.weather.eyeY };
    const t = this.worldToTile(x, y);
    for (let r = 0; r < 6; r++) {
      for (let y2 = -r; y2 <= r; y2++) {
        for (let x2 = -r; x2 <= r; x2++) {
          if ((this.getTile(t.tx + x2, t.ty + y2)?.fire || 0) > 0.3) {
            return this.tileCenter(t.tx + x2, t.ty + y2);
          }
        }
      }
    }
    return { x, y };
  }

  nearCampfire(x, y, tribeId) {
    return this.structures.some((s) => s.type === "campfire" && s.tribeId === tribeId && Math.hypot(s.tx * this.tile + 8 - x, s.ty * this.tile + 8 - y) < 30);
  }

  campTile(tribeId) {
    const s = this.structures.find((st) => st.tribeId === tribeId && st.type === "campfire")
      || this.structures.find((st) => st.tribeId === tribeId);
    return s ? { tx: s.tx, ty: s.ty } : null;
  }

  shrineTile(tribeId) {
    const s = this.structures.find((st) => st.tribeId === tribeId && st.type === "shrine");
    return s ? { tx: s.tx, ty: s.ty } : null;
  }

  nearestStructure(v, types) {
    let best = null;
    let d = Infinity;
    for (const s of this.structures) {
      if (s.tribeId !== v.tribeId || !types.includes(s.type)) continue;
      const c = this.tileCenter(s.tx, s.ty);
      const dd = Math.hypot(c.x - v.x, c.y - v.y);
      if (dd < d) {
        d = dd;
        best = s;
      }
    }
    return best;
  }

  nearestBlueprint(v) {
    let best = null;
    let d = Infinity;
    for (const b of this.blueprints) {
      if (b.tribeId !== v.tribeId) continue;
      const c = this.tileCenter(b.tx, b.ty);
      const dd = Math.hypot(c.x - v.x, c.y - v.y);
      if (dd < d) {
        d = dd;
        best = b;
      }
    }
    return best;
  }

  blueprintById(id) {
    return this.blueprints.find((b) => b.id === id) || null;
  }

  findResource(v, types, radius) {
    const here = this.worldToTile(v.x, v.y);
    let best = null;
    let bestD = Infinity;
    for (let r = 0; r <= radius; r++) {
      for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
          if (r > 0 && Math.max(Math.abs(x), Math.abs(y)) !== r) continue;
          const tile = this.getTile(here.tx + x, here.ty + y);
          if (!tile || !types.includes(tile.res) || tile.amount <= 0 || tile.fire > 0.2) continue;
          const d = x * x + y * y;
          if (d < bestD) {
            bestD = d;
            best = tile;
            best.tx = here.tx + x;
            best.ty = here.ty + y;
          }
        }
      }
      if (best && r > 2) break;
    }
    return best;
  }

  findRipeFarm(v) {
    const here = this.worldToTile(v.x, v.y);
    let best = null;
    let d = Infinity;
    for (let y = -12; y <= 12; y++) {
      for (let x = -12; x <= 12; x++) {
        const t = this.getTile(here.tx + x, here.ty + y);
        if (!t || t.type !== "farm" || t.growth < 1 || t.fire > 0) continue;
        const dd = x * x + y * y;
        if (dd < d) {
          d = dd;
          best = { tx: here.tx + x, ty: here.ty + y };
        }
      }
    }
    return best;
  }

  findFarmSite(v) {
    const here = this.worldToTile(v.x, v.y);
    let best = null;
    let score = -Infinity;
    for (let y = -10; y <= 10; y++) {
      for (let x = -10; x <= 10; x++) {
        const tx = here.tx + x;
        const ty = here.ty + y;
        const t = this.getTile(tx, ty);
        if (!t || t.type !== "grass" || t.res || t.fire > 0) continue;
        if (this.structures.some((s) => Math.abs(s.tx - tx) + Math.abs(s.ty - ty) < 2)) continue;
        let s = (t.nearWater ? 20 : 0) - (x * x + y * y) * 0.05;
        if (s > score) {
          score = s;
          best = { tx, ty };
        }
      }
    }
    return best;
  }

  farmCount(tribeId) {
    const home = this.tribeOf(tribeId);
    if (!home) return 0;
    const c = this.worldToTile(home.homeX, home.homeY);
    let n = 0;
    for (let y = -14; y <= 14; y++) {
      for (let x = -14; x <= 14; x++) {
        if (this.getTile(c.tx + x, c.ty + y)?.type === "farm") n++;
      }
    }
    return n;
  }

  harvest(v, tx, ty, personal) {
    const tile = this.getTile(tx, ty);
    if (!tile || tile.amount <= 0) return;
    const tribe = this.tribeOf(v.tribeId);
    const bronze = this.hasTech("bronze") ? 1 : 0;
    const iron = this.hasTech("iron") ? 1 : 0;
    const bonus = iron ? 2 : bronze ? 1 : 0;
    if (tile.res === "bush" || tile.res === "manna") {
      const wasManna = tile.res === "manna";
      const yieldFood = (wasManna ? 3 : 2) + (personal ? 0 : bonus);
      tile.amount -= 1;
      if (wasManna && tile.amount <= 0) {
        tile.res = null;
        tile.amount = 0;
      }
      if (personal) {
        v.hunger = Math.max(0, v.hunger - 28 * (tile.res === "manna" ? 1.4 : 1));
      } else if (tribe) tribe.food += yieldFood;
      const near = tile.nearWater;
      this.addInsight("food", near ? 2.1 : 1.4, v);
      if (wasManna || (personal && this.godMemory > 0)) {
        const saved = this.weather?.type === "hurricane" || (this.lastDisaster === "hurricane" && this.godMemory > 0);
        v.remember(saved ? "Saved by God from Hurricane" : "Food fell from a silent sky", this.year);
        v.religionBelief = Math.min(100, v.religionBelief + (wasManna ? 12 : 4));
        this.godScore += 1;
      }
      this.burst(v.x, v.y, "#d4555a", 5);
      this.float(v.x, v.y - 12, personal ? "ate" : `+${yieldFood} food`, "#d7c4a2");
    } else if (tile.res === "tree") {
      tile.amount -= 1;
      const wood = 2 + bonus;
      if (tribe) tribe.wood += wood;
      this.addInsight("shelter", 1.3, v);
      this.addInsight("tools", 0.4, v);
      this.burst(v.x, v.y - 4, "#8d5a32", 7);
      this.float(v.x, v.y - 12, `+${wood} wood`, "#c4a07a");
      if (tile.amount <= 0) {
        tile.regrow = 0;
        this.markDeforestation(tx, ty);
      }
    } else if (tile.res === "stone") {
      tile.amount -= 1;
      const stone = 1 + (bonus > 0 ? 1 : 0);
      if (tribe) tribe.stone += stone;
      this.addInsight("tools", 1.8, v);
      v.gainSkill?.("mine", 1.2);
      this.burst(v.x, v.y, "#9aa0a6", 6);
      this.float(v.x, v.y - 12, `+${stone} stone`, "#d5d7dc");
      if (tile.amount <= 0) tile.res = null;
    } else if (tile.res === "gold") {
      tile.amount -= 1;
      const g = 1 + ((v.skills?.mine || 0) > 40 ? 1 : 0);
      if (tribe) tribe.gold = (tribe.gold || 0) + g + 1;
      v.personalGold = (v.personalGold || 0) + 0.3;
      v.gainSkill?.("mine", 2);
      this.addInsight("tools", 1.2, v);
      this.burst(v.x, v.y, "#f0d78c", 8);
      this.float(v.x, v.y - 12, `+gold`, "#f0d78c");
      if (tile.amount <= 0) tile.res = null;
    } else if (tile.res === "gas") {
      tile.amount -= 1;
      if (tribe) tribe.gas = (tribe.gas || 0) + 1 + (this.hasTech("steam") ? 1 : 0);
      v.gainSkill?.("mine", 1.5);
      this.addInsight("fire", 1.4, v);
      this.burst(v.x, v.y, "#9aa3ad", 6);
      this.float(v.x, v.y - 12, `+gas`, "#a8b0b8");
      if (tile.amount <= 0) tile.res = null;
    }
    if (tile.res === "bush" || tile.res === "manna") v.gainSkill?.("forage", 1);
    if (tile.res === "tree") v.gainSkill?.("craft", 0.8);
  }

  harvestFarm(v, tx, ty) {
    const tile = this.getTile(tx, ty);
    if (!tile || tile.type !== "farm" || tile.growth < 1) return;
    const tribe = this.tribeOf(v.tribeId);
    const amount = this.hasTech("crop_rotation") ? 7 : this.hasTech("irrigation") ? 6 : 5;
    tile.growth = 0;
    if (tribe) tribe.food += amount;
    this.addInsight("food", tile.nearWater ? 2.4 : 1.6, v);
    v.gainSkill?.("farm", 1.5);
    this.float(v.x, v.y - 12, `+${amount} food`, "#b7d48a");
    this.burst(v.x, v.y, "#d6c36a", 5);
  }

  tillFarm(v, tx, ty) {
    const tile = this.getTile(tx, ty);
    if (!tile || tile.type !== "grass" || tile.res) return;
    tile.type = "farm";
    tile.growth = 0;
    this.terrainDirty = true;
    this.addInsight("food", tile.nearWater ? 2.2 : 1.2, v);
    v.remember("Planted a promise in the dirt", this.year);
    this.float(v.x, v.y - 12, "tilled", "#c4a07a");
  }

  finishBlueprint(bp, v) {
    this.blueprints = this.blueprints.filter((b) => b.id !== bp.id);
    const hpMap = {
      wall: 150,
      mine: 120,
      gaswell: 100,
      hut: this.hasTech("stronger_shelter") ? 170 : 110,
      shrine: 90,
      storage: 120,
      research: 100,
      well: 95,
      workbench: 110,
      factory: 160,
      reactor: 200
    };
    const hp = hpMap[bp.type] || 80;
    this.structures.push({
      id: this.nextId++,
      type: bp.type,
      tx: bp.tx,
      ty: bp.ty,
      tribeId: bp.tribeId,
      hp,
      maxHp: hp,
      meltdown: false
    });
    this.log(`${v ? v.name : "The people"} finish a ${bp.type}.`, "good");
    if (v) v.remember(`Raised a ${bp.type}`, this.year);
    this.sfx.push("build");
  }

  damageStructure(s, amount, cause) {
    s.hp -= amount;
    if (s.hp > 0) return;
    this.structures = this.structures.filter((x) => x.id !== s.id);
    const label = s.type === "campfire" ? "The campfire gutters out" : `A ${s.type} comes apart`;
    this.log(`${label} in the ${cause}.`, "bad");
    this.addInsight(cause === "wildfire" ? "fire" : "shelter", 8, this.mostInventive());
    for (const v of this.villagers) {
      if (v.tribeId !== s.tribeId) continue;
      v.urge = "shelter";
      if (cause === "hurricane") v.remember("Survived a wind that ate the walls", this.year);
    }
  }

  addInsight(field, amount, villager) {
    if (!field || amount <= 0) return;
    this.insight[field] = (this.insight[field] || 0) + amount;
    if (villager && amount >= 0.5) villager.insightTotal += amount;
    if (villager && amount >= 8) this.float(villager.x, villager.y - 16, "insight", "#f0d78c");
    this.checkUnlocks(villager);
  }

  checkUnlocks(trigger) {
    let guard = 0;
    let progressed = true;
    while (progressed && guard++ < 6) {
      progressed = false;
      for (const tech of TECHS) {
        if (this.unlocked.has(tech.id)) continue;
        if (!this.available(tech)) continue;
        const cost = this.effectiveCost(tech);
        if ((this.insight[tech.field] || 0) >= cost) {
          this.insight[tech.field] -= cost;
          this.unlock(tech, trigger);
          progressed = true;
          break;
        }
      }
    }
  }

  mostInventive() {
    const alive = this.villagers.filter((v) => !v.dead && !v.isChild);
    if (!alive.length) return null;
    return alive.slice().sort((a, b) => {
      const ia = (a.trait === "Inventive" ? 50 : 0) + a.intelligence;
      const ib = (b.trait === "Inventive" ? 50 : 0) + b.intelligence;
      return ib - ia;
    })[0];
  }

  unlock(tech, v) {
    this.unlocked.add(tech.id);
    const who = v && !v.dead ? v : this.mostInventive();
    if (who) {
      who.ideaTimer = 4.6;
      who.remember(`Discovered ${tech.name}`, this.year);
      who.insightTotal += 1;
      if (who.urge === tech.field) who.urge = null;
      this.float(who.x, who.y - 20, tech.name, "#f0d78c");
    }
    this.log(`${who ? who.name : "Someone"} discovers ${tech.name}. ${tech.blurb}`, "good");
    this.sfx.push("discover");
    if (this.eraIndex(tech.era) > this.eraIndex(this.era)) {
      this.era = tech.era;
      this.log(ERA_LINES[tech.era], "god");
      this.sfx.push("era");
    }
  }

  getStudyList() {
    const bestByField = new Map();
    for (const tech of TECHS) {
      if (this.unlocked.has(tech.id) || !this.available(tech)) continue;
      const prev = bestByField.get(tech.field);
      if (!prev || tech.cost < prev.cost) bestByField.set(tech.field, tech);
    }
    return [...bestByField.values()]
      .map((tech) => {
        const cost = this.effectiveCost(tech);
        const have = this.insight[tech.field] || 0;
        return { ...tech, cost, have, pct: clamp((have / cost) * 100, 0, 100) };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4);
  }

  startFamily(a, b) {
    if (a.partnerId || b.partnerId || a.isChild || b.isChild) return;
    if (a.tribeId !== b.tribeId) return;
    a.partnerId = b.id;
    b.partnerId = a.id;
    a.addAffinity(b, 24);
    b.addAffinity(a, 24);
    // Bond first; conception may follow later when fertile & close (real life)
    if (a.canConceive && b.canConceive && Math.random() < 0.4) {
      const bearer = a.sex === "f" ? a : b.sex === "f" ? b : (a.energy <= b.energy ? a : b);
      bearer.expecting = this.yearLength * 0.72;
      bearer.remember("A child begins", this.year);
    }
    a.remember(`Started a family with ${b.name}`, this.year);
    b.remember(`Started a family with ${a.name}`, this.year);
    this.log(`${a.displayName} and ${b.displayName} kindle a hearth together.`, "good");
    this.float((a.x + b.x) / 2, a.y - 18, "love", "#e2557a");
    this.sfx.push("birth");
  }

  get ambientTemp() {
    // Rough °C feel by season + day/night — drives hypothermia & mood
    const base = [12, 24, 14, -2][this.seasonIndex] ?? 12;
    const nightMul = this.isNight() ? -8 : this.dayT > 0.35 && this.dayT < 0.55 ? 4 : 0;
    const storm = this.weather?.type === "hurricane" ? -6 : this.weather?.type === "rain" ? -3 : 0;
    return base + nightMul + storm;
  }

  get moonPhase() {
    // 0..1 over ~8 days
    return (this.time / (this.dayLength * 8)) % 1;
  }

  blendHex(a, b) {
    const pa = parseInt(String(a).slice(1), 16);
    const pb = parseInt(String(b).slice(1), 16);
    const mix = (ca, cb) => Math.max(0, Math.min(255, Math.round((ca + cb) / 2 + (Math.random() * 18 - 9))));
    const r = mix((pa >> 16) & 255, (pb >> 16) & 255);
    const g = mix((pa >> 8) & 255, (pb >> 8) & 255);
    const bl = mix(pa & 255, pb & 255);
    return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
  }

  commonAncestorScore(a, b) {
    const setA = new Set([...(a.parentIds || []), a.id, ...(a.children || [])]);
    let hits = 0;
    for (const id of [...(b.parentIds || []), ...(b.children || [])]) if (setA.has(id)) hits++;
    if (a.founderLineId && a.founderLineId === b.founderLineId && a.generation > 0 && b.generation > 0) hits += 2;
    return clamp(hits * 0.12, 0, 0.7);
  }

  bornFrom(parent, partner) {
    if (this.villagers.length >= 40) {
      parent.remember("The camp cannot feed another", this.year);
      return;
    }
    const tribe = this.tribeOf(parent.tribeId);
    const stockOk = tribe && tribe.food >= Math.max(2, this.tribePop(tribe.id) * 0.35);
    if (tribe && tribe.food >= 2) tribe.food -= 2;

    const stressed = (parent.mood ?? 50) < 20 || (partner.mood ?? 50) < 20;
    const starving = parent.hunger > 90 || partner.hunger > 90 || !stockOk;
    const selfish = parent.empathyScore < -15 || partner.empathyScore < -15;
    if ((starving || stressed) && selfish && Math.random() < 0.5) {
      this.abandonInfant(parent, partner);
      return;
    }

    const inbreed = this.commonAncestorScore(parent, partner);
    let iq = (parent.intelligence + partner.intelligence) / 2 + (Math.random() * 24 - 10);
    let gHealth = (parent.geneticHealth + partner.geneticHealth) / 2 - inbreed * 28;
    const hereditary = [...new Set([...(parent.hereditaryTraits || []), ...(partner.hereditaryTraits || [])])].slice(0, 3);
    const pt = this.worldToTile(parent.x, parent.y);
    const parentTile = this.getTile(pt.tx, pt.ty);
    const falloutBoost = (parentTile?.fallout || 0) > 0.3 || parent.illness?.type === "radiation" || partner.illness?.type === "radiation";
    const mutChance = falloutBoost ? 0.22 : 0.05;
    if (Math.random() < mutChance) {
      const muts = falloutBoost
        ? ["Natural Genius", "Immune Boost", "Frailty", "Short Lifespan", "Glow Skin", "Twisted Bone"]
        : ["Natural Genius", "Immune Boost", "Frailty", "Short Lifespan"];
      const m = muts[(Math.random() * muts.length) | 0];
      hereditary.push(m);
      if (m === "Natural Genius") iq += 28;
      if (m === "Immune Boost") gHealth += 12;
      if (m === "Frailty" || m === "Twisted Bone") gHealth -= 22;
      if (m === "Short Lifespan") gHealth -= 10;
      if (m === "Glow Skin") gHealth -= 6;
      this.log(falloutBoost
        ? `Fallout twists a newborn's blood: ${m}.`
        : `A mutation stirs in the bloodline: ${m}.`, falloutBoost ? "warn" : "info");
    }
    iq = clamp(iq * (1 - inbreed * 0.25), 20, 200);
    gHealth = clamp(gHealth, 15, 100);

    const lineId = parent.founderLineId || partner.founderLineId || `F${this.nextFounderLine++}`;
    const lineName = parent.founderLineName || partner.founderLineName || parent.name;
    const child = new Villager({
      name: takeName(this.namesUsed),
      trait: Math.random() < 0.5 ? parent.trait : partner.trait,
      age: 0,
      isChild: true,
      hunger: 18,
      energy: 70,
      health: clamp(60 + gHealth * 0.4, 40, 100),
      intelligence: iq,
      iqScaled: true,
      religionBelief: (parent.religionBelief + partner.religionBelief) / 3,
      aptitude: Math.random() < 0.5 ? parent.aptitude : partner.aptitude,
      tribeId: parent.tribeId,
      x: parent.x + 6,
      y: parent.y + 4,
      skin: this.blendHex(parent.skin, partner.skin),
      hair: this.blendHex(parent.hair, partner.hair),
      hairStyle: (Math.random() * 4) | 0,
      beard: false,
      parentIds: [parent.id, partner.id],
      scale: 0.9,
      generation: Math.max(parent.generation || 0, partner.generation || 0) + 1,
      founderLineId: lineId,
      founderLineName: lineName,
      surname: parent.surname || partner.surname || lineName,
      sex: Math.random() < 0.5 ? "m" : "f",
      empathyScore: clamp((parent.empathyScore + partner.empathyScore) / 2 + (Math.random() * 20 - 10), -100, 100),
      boldnessScore: clamp((parent.boldnessScore + partner.boldnessScore) / 2 + (Math.random() * 20 - 10), -100, 100),
      peacefulnessScore: clamp((parent.peacefulnessScore + partner.peacefulnessScore) / 2 + (Math.random() * 20 - 10), -100, 100),
      godAlignmentScore: clamp((parent.godAlignmentScore + partner.godAlignmentScore) / 2 + (Math.random() * 16 - 8), -100, 100),
      geneticHealth: gHealth,
      hereditaryTraits: hereditary,
      inbreedingCoefficient: inbreed,
      skills: {
        forage: ((parent.skills?.forage || 10) + (partner.skills?.forage || 10)) / 4 + Math.random() * 8,
        craft: ((parent.skills?.craft || 10) + (partner.skills?.craft || 10)) / 4 + Math.random() * 8,
        farm: ((parent.skills?.farm || 8) + (partner.skills?.farm || 8)) / 4 + Math.random() * 6,
        combat: ((parent.skills?.combat || 8) + (partner.skills?.combat || 8)) / 5 + Math.random() * 6,
        mine: ((parent.skills?.mine || 5) + (partner.skills?.mine || 5)) / 5 + Math.random() * 4,
        trade: ((parent.skills?.trade || 5) + (partner.skills?.trade || 5)) / 5 + Math.random() * 5,
        lead: ((parent.skills?.lead || 5) + (partner.skills?.lead || 5)) / 6 + Math.random() * 4
      }
    });
    child.syncTraitFromScores();
    this.addVillager(child);
    child.initRelations(this.villagers);
    parent.children.push(child.id);
    partner.children.push(child.id);
    parent.affinity.set(child.id, 80);
    partner.affinity.set(child.id, 80);
    child.affinity.set(parent.id, 70);
    child.affinity.set(partner.id, 70);
    parent.remember(`A child arrived: ${child.name}`, this.year);
    partner.remember(`A child arrived: ${child.name}`, this.year);
    this.log(`${child.displayName} is born to ${parent.displayName} and ${partner.displayName} (gen ${child.generation}).`, "good");
    this.float(child.x, child.y - 10, child.name, "#f4efe6");
    this.sfx.push("baby");
    if (this.villagers.length <= 8) this.log("The hearth celebrates a birth.", "good");
  }

  abandonInfant(parent, partner) {
    const orphan = new Villager({
      name: takeName(this.namesUsed),
      trait: "Aggressive",
      age: 0,
      isChild: true,
      hunger: 55,
      energy: 40,
      health: 70,
      intelligence: 40 + Math.random() * 30,
      iqScaled: true,
      tribeId: parent.tribeId,
      x: parent.x + 18,
      y: parent.y + 10,
      skin: parent.skin,
      hair: partner.hair,
      parentIds: [parent.id, partner.id],
      generation: Math.max(parent.generation || 0, partner.generation || 0) + 1,
      founderLineId: parent.founderLineId || partner.founderLineId,
      founderLineName: parent.founderLineName || partner.founderLineName,
      empathyScore: -20,
      boldnessScore: 35,
      peacefulnessScore: -25,
      godAlignmentScore: -10
    });
    orphan.orphan = true;
    orphan.abandoned = true;
    orphan.surname = parent.surname || partner.surname || parent.founderLineName;
    orphan.say("…");
    this.addVillager(orphan);
    parent.remember(`Abandoned an infant`, this.year);
    parent.shiftPersonality(-12, 4, -6, -4, "Abandoned a child", this);
    this.log(`${parent.name} leaves an infant crying beyond the firelight.`, "bad");
    const carers = this.villagers.filter((v) => !v.dead && v.empathyScore > 35 && v.id !== parent.id);
    const carer = carers.sort((a, b) => b.empathyScore - a.empathyScore)[0];
    if (carer && Math.random() < 0.7) {
      orphan.orphan = false;
      orphan.abandoned = false;
      orphan.parentIds = [carer.id];
      carer.children.push(orphan.id);
      carer.shiftPersonality(18, 0, 6, 4, "Adopted an orphan", this);
      orphan.shiftPersonality(12, -4, 8, 2, "Found a caregiver", this);
      this.log(`${carer.name} takes in the abandoned child ${orphan.name}.`, "good");
    } else {
      orphan.shiftPersonality(-8, 16, -10, -6, "Grew hardened alone", this);
      orphan.traitTags.push("Hardened", "Rebellious");
      orphan.taskLabel = "Crying alone";
      orphan.emoteLock = "broken";
      orphan.emoteLockT = 12;
    }
  }

  kill(v, cause) {
    if (v.dead) return;
    v.dead = true;
    const phrases = {
      starvation: `${v.displayName} starves within sight of the fire.`,
      "old age": `${v.displayName} returns to the soil, full of years.`,
      wildfire: `${v.displayName} is taken by the wildfire.`,
      lightning: `Lightning takes ${v.displayName}.`,
      hurricane: `${v.displayName} is lost in the hurricane.`,
      wounds: `${v.displayName} falls and does not rise.`
    };
    this.log(phrases[cause] || `${v.displayName} dies.`, "bad");
    this.float(v.x, v.y - 12, v.name, "#e7e1d6");
    this.sfx.push("death");
    this.graves.push({
      x: v.x, y: v.y, forId: v.id, name: v.displayName, year: this.year, t: 120
    });
    if (this.graves.length > 24) this.graves.shift();
    for (const o of this.villagers) {
      if (o.id === v.id || o.dead) continue;
      if (o.partnerId === v.id) {
        o.partnerId = null;
        o.grief = 46;
        o.expecting = 0;
        o.graveX = v.x;
        o.graveY = v.y;
        o.remember(`Lost ${v.name}`, this.year);
        if (Math.random() < 0.55) o.beginBreakdown?.(this, "mourner");
      } else if (o.affinityTo(v.id) > 40 || (o.parentIds || []).includes(v.id) || (v.parentIds || []).includes(o.id)) {
        o.remember(`Mourned ${v.name}`, this.year);
        o.grief = Math.max(o.grief, 18);
        o.graveX = v.x;
        o.graveY = v.y;
      }
    }
    this.succeedLeader(v);
    if (this.selectedId === v.id) this.selectedId = null;
  }

  succeedLeader(dead) {
    for (const tribe of this.tribes) {
      if (tribe.leaderId !== dead.id) continue;
      const kin = this.villagers.filter((o) =>
        !o.dead && o.tribeId === tribe.id && !o.isChild && o.id !== dead.id && (
          (dead.children || []).includes(o.id)
          || (o.parentIds || []).includes(dead.id)
          || o.surname === dead.surname
          || o.founderLineId === dead.founderLineId
        )
      );
      let heir = null;
      if (kin.length) {
        heir = kin.sort((a, b) => {
          const childA = (dead.children || []).includes(a.id) ? 1 : 0;
          const childB = (dead.children || []).includes(b.id) ? 1 : 0;
          if (childB !== childA) return childB - childA;
          return b.age - a.age || dead.affinityTo?.(b.id) - dead.affinityTo?.(a.id);
        })[0];
      }
      if (!heir) {
        heir = this.villagers
          .filter((o) => !o.dead && o.tribeId === tribe.id && !o.isChild && o.id !== dead.id)
          .sort((a, b) => (b.affinityTo(dead.id) - a.affinityTo(dead.id)) || b.age - a.age)[0];
      }
      if (heir) {
        tribe.leaderId = heir.id;
        heir.shiftPersonality?.(4, 6, 2, 4, "Inherited tribal leadership", this);
        heir.socialNeed = Math.min(100, heir.socialNeed + 15);
        heir.remember(`Became elder of ${tribe.name}`, this.year);
        this.log(`${heir.displayName} inherits leadership of ${tribe.name}.`, "god");
        this.float(heir.x, heir.y - 18, "elder", "#f0d78c");
      } else {
        tribe.leaderId = null;
      }
    }
  }

  resolveHurricane() {
    this.lastDisaster = "hurricane";
    this.natureScore += 3;
    this.godMemory = Math.max(this.godMemory, 22);
    this.addInsight("shelter", 22, this.mostInventive());
    this.addInsight("faith", 14, this.villagers.find((v) => v.trait === "Devout") || null);
    for (const v of this.villagers) {
      if (v.trait === "Devout") {
        v.urge = "faith";
        v.religionBelief = Math.min(100, v.religionBelief + 12);
        v.remember("The storm listened, or we did", this.year);
      } else {
        v.urge = "shelter";
        v.remember("We need walls that do not bow", this.year);
      }
      v.ideaTimer = Math.max(v.ideaTimer, 2.5);
    }
    this.log("Survivors speak of stronger shelter and storm worship.", "god");
  }

  powerReady(name) {
    return (this.cooldowns[name] || 0) <= 0;
  }

  spend(name) {
    this.cooldowns[name] = this.cooldownMax[name] || 1;
  }

  witness(x, y, radius, fn) {
    for (const v of this.villagers) {
      if (Math.hypot(v.x - x, v.y - y) <= radius) fn(v);
    }
  }

  castBless(v) {
    if (!this.powerReady("bless")) return this.log("Mercy needs a breath.", "info");
    const ox = v ? v.x : this.cursor?.x;
    const oy = v ? v.y : this.cursor?.y;
    if (ox != null && this.collectOfferingsNear(ox, oy) && !v) {
      this.spend("bless");
      return;
    }
    if (!v) return this.log("No one stands there to receive it.", "info");
    this.spend("bless");
    this.collectOfferingsNear(v.x, v.y);
    v.hunger = Math.max(0, v.hunger - 70);
    v.health = Math.min(100, v.health + 55);
    v.energy = Math.min(100, v.energy + 28);
    v.religionBelief = Math.min(100, v.religionBelief + 18);
    v.socialNeed = Math.min(100, (v.socialNeed || 50) + 20);
    v.safetyNeed = Math.min(100, (v.safetyNeed || 50) + 25);
    v.illness = null;
    v.breakdown = null;
    v.healBody?.(55);
    v.shiftPersonality?.(8, 2, 4, 18, "Healed by a divine hand", this);
    v.logInfluence?.("Blessed by God", this.year);
    const saved = this.weather?.type === "hurricane" || (this.lastDisaster === "hurricane" && this.godMemory > 0);
    v.remember(saved ? "Saved by God from Hurricane" : "Blessed by a gentle, invisible hand", this.year);
    v.ideaTimer = Math.max(v.ideaTimer, 1.2);
    this.godScore += 2;
    this.godMemory = Math.max(this.godMemory, 16);
    this.float(v.x, v.y - 18, "blessed", "#f0d78c");
    this.burst(v.x, v.y - 8, "#f0d78c", 10);
    this.sfx.push("bless");
    this.witness(v.x, v.y, 90, (o) => {
      if (o.id === v.id) return;
      o.religionBelief = Math.min(100, o.religionBelief + 6);
      o.shiftPersonality?.(2, 0, 1, 4, "Witnessed a blessing", this);
    });
    this.log(`A blessing settles on ${v.displayName}.`, "god");
  }

  forceRest(selectedId = null) {
    const targets = [];
    if (selectedId) {
      const v = this.villagerById(selectedId);
      if (v && !v.dead) targets.push(v);
    } else {
      for (const v of this.villagers) {
        if (!v.dead && !v.isChild && (v.energy < 70 || this.isNight())) targets.push(v);
      }
    }
    if (!targets.length) return this.log("No one needs rest right now.", "info");
    for (const v of targets) {
      if (v.possessed) continue;
      v.beginSleep(this);
      v.taskLabel = "Resting by divine leave";
      v.say(v.trait === "Lazy" ? "Finally." : "I will close my eyes.");
      this.float(v.x, v.y - 14, "zzz", "#c9b8e8");
    }
    this.log(targets.length === 1
      ? `${targets[0].name} lies down to rest.`
      : `${targets.length} villagers settle to sleep.`, "god");
    this.sfx.push("click");
  }

  castWhisper(v, intent) {
    if (!v) return this.log("No mind to whisper into.", "info");
    if (!this.powerReady("whisper")) return this.log("The whisper still echoes.", "info");
    this.spend("whisper");
    let chance = 0.6;
    if (v.godAlignmentScore > 30 || v.empathyScore > 40) chance = 0.85;
    if (v.godAlignmentScore < -30 || v.traitTags.includes("Rebellious") || v.traitTags.includes("Godless")) chance = 0.4;
    const obey = Math.random() < chance;
    const defy = !obey && (v.godAlignmentScore < -30 || Math.random() < 0.35);
    const ox = this.camHomeX ?? this.homeX;
    const oy = (this.camHomeY ?? this.homeY) - 80;
    for (let i = 0; i < 28; i++) {
      const t = i / 28;
      const sway = Math.sin(t * Math.PI * 3) * 10;
      this.fx.push({
        x: ox + (v.x - ox) * t + sway + (Math.random() * 4 - 2),
        y: oy + (v.y - 12 - oy) * t + Math.cos(t * 10) * 4,
        vx: (Math.random() - 0.5) * 6,
        vy: -4 - Math.random() * 10,
        life: 0.9 + Math.random() * 0.5,
        max: 1.4,
        color: i % 3 === 0 ? "#fff6c8" : "#f0d78c",
        size: 1 + (i % 3 === 0 ? 2 : 1)
      });
    }
    for (let i = 0; i < 10; i++) {
      this.fx.push({
        x: v.x + (Math.random() * 10 - 5),
        y: v.y - 8 - Math.random() * 10,
        vx: (Math.random() - 0.5) * 12,
        vy: -14 - Math.random() * 10,
        life: 0.6 + Math.random() * 0.4,
        max: 1,
        color: "#ffe9a0",
        size: 2
      });
    }
    this.burst(v.x, v.y - 10, "#f0d78c", 18);
    this.float(v.x, v.y - 22, defy ? "defies" : obey ? "hears" : "wavers", "#f0d78c");
    v.logInfluence(`Whisper: ${intent}${defy ? " (defied)" : obey ? "" : " (ignored)"}`, this.year);
    const doIntent = defy
      ? ({ innovation: "wilderness", pardon: "fight", love: "wilderness", wilderness: "pray", rain: "innovation" }[intent] || intent)
      : intent;
    if (!obey && !defy) {
      this.log(`${v.name} feels a whisper and lets it pass.`, "god");
      return;
    }
    if (doIntent === "innovation") {
      v.ideaTimer = 5;
      this.addInsight(v.aptitude || "tools", 22, v);
      v.say("A new shape…");
    } else if (doIntent === "pardon") {
      for (const [id, tag] of v.tags) {
        if (tag === "Hate" || tag === "Rival") {
          v.tags.delete(id);
          v.addAffinity(id, 35);
          const o = this.villagerById(id);
          if (o) {
            o.tags.delete(v.id);
            o.addAffinity(v, 25);
          }
        }
      }
      v.shiftPersonality(8, -4, 12, 6, "Pardoned a rival", this);
      v.say("I lay it down.");
    } else if (doIntent === "love") {
      const other = this.villagers
        .filter((o) => o.id !== v.id && !o.dead && !o.isChild && o.tribeId === v.tribeId && !o.partnerId && !v.partnerId)
        .sort((a, b) => v.affinityTo(b.id) - v.affinityTo(a.id))[0];
      if (other) {
        v.addAffinity(other, 40);
        other.addAffinity(v, 30);
        if (v.affinityTo(other.id) >= 60) this.startFamily(v, other);
        v.say(`${other.name}…`);
      }
    } else if (doIntent === "wilderness") {
      v.beginWander(this, 16);
      v.taskLabel = "Exploring the wilds";
      this.addInsight("culture", 4, v);
      v.say("Beyond the ridge.");
    } else if (doIntent === "pray" || doIntent === "rain") {
      v.beginResearch?.(this);
      if (doIntent === "rain") {
        this.weather = { type: "rain", t: 0, dur: 10, eyeX: v.x, eyeY: v.y };
        this.log("Clouds gather at a whispered prayer.", "god");
      }
      const spot = this.shrineTile(v.tribeId) || this.campTile(v.tribeId);
      if (spot) {
        v.setJob(this, { type: "pray", tx: spot.tx, ty: spot.ty });
        v.taskLabel = "Praying as whispered";
      }
      v.shiftPersonality(2, 0, 2, 10, "Answered a divine whisper", this);
    }
    this.log(`You whisper “${intent}” to ${v.name}${defy ? " — and they defy you" : ""}.`, "god");
    this.sfx.push("bless");
  }

  tickPopulationEvents(dt) {
    this.eventAcc = (this.eventAcc || 10) - dt;
    if (this.eventAcc > 0) return;
    const pop = this.villagers.length;
    this.eventAcc = pop <= 8 ? 14 + Math.random() * 10 : pop <= 20 ? 11 + Math.random() * 8 : 9 + Math.random() * 7;
    const roll = Math.random();
    if (pop <= 8) {
      if (roll < 0.3) {
        const tile = this.findResource(this.villagers[0], ["bush"], 20);
        if (tile) this.log("Someone finds a thicket of berries near camp.", "good");
      } else if (roll < 0.5) this.log("A wolf’s cry carries from the trees.", "info");
      else if (roll < 0.7) {
        this.weather = { type: "rain", t: 0, dur: 6, eyeX: this.homeX, eyeY: this.homeY };
        this.log("A mild rain cools the day.", "info");
      }
    } else if (pop <= 20) {
      if (roll < 0.25) {
        const t = this.tribes[0];
        if (t) {
          t.food = Math.max(0, t.food - 4);
          this.log("Food spoils in the baskets.", "bad");
        }
      } else if (roll < 0.45) {
        this.log("Heat lies heavy on the grass.", "info");
        for (const v of this.villagers) v.energy = Math.max(10, v.energy - 8);
      } else if (roll < 0.65) {
        const d = this.villagers.find((v) => v.trait === "Devout");
        if (d) {
          d.religionBelief = Math.min(100, d.religionBelief + 20);
          d.ideaTimer = 3;
          this.log(`${d.name} speaks of a revelation in the night sky.`, "god");
        }
      } else this.maybeSpawnNomads();
    } else {
      if (roll < 0.28 && !this.weather) {
        this.castHurricane(this.homeX + (Math.random() * 80 - 40), this.homeY);
      } else if (roll < 0.5) {
        this.splitCd = 0;
        this.tickSplit();
      } else if (roll < 0.75) {
        const seed = this.villagers[(Math.random() * this.villagers.length) | 0];
        if (seed) {
          seed.catchIllness(this.era === "medieval" || this.eraIndex(this.era) >= 1 ? "plague" : "flu", 22);
          this.log(`Sickness takes hold of ${seed.name}.`, "bad");
        }
      } else {
        this.prayerRequest = {
          text: pickPrayer(this),
          t: 28,
          familyIds: this.villagers.filter((v) => v.godAlignmentScore > 10).slice(0, 4).map((v) => v.id)
        };
        this.log("The devout raise a prayer toward you.", "god");
      }
    }
    if (pop >= 5 && this.morale > 55 && this.totalStock().food > pop * 1.5 && Math.random() < 0.2) {
      this.maybeSpawnNomads();
    }
  }

  maybeSpawnNomads() {
    if (this.pendingNomads || this.villagers.length >= 36) return;
    const edge = Math.random();
    let x = this.homeX;
    let y = this.homeY;
    if (edge < 0.25) x = 24;
    else if (edge < 0.5) x = this.w * this.tile - 24;
    else if (edge < 0.75) y = 24;
    else y = this.h * this.tile - 24;
    const n = 1 + ((Math.random() * 2) | 0);
    this.pendingNomads = { x, y, n, t: 24 };
    this.log(`${n} wanderer${n > 1 ? "s" : ""} appear at the edge of the land, seeking a fire.`, "info");
  }

  acceptNomads() {
    if (!this.pendingNomads) return;
    const tribe = this.tribes[0];
    for (let i = 0; i < this.pendingNomads.n; i++) {
      const v = new Villager({
        name: takeName(this.namesUsed),
        trait: TRAITS[(Math.random() * TRAITS.length) | 0],
        age: 18 + ((Math.random() * 20) | 0),
        hunger: 40,
        energy: 60,
        intelligence: 50 + Math.random() * 60,
        iqScaled: true,
        tribeId: tribe.id,
        x: this.pendingNomads.x + i * 10,
        y: this.pendingNomads.y + i * 6,
        skin: SKINS[(Math.random() * SKINS.length) | 0],
        hair: HAIRS[(Math.random() * HAIRS.length) | 0],
        generation: 0,
        founderLineId: `N${this.nextId++}`,
        founderLineName: "Wanderer"
      });
      v.initPersonalityFromTrait(v.trait);
      this.addVillager(v);
      v.initRelations(this.villagers);
      v.remember("Welcomed as a refugee", this.year);
    }
    this.log("The wanderers are welcomed to the fire.", "good");
    this.pendingNomads = null;
  }

  rejectNomads() {
    if (!this.pendingNomads) return;
    this.log("The wanderers are turned away into the dark.", "bad");
    for (const v of this.villagers) {
      if (v.empathyScore > 40) v.shiftPersonality(-2, 0, -1, -1, "Saw refugees turned away", this);
    }
    this.pendingNomads = null;
  }

  tickDisease(dt) {
    for (const v of this.villagers) {
      if (!v.illness || v.dead) continue;
      for (const o of this.villagers) {
        if (o.id === v.id || o.dead || o.illness) continue;
        if (Math.hypot(o.x - v.x, o.y - v.y) < 48 && Math.random() < dt * 0.08) {
          o.catchIllness(v.illness.type, 14 + Math.random() * 10);
        }
      }
      if (Math.random() < dt * 0.15) {
        this.fx.push({
          x: v.x + (Math.random() * 6 - 3),
          y: v.y - 12,
          vx: Math.random() * 4 - 2,
          vy: -8,
          life: 0.5,
          max: 0.5,
          color: "#c8d0b8",
          size: 1
        });
      }
    }
  }

  tickPrayers(dt) {
    if (this.pendingNomads) {
      this.pendingNomads.t -= dt;
      if (this.pendingNomads.t <= 0) {
        const empath = this.villagers.find((v) => v.empathyScore > 50);
        if (empath) this.acceptNomads();
        else this.rejectNomads();
      }
    }
    if (!this.prayerRequest) {
      if (Math.random() < dt * 0.015 && this.villagers.some((v) => v.godAlignmentScore > 20)) {
        this.prayerRequest = {
          text: pickPrayer(this),
          t: 30,
          familyIds: this.villagers.filter((v) => v.religionBelief > 30).slice(0, 5).map((v) => v.id)
        };
      }
      return;
    }
    this.prayerRequest.t -= dt;
    if (this.prayerRequest.t <= 0) {
      for (const id of this.prayerRequest.familyIds) {
        const v = this.villagerById(id);
        if (v) v.shiftPersonality(0, 0, -1, -6, "Prayer went unanswered", this);
      }
      this.log("A prayer fades unanswered.", "info");
      this.prayerRequest = null;
    }
  }

  grantPrayer() {
    if (!this.prayerRequest) return;
    for (const id of this.prayerRequest.familyIds) {
      const v = this.villagerById(id);
      if (!v) continue;
      v.shiftPersonality(4, 0, 2, 25, "God answered a prayer", this);
      v.religionBelief = Math.min(100, v.religionBelief + 15);
      v.hunger = Math.max(0, v.hunger - 20);
      v.health = Math.min(100, v.health + 15);
      v.logInfluence("Prayer granted", this.year);
    }
    this.godScore += 3;
    this.log(`You grant their prayer: “${this.prayerRequest.text}”`, "god");
    this.burst(this.homeX, this.homeY, "#f0d78c", 16);
    this.prayerRequest = null;
    this.sfx.push("bless");
  }

  popBreakdown() {
    let adults = 0;
    let children = 0;
    for (const v of this.villagers) {
      if (v.isChild) children++;
      else adults++;
    }
    return { total: this.villagers.length, adults, children };
  }

  getGoals() {
    return GOAL_DEFS.map((g) => {
      const done = !!(this.goalsDone?.[g.id] || g.test(this));
      return { id: g.id, label: g.label, done };
    });
  }

  tickGoals() {
    if (!this.goalsDone) this.goalsDone = {};
    for (const g of GOAL_DEFS) {
      if (this.goalsDone[g.id]) continue;
      if (g.test(this)) {
        this.goalsDone[g.id] = true;
        this.log(`Goal complete: ${g.label}`, "good");
        this.sfx.push("discover");
        for (const v of this.villagers) {
          v.shiftPersonality?.(2, 1, 2, 1, "Celebrated a people goal", this);
        }
      }
    }
  }

  tickFestival(dt) {
    this.festivalCd = Math.max(0, (this.festivalCd || 0) - dt);
    if (this.festival) {
      this.festival.t -= dt;
      for (const v of this.villagers) {
        if (Math.hypot(v.x - this.festival.x, v.y - this.festival.y) < 70) {
          v.hunger = Math.max(0, v.hunger - 2.5 * dt);
          v.energy = Math.min(100, v.energy + 1.2 * dt);
          if (Math.random() < dt * 0.4) {
            this.fx.push({
              x: v.x + (Math.random() * 10 - 5),
              y: v.y - 10,
              vx: (Math.random() - 0.5) * 8,
              vy: -20,
              life: 0.7,
              max: 0.7,
              color: ["#f0d78c", "#e2557a", "#8fd0a4", "#6fa8c9"][(Math.random() * 4) | 0],
              size: 2
            });
          }
        }
      }
      if (this.festival.t <= 0) {
        this.log("The festival ends. Stories linger by the fire.", "good");
        this.festival = null;
        this.festivalCd = 55;
      }
      return;
    }
    if (this.festivalCd > 0) return;
    const pop = this.villagers.length;
    if (pop < 4 || this.morale < 58 || this.totalStock().food < pop) {
      this.festivalCd = 12;
      return;
    }
    if (Math.random() < dt * 0.08) this.startFestival();
  }

  startFestival() {
    const tribe = this.tribes[0];
    if (!tribe) return;
    tribe.food = Math.max(0, tribe.food - Math.max(2, Math.floor(this.villagers.length * 0.35)));
    this.festival = { x: tribe.homeX, y: tribe.homeY, t: 14 };
    this.goalsDone = this.goalsDone || {};
    this.goalsDone.festival = true;
    this.log("A festival kindles — drums, food, and laughter under your sky.", "good");
    this.sfx.push("birth");
    for (const v of this.villagers) {
      v.shiftPersonality?.(4, 2, 6, 3, "Danced at a festival", this);
      v.emoteLock = "love";
      v.emoteLockT = 3;
    }
  }

  tickQuake(dt) {
    if ((this.quakeT || 0) <= 0) return;
    this.quakeT -= dt;
    this.flash = Math.max(this.flash, 0.25);
    if (Math.random() < dt * 6) {
      const s = this.structures[(Math.random() * this.structures.length) | 0];
      if (s) this.damageStructure(s, 8 + Math.random() * 10, "quake");
    }
    for (const v of this.villagers) {
      this.tryMove(v, (Math.random() - 0.5) * 40 * dt, (Math.random() - 0.5) * 40 * dt);
      if (Math.random() < dt * 0.5) v.injure?.(Math.random() < 0.5 ? "LeftLeg" : "RightLeg", 4, this);
    }
  }

  castRain(x, y) {
    if (!this.powerReady("rain")) return this.log("The clouds are still elsewhere.", "info");
    this.spend("rain");
    this.weather = { type: "rain", t: 0, dur: 12, eyeX: x, eyeY: y };
    this.godScore += 1;
    this.godMemory = Math.max(this.godMemory, 10);
    for (const t of this.tiles) {
      if (t.type === "farm") t.growth = Math.min(1.4, (t.growth || 0) + 0.12);
      if (t.fire > 0) t.fire *= 0.4;
    }
    this.witness(x, y, 160, (v) => {
      v.religionBelief = Math.min(100, v.religionBelief + 5);
      v.shiftPersonality?.(1, 0, 1, 6, "Felt blessed rain", this);
    });
    this.log("Gentle rain answers your hand. Fires hiss; crops drink.", "god");
    this.sfx.push("bless");
  }

  castQuake(x, y) {
    if (!this.powerReady("quake")) return this.log("The earth will not answer yet.", "info");
    this.spend("quake");
    this.quakeT = 4.5;
    this.natureScore += 2;
    this.lastDisaster = "quake";
    this.flash = 1;
    {
      const tile = this.worldToTile(x, y);
      this.invalidatePathsNear(tile.tx, tile.ty, 6);
    }
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const px = x + Math.cos(ang) * (20 + Math.random() * 16);
      const py = y + Math.sin(ang) * (16 + Math.random() * 12);
      if (Math.random() < 0.45) this.paintBrush(px, py, "raise");
      else this.paintBrush(px, py, "dig");
    }
    this.witness(x, y, 140, (v) => {
      v.religionBelief = Math.min(100, v.religionBelief + (v.trait === "Devout" ? 10 : 3));
      v.remember("The ground roared like a beast", this.year);
    });
    this.log("The land buckles. Walls shudder.", "bad");
    this.sfx.push("storm");
  }

  clearPossession() {
    if (this.possessedId) {
      const v = this.villagerById(this.possessedId);
      if (v) {
        v.possessed = false;
        v.job = null;
      }
    }
    this.possessedId = null;
  }

  possessVillager(v) {
    if (!v || v.dead) return this.log("No one to inhabit.", "info");
    this.clearPossession();
    this.possessedId = v.id;
    v.possessed = true;
    v.job = null;
    v.path = null;
    v.taskLabel = "Guided by the divine hand";
    this.selectedId = v.id;
    this.log(`You slip into ${v.name}. WASD/arrows move · Space acts.`, "god");
    this.sfx.push("bless");
  }

  possessedVillager() {
    return this.possessedId ? this.villagerById(this.possessedId) : null;
  }

  movePossessed(dx, dy, dt = 0.016) {
    const v = this.possessedVillager();
    if (!v || v.dead) return;
    const speed = 52 * v.moveSpeedFactor();
    const nx = v.x + dx * speed * dt;
    const ny = v.y + dy * speed * dt;
    if (dx || dy) v.facing = dx < 0 ? -1 : dx > 0 ? 1 : v.facing;
    this.tryMove(v, nx - v.x, ny - v.y);
    v.moving = !!(dx || dy);
    v.energy = Math.max(0, v.energy - 0.4 * dt);
  }

  possessInteract() {
    const v = this.possessedVillager();
    if (!v) return;
    const here = this.worldToTile(v.x, v.y);
    const dirs = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of dirs) {
      const tx = here.tx + dx;
      const ty = here.ty + dy;
      const bp = this.blueprints.find((b) => b.tx === tx && b.ty === ty && b.tribeId === v.tribeId);
      if (bp) {
        const rate = 22 * v.workSpeedFactor();
        bp.progress += rate * 0.35;
        v.acting = true;
        v.taskLabel = `Building ${bp.type}`;
        if (bp.progress >= 100) this.finishBlueprint(bp, v);
        return;
      }
      const tile = this.getTile(tx, ty);
      if (tile?.res && tile.amount > 0) {
        this.harvest(v, tx, ty, false);
        v.acting = true;
        return;
      }
      if (tile?.type === "farm" && tile.growth >= 1) {
        this.harvestFarm(v, tx, ty);
        v.acting = true;
        return;
      }
    }
    this.float(v.x, v.y - 12, "nothing", "#b7ad9f");
  }

  invalidatePathsNear(tx, ty, r = 3) {
    for (const v of this.villagers) {
      if (!v.path?.length || v.possessed) continue;
      const crossed = v.path.some((p) => {
        const t = this.worldToTile(p.x, p.y);
        return Math.abs(t.tx - tx) + Math.abs(t.ty - ty) <= r;
      });
      if (crossed) {
        v.path = null;
        v.pathI = 0;
        if (v.job?.stage === "goto") v.job = null;
      }
    }
  }

  paintBrush(x, y, mode) {
    const { tx, ty } = this.worldToTile(x, y);
    const tile = this.getTile(tx, ty);
    if (!tile) return;
    if (mode === "raise") {
      if (tile.type === "water" || tile.type === "sand") {
        tile.type = "grass";
        tile.res = null;
        tile.amount = 0;
      } else if (tile.type === "grass" || tile.type === "path") {
        tile.type = "rock";
        tile.res = null;
        tile.amount = 0;
      }
      this.terrainDirty = true;
      this.invalidatePathsNear(tx, ty);
    } else if (mode === "dig") {
      if (tile.type !== "rock") {
        tile.type = "water";
        tile.res = null;
        tile.amount = 0;
        tile.fire = 0;
        tile.pollution = 0;
        this.terrainDirty = true;
        this.invalidatePathsNear(tx, ty);
      }
    } else if (mode === "plant") {
      if ((tile.type === "grass" || tile.type === "path" || tile.type === "barren") && !tile.res) {
        tile.type = "grass";
        tile.res = "tree";
        tile.amount = 3;
        tile.max = 3;
        tile.deforest = 0;
        this.terrainDirty = true;
      }
    } else if (mode === "game") {
      this.spawnAnimal(x, y, this.pickWildKind());
    }
  }

  placePlayerBuild(x, y, type) {
    const cost = BUILD_COSTS[type];
    if (!cost) return;
    const { tx, ty } = this.worldToTile(x, y);
    const tile = this.getTile(tx, ty);
    if (!tile || tile.type === "water" || tile.type === "rock" || tile.res) {
      return this.log("That ground will not hold a structure.", "info");
    }
    if (this.structures.some((s) => s.tx === tx && s.ty === ty) || this.blueprints.some((b) => b.tx === tx && b.ty === ty)) {
      return this.log("Something already stands there.", "info");
    }
    if (type === "hut" && !this.hasTech("mud_huts")) return this.log("Mud Huts are not yet known.", "info");
    if (type === "reactor" && !this.hasTech("reactors")) return this.log("Reactors are not yet known.", "info");
    const tribe = this.nearestTribe(x, y);
    if (!tribe) return;
    if (tribe.wood < cost.wood || tribe.stone < (cost.stone || 0)) {
      return this.log("The nearest camp lacks the materials.", "info");
    }
    tribe.wood -= cost.wood;
    tribe.stone -= cost.stone || 0;
    this.blueprints.push({
      id: this.nextId++,
      type,
      tx,
      ty,
      tribeId: tribe.id,
      progress: 0,
      needWood: 0,
      needStone: 0
    });
    this.log(`Blueprint marked: ${type}.`, "god");
    this.sfx.push("click");
  }

  markDeforestation(tx, ty) {
    for (let y = -2; y <= 2; y++) {
      for (let x = -2; x <= 2; x++) {
        const t = this.getTile(tx + x, ty + y);
        if (!t || t.type === "water" || t.type === "rock") continue;
        t.deforest = (t.deforest || 0) + 0.35;
        if (t.deforest > 2.2 && !t.res && (t.type === "grass" || t.type === "path")) {
          t.type = "barren";
          this.terrainDirty = true;
        }
      }
    }
    this.animals.forEach((a) => {
      if (Math.hypot(a.x - tx * this.tile, a.y - ty * this.tile) < 80) a.migrate = true;
    });
  }

  pickWildKind(nearWater = false) {
    const roll = Math.random();
    if (nearWater) {
      if (roll < 0.35) return "beaver";
      if (roll < 0.5) return "snake";
      if (roll < 0.65) return "deer";
      if (roll < 0.8) return "moose";
      return "fox";
    }
    if (roll < 0.14) return "deer";
    if (roll < 0.22) return "rabbit";
    if (roll < 0.3) return "fox";
    if (roll < 0.37) return "chicken";
    if (roll < 0.44) return "sheep";
    if (roll < 0.5) return "goat";
    if (roll < 0.56) return "pig";
    if (roll < 0.62) return "boar";
    if (roll < 0.68) return "cattle";
    if (roll < 0.74) return "horse";
    if (roll < 0.8) return "wolf";
    if (roll < 0.86) return "moose";
    if (roll < 0.91) return "bear";
    if (roll < 0.95) return "snake";
    if (roll < 0.98) return "beaver";
    return ANIMAL_KINDS[(Math.random() * ANIMAL_KINDS.length) | 0];
  }

  spawnAnimal(x, y, kind = "deer") {
    if (!ANIMAL_KINDS.includes(kind)) kind = "deer";
    if (this.animals.length > 64) this.animals.shift();
    const hp = ANIMAL_HP[kind] || 18;
    const canDom = kind === "cattle" || kind === "sheep" || kind === "goat" || kind === "chicken" || kind === "pig" || kind === "horse";
    this.animals.push({
      id: this.nextId++,
      kind,
      x,
      y,
      vx: 0,
      vy: 0,
      phase: Math.random() * 10,
      hp,
      migrate: false,
      domestic: canDom && Math.random() < (kind === "chicken" || kind === "sheep" ? 0.45 : 0.28)
    });
    this.float(x, y - 8, kind, "#d7c4a2");
  }

  seedWildlife() {
    for (let i = 0; i < 22; i++) {
      const tx = 4 + ((Math.random() * (this.w - 8)) | 0);
      const ty = 4 + ((Math.random() * (this.h - 8)) | 0);
      const t = this.getTile(tx, ty);
      if (!t || (t.type !== "grass" && t.type !== "sand")) continue;
      let nearWater = false;
      for (let oy = -2; oy <= 2 && !nearWater; oy++) {
        for (let ox = -2; ox <= 2; ox++) {
          if (this.getTile(tx + ox, ty + oy)?.type === "water") {
            nearWater = true;
            break;
          }
        }
      }
      const c = this.tileCenter(tx, ty);
      this.spawnAnimal(c.x, c.y, this.pickWildKind(nearWater));
    }
  }

  forestScore(tx, ty) {
    let s = 0;
    for (let y = -3; y <= 3; y++) {
      for (let x = -3; x <= 3; x++) {
        const t = this.getTile(tx + x, ty + y);
        if (t?.res === "tree") s += 2;
        if (t?.type === "grass") s += 0.4;
        if (t?.type === "barren") s -= 1;
      }
    }
    return s;
  }

  nearestTribeAt(x, y) {
    let nearest = null;
    let nd = Infinity;
    for (const tr of this.tribes) {
      const d = Math.hypot(tr.homeX - x, tr.homeY - y);
      if (d < nd) {
        nd = d;
        nearest = tr;
      }
    }
    return { tribe: nearest, dist: nd };
  }

  tickAnimals(dt) {
    if (!this.animals.length && this.time > 8 && Math.random() < dt * 0.05) this.seedWildlife();
    const preyKinds = new Set(["deer", "rabbit", "sheep", "chicken", "cattle", "goat", "pig", "horse", "moose"]);
    for (const a of this.animals) {
      a.phase += dt;
      const tile = this.worldToTile(a.x, a.y);
      let score = this.forestScore(tile.tx, tile.ty);
      // Habitat bias
      if (a.kind === "beaver" || a.kind === "snake" || a.kind === "moose") {
        for (let oy = -2; oy <= 2; oy++) {
          for (let ox = -2; ox <= 2; ox++) {
            if (this.getTile(tile.tx + ox, tile.ty + oy)?.type === "water") score += 3;
          }
        }
      }
      if (a.kind === "rabbit" || a.kind === "chicken") score += 1.5;
      if (a.migrate || score < 2) {
        let best = null;
        let bestS = -Infinity;
        for (let i = 0; i < 6; i++) {
          const tx = ((Math.random() * this.w) | 0);
          const ty = ((Math.random() * this.h) | 0);
          let s = this.forestScore(tx, ty);
          if (a.kind === "beaver" || a.kind === "snake") {
            for (let oy = -2; oy <= 2; oy++) {
              for (let ox = -2; ox <= 2; ox++) {
                if (this.getTile(tx + ox, ty + oy)?.type === "water") s += 4;
              }
            }
          }
          if (s > bestS) {
            bestS = s;
            best = this.tileCenter(tx, ty);
          }
        }
        if (best) {
          a.vx = (best.x - a.x) * 0.08;
          a.vy = (best.y - a.y) * 0.08;
          a.migrate = bestS < 3;
        }
      } else {
        a.vx += (Math.random() - 0.5) * 18 * dt;
        a.vy += (Math.random() - 0.5) * 18 * dt;
        a.vx *= 0.96;
        a.vy *= 0.96;
      }
      const speed = ANIMAL_SPEED[a.kind] || 20;
      const len = Math.hypot(a.vx, a.vy) || 1;
      const nx = a.x + (a.vx / len) * Math.min(len, speed) * dt;
      const ny = a.y + (a.vy / len) * Math.min(len, speed) * dt;
      if (this.walkablePixel(nx, ny)) {
        a.x = nx;
        a.y = ny;
      }

      // Predators
      if (a.kind === "wolf" || a.kind === "bear" || a.kind === "snake") {
        const rate = a.kind === "bear" ? 0.08 : a.kind === "snake" ? 0.1 : 0.12;
        const reach = a.kind === "bear" ? 26 : a.kind === "snake" ? 14 : 22;
        if (Math.random() < dt * rate) {
          const prey = this.pickVillager(a.x, a.y, reach);
          if (prey && !prey.dead) {
            const dmg = a.kind === "bear" ? 14 + Math.random() * 12 : a.kind === "snake" ? 5 + Math.random() * 6 : 8 + Math.random() * 10;
            prey.injure("Torso", dmg, this);
            if (a.kind !== "snake") prey.injure(Math.random() < 0.5 ? "LeftArm" : "RightArm", 5, this);
            if (a.kind === "snake" && Math.random() < 0.35) prey.catchIllness?.("flu", 8);
            prey.remember(a.kind === "bear" ? "Mauled by a bear" : a.kind === "snake" ? "Bitten by a snake" : "Mauled by a wolf", this.year);
            prey.shiftPersonality(-2, prey.health > 55 ? 8 : -10, -4, 0, "Beast attack", this);
            this.float(prey.x, prey.y - 14, `${a.kind}!`, "#e07a62");
          }
          if (a.kind !== "snake") {
            const beast = this.animals.find((o) =>
              o.id !== a.id && preyKinds.has(o.kind) && !o.domestic && Math.hypot(o.x - a.x, o.y - a.y) < reach + 4
            );
            if (beast) {
              beast.hp -= a.kind === "bear" ? 14 : 8;
              if (beast.hp <= 0) {
                this.animals = this.animals.filter((o) => o.id !== beast.id);
                this.float(beast.x, beast.y - 8, "kill", "#e07a62");
              }
            }
          }
        }
      }

      // Livestock / domesticables feed tribes
      const livestock = a.kind === "cattle" || a.kind === "sheep" || a.kind === "goat" || a.kind === "chicken" || a.kind === "pig" || a.kind === "horse";
      if (livestock && (a.domestic || Math.random() < dt * 0.02)) {
        const { tribe, dist } = this.nearestTribeAt(a.x, a.y);
        if (tribe && dist < 90 && Math.random() < dt * 0.15) {
          a.domestic = true;
          const yieldFood = a.kind === "cattle" ? 0.35 : a.kind === "pig" ? 0.3 : a.kind === "sheep" || a.kind === "goat" ? 0.22 : a.kind === "horse" ? 0.12 : 0.1;
          tribe.food += yieldFood;
        }
      }

      // Beavers occasionally plant a bush near water
      if (a.kind === "beaver" && Math.random() < dt * 0.04) {
        const t = this.getTile(tile.tx, tile.ty);
        if (t && t.type === "grass" && !t.res && Math.random() < 0.4) {
          t.res = "bush";
          t.amount = 2;
          t.max = 3;
          this.terrainDirty = true;
        }
      }
    }
    if (this.animals.length < 16 && Math.random() < dt * 0.03) {
      const tx = 3 + ((Math.random() * (this.w - 6)) | 0);
      const ty = 3 + ((Math.random() * (this.h - 6)) | 0);
      if (this.forestScore(tx, ty) > 2) {
        const c = this.tileCenter(tx, ty);
        let nearWater = false;
        for (let oy = -2; oy <= 2 && !nearWater; oy++) {
          for (let ox = -2; ox <= 2; ox++) {
            if (this.getTile(tx + ox, ty + oy)?.type === "water") {
              nearWater = true;
              break;
            }
          }
        }
        this.spawnAnimal(c.x, c.y, this.pickWildKind(nearWater));
      }
    }
  }

  tickPollution(dt) {
    this.pollutionAcc += dt;
    if (this.pollutionAcc < 1.2) return;
    this.pollutionAcc = 0;
    const dirtyEra = this.eraIndex(this.era) >= this.eraIndex("industrial");
    if (!dirtyEra && !this.hasTech("steam") && !this.hasTech("factories")) return;
    const clean = this.hasTech("filtration") ? 0.35 : 1;
    for (const s of this.structures) {
      if (!["forge", "factory", "reactor"].includes(s.type) && !(s.type === "kiln")) continue;
      if (s.type === "reactor" && s.meltdown) continue;
      for (let i = 0; i < 3; i++) {
        this.fx.push({
          x: s.tx * this.tile + 8 + (Math.random() * 6 - 3),
          y: s.ty * this.tile + 2,
          vx: (Math.random() - 0.5) * 6,
          vy: -18 - Math.random() * 10,
          life: 1.2,
          max: 1.2,
          color: s.type === "reactor" ? "#9dff9a" : "#6a6a6a",
          size: 2
        });
      }
      for (let y = -4; y <= 4; y++) {
        for (let x = -4; x <= 4; x++) {
          const t = this.getTile(s.tx + x, s.ty + y);
          if (!t || t.type !== "water") continue;
          t.pollution = Math.min(1, (t.pollution || 0) + 0.04 * clean);
          if (t.pollution > 0.35) this.terrainDirty = true;
        }
      }
    }
    for (const v of this.villagers) {
      const t = this.getTileAtPixel(v.x, v.y);
      if (t?.type === "water" && (t.pollution || 0) > 0.5 && Math.random() < 0.08) {
        v.catchIllness("flu", 10);
        v.urge = "food";
        this.addInsight("food", 1.2, v);
      }
    }
  }

  tickFallout(dt) {
    for (const s of this.structures) {
      if (s.type !== "reactor") continue;
      if (!s.meltdown && s.hp < s.maxHp * 0.35 && Math.random() < dt * 0.4) {
        s.meltdown = true;
        this.log("A reactor screams. Fallout blooms across the land.", "bad");
        this.lastDisaster = "fallout";
        for (let y = -5; y <= 5; y++) {
          for (let x = -5; x <= 5; x++) {
            const t = this.getTile(s.tx + x, s.ty + y);
            if (!t) continue;
            t.fallout = Math.max(t.fallout || 0, 1 - Math.hypot(x, y) / 7);
          }
        }
        this.terrainDirty = true;
      }
      if (s.meltdown) {
        for (let y = -6; y <= 6; y++) {
          for (let x = -6; x <= 6; x++) {
            const t = this.getTile(s.tx + x, s.ty + y);
            if (t) t.fallout = Math.max(t.fallout || 0, 0.4);
          }
        }
      }
    }
    for (const v of this.villagers) {
      const t = this.getTileAtPixel(v.x, v.y);
      if ((t?.fallout || 0) > 0.25) {
        if (Math.random() < dt * 0.35) v.catchIllness("radiation", 16);
        v.health -= 1.2 * dt * (t.fallout || 0);
        if (v.health <= 0) this.kill(v, "wounds");
      }
    }
  }

  serialize() {
    const packAff = (m) => [...m.entries()];
    return {
      v: 2,
      time: this.time,
      year: this.year,
      seasonIndex: this.seasonIndex,
      era: this.era,
      seed: this.seed,
      homeX: this.homeX,
      homeY: this.homeY,
      unlocked: [...this.unlocked],
      insight: { ...this.insight },
      religion: this.religion,
      godScore: this.godScore,
      natureScore: this.natureScore,
      weather: this.weather,
      nextId: this.nextId,
      nextTribe: this.nextTribe,
      nextFounderLine: this.nextFounderLine || 1,
      events: this.events.slice(0, 16),
      tribes: this.tribes.map((t) => ({ ...t })),
      structures: this.structures.map((s) => ({ ...s })),
      blueprints: this.blueprints.map((b) => ({ ...b })),
      tiles: this.tiles.map((t) => [
        t.type, t.res || "", t.amount || 0, t.max || 0, +(t.fire > 0 ? t.fire.toFixed(2) : 0),
        t.growth || 0, t.nearWater ? 1 : 0, t.burned || 0
      ]),
      villagers: this.villagers.map((v) => ({
        id: v.id, name: v.name, age: v.age, ageAcc: v.ageAcc, hunger: v.hunger, energy: v.energy,
        health: v.health, intelligence: v.intelligence, religionBelief: v.religionBelief, trait: v.trait,
        aptitude: v.aptitude, tribeId: v.tribeId, x: v.x, y: v.y, skin: v.skin, hair: v.hair,
        hairStyle: v.hairStyle, beard: v.beard, scale: v.scale, facing: v.facing,
        affinity: packAff(v.affinity), tags: packAff(v.tags), memories: v.memories,
        partnerId: v.partnerId, children: v.children, parentIds: v.parentIds, isChild: v.isChild,
        expecting: v.expecting, grief: v.grief, urge: v.urge, isFounder: v.isFounder,
        generation: v.generation, founderLineId: v.founderLineId, founderLineName: v.founderLineName,
        sex: v.sex, empathyScore: v.empathyScore, boldnessScore: v.boldnessScore,
        peacefulnessScore: v.peacefulnessScore, godAlignmentScore: v.godAlignmentScore,
        personalityXP: v.personalityXP, traitTags: v.traitTags, influenceHistory: v.influenceHistory,
        geneticHealth: v.geneticHealth, hereditaryTraits: v.hereditaryTraits,
        inbreedingCoefficient: v.inbreedingCoefficient, illness: v.illness, orphan: v.orphan,
        body: v.body, prosthetics: v.prosthetics,
        socialNeed: v.socialNeed, safetyNeed: v.safetyNeed, surname: v.surname,
        vaccineProgress: v.vaccineProgress || 0,
        skills: v.skills, personalGold: v.personalGold || 0
      })),
      animals: this.animals.map((a) => ({ ...a })),
      goalsDone: { ...(this.goalsDone || {}) },
      festivalCd: this.festivalCd || 0,
      graves: (this.graves || []).slice(-16),
      vaccineReady: !!this.vaccineReady,
      tribeRelations: { ...(this.tribeRelations || {}) },
      wars: (this.wars || []).filter((w) => !w.done)
    };
  }

  static fromSave(data) {
    const sim = Object.create(Simulation.prototype);
    sim.tile = TILE;
    sim.w = MAP_W;
    sim.h = MAP_H;
    sim.seed = data.seed || ((Math.random() * 1e9) | 0);
    sim.tiles = [];
    sim.villagers = [];
    sim.byId = new Map();
    sim.tribes = (data.tribes || []).map((t) => ({ ...t }));
    sim.structures = (data.structures || []).map((s) => ({ ...s }));
    sim.blueprints = (data.blueprints || []).map((b) => ({ ...b }));
    sim.floaters = [];
    sim.fx = [];
    sim.bolts = [];
    sim.events = data.events || [];
    sim.sfx = [];
    sim.namesUsed = new Set((data.villagers || []).map((v) => v.name));
    sim.nextId = data.nextId || 1;
    sim.nextTribe = data.nextTribe || 1;
    sim.nextFounderLine = data.nextFounderLine || 1;
    sim.time = data.time || 0;
    sim.dayLength = 18;
    sim.daysPerSeason = 3;
    sim.year = data.year || 1;
    sim.seasonIndex = data.seasonIndex || 0;
    sim.lastSeason = sim.seasonIndex;
    sim.dayT = 0.22;
    sim.era = data.era || "stone";
    sim.unlocked = new Set(data.unlocked || ["speech", "foraging"]);
    sim.insight = data.insight || { food: 0, tools: 0, shelter: 0, fire: 0, culture: 0, faith: 0 };
    sim.religion = data.religion || null;
    sim.godScore = data.godScore || 0;
    sim.natureScore = data.natureScore || 0;
    sim.weather = data.weather || null;
    sim.flash = 0;
    sim.terrainRev = 1;
    sim.terrainDirty = true;
    sim.selectedId = null;
    sim.hoveredId = null;
    sim.activePower = "inspect";
    sim.cursor = null;
    sim.cooldowns = { bless: 0, inspire: 0, food: 0, lightning: 0, hurricane: 0, wildfire: 0, hut: 0, whisper: 0, possess: 0, rain: 0, quake: 0 };
    sim.cooldownMax = POWER_MAX;
    sim.toast = { text: "Restored local save", life: 3 };
    sim.over = false;
    sim.splitCd = 40;
    sim.possessedId = null;
    sim.placementBuild = null;
    sim.brushMode = null;
    sim.animals = (data.animals || []).map((a) => ({ ...a }));
    sim.pollutionAcc = 0;
    sim.festival = null;
    sim.festivalCd = data.festivalCd || 20;
    sim.graves = data.graves || [];
    sim.vaccineReady = !!data.vaccineReady;
    sim.factionMissions = [];
    sim.factionAcc = 0;
    sim.tribeRelations = data.tribeRelations || {};
    sim.wars = data.wars || [];
    sim.warAcc = 0;
    sim.nationAcc = 0;
    sim.economyAcc = 0;
    for (const t of sim.tribes) {
      t.gold = t.gold ?? 0;
      t.gas = t.gas ?? 0;
      t.atWarWith = t.atWarWith || [];
      t.govTitle = t.govTitle || "Elder";
    }
    sim.goalsDone = data.goalsDone || {};
    sim.quakeT = 0;
    sim.godMemory = 0;
    sim.lastDisaster = null;
    sim.fireSeen = false;
    sim.projectAcc = 0;
    sim.splitAcc = 0;
    sim.faithAcc = 0;
    sim.eventAcc = 12;
    sim.pendingNomads = null;
    sim.prayerRequest = null;
    sim.homeX = data.homeX || 0;
    sim.homeY = data.homeY || 0;
    for (const row of data.tiles || []) {
      sim.tiles.push({
        type: row[0], res: row[1] || null, amount: row[2], max: row[3], fire: row[4] || 0,
        growth: row[5] || 0, nearWater: !!row[6], burned: row[7] || 0, wear: 0, regrow: 0, moist: 0.5
      });
    }
    if (!sim.tiles.length) {
      Object.assign(sim, new Simulation());
      return sim;
    }
    for (const raw of data.villagers || []) {
      const v = new Villager({ ...raw, iqScaled: true });
      v.affinity = new Map(raw.affinity || []);
      v.tags = new Map(raw.tags || []);
      v.job = null;
      v.path = null;
      sim.addVillager(v);
    }
    return sim;
  }

  castInspire(v) {
    if (!v) return this.log("Inspiration needs a mind.", "info");
    if (!this.powerReady("inspire")) return this.log("The spark is still cooling.", "info");
    this.spend("inspire");
    const field = v.urge || v.aptitude || "tools";
    const options = TECHS.filter((t) => !this.unlocked.has(t.id) && this.available(t) && t.field === field);
    const tech = options.sort((a, b) => a.cost - b.cost)[0];
    if (tech) {
      const need = this.effectiveCost(tech) - (this.insight[field] || 0);
      this.addInsight(field, Math.max(need, 6), v);
    } else {
      this.addInsight(field, 18, v);
      v.ideaTimer = 4;
    }
    v.remember("A vision arrived unbidden", this.year);
    v.religionBelief = Math.min(100, v.religionBelief + 8);
    this.godScore += 1;
    this.float(v.x, v.y - 20, "idea", "#f0d78c");
    this.sfx.push("discover");
    this.log(`${v.name} is struck by an idea.`, "god");
  }

  castFood(x, y) {
    if (!this.powerReady("food")) return this.log("The sky is empty for a moment.", "info");
    if (this.collectOfferingsNear(x, y)) {
      this.spend("food");
      return;
    }
    const t = this.worldToTile(x, y);
    const tile = this.getTile(t.tx, t.ty);
    if (!tile || tile.type === "water" || tile.type === "rock") return this.log("There is nowhere to lay the gift.", "info");
    this.spend("food");
    tile.res = "manna";
    tile.amount = 6;
    tile.max = 6;
    tile.fire = 0;
    this.godScore += 2;
    this.godMemory = Math.max(this.godMemory, 20);
    const c = this.tileCenter(t.tx, t.ty);
    this.burst(c.x, c.y, "#f0d78c", 12);
    this.sfx.push("bless");
    this.witness(c.x, c.y, 120, (v) => {
      v.religionBelief = Math.min(100, v.religionBelief + 5);
    });
    this.log("Food falls from a silent sky.", "god");
  }

  castLightning(x, y) {
    if (!this.powerReady("lightning")) return this.log("The clouds will not answer yet.", "info");
    this.spend("lightning");
    this.strike(x, y, true);
  }

  strike(x, y, fromGod) {
    const pts = [{ x: x + (Math.random() * 50 - 25), y: y - 230 }];
    let cx = pts[0].x;
    let cy = pts[0].y;
    while (cy < y) {
      cy += 18 + Math.random() * 28;
      cx += Math.random() * 36 - 18;
      if (cy >= y) {
        cy = y;
        cx = x;
      }
      pts.push({ x: cx, y: cy });
    }
    this.bolts.push({ pts, life: 0.42, max: 0.42 });
    this.flash = 1;
    this.sfx.push("lightning");
    this.burst(x, y, "#f4f7ff", 8);
    const tile = this.getTileAtPixel(x, y);
    if (tile && tile.type !== "water" && tile.type !== "rock") tile.fire = Math.max(tile.fire, 0.7);
    for (const v of this.villagers) {
      const d = Math.hypot(v.x - x, v.y - y);
      if (d > 36) continue;
      const dmg = (d < 14 ? 58 : 28) * (v.isChild ? 0.7 : 1);
      v.health -= dmg;
      v.injure?.(Math.random() < 0.5 ? "Head" : "Torso", dmg * 0.45, this);
      if (Math.random() < 0.4) v.injure?.(Math.random() < 0.5 ? "LeftArm" : "RightArm", 20, this);
      v.remember("The sky spoke in fire", this.year);
      if (fromGod && v.trait === "Aggressive") {
        v.religionBelief = Math.max(0, v.religionBelief - 6);
        v.remember("Struck without cause", this.year);
      }
      if (v.health <= 0) this.kill(v, "lightning");
    }
    this.witness(x, y, 110, (v) => {
      if (fromGod && v.trait === "Devout") {
        v.religionBelief = Math.min(100, v.religionBelief + 14);
        v.remember("The god speaks in light", this.year);
      } else v.religionBelief = Math.min(100, v.religionBelief + 4);
    });
    if (fromGod) {
      this.godScore += 1;
      this.natureScore += 1;
      this.log("A bolt answers your hand.", "god");
    }
    this.addInsight("faith", 6, this.villagers.find((v) => v.trait === "Devout") || null);
  }

  castHurricane(x, y) {
    if (!this.powerReady("hurricane")) return this.log("The great wind is still elsewhere.", "info");
    if (this.weather?.type === "hurricane") return;
    this.spend("hurricane");
    this.weather = { type: "hurricane", t: 0, dur: 11, eyeX: x, eyeY: y, angle: Math.random() * Math.PI * 2 };
    this.natureScore += 2;
    this.lastDisaster = "hurricane";
    this.godMemory = 24;
    this.sfx.push("storm");
    this.log("A hurricane screams across the land.", "bad");
    this.witness(x, y, 240, (v) => {
      v.religionBelief = Math.min(100, v.religionBelief + (v.trait === "Devout" ? 8 : 3));
    });
  }

  castWildfire(x, y) {
    if (!this.powerReady("wildfire")) return this.log("The flames are gathering their breath.", "info");
    const c = this.worldToTile(x, y);
    const origin = this.getTile(c.tx, c.ty);
    if (!origin || origin.type === "water" || origin.type === "rock") return this.log("Fire will not take there.", "info");
    this.spend("wildfire");
    this.fireSeen = true;
    for (let y2 = -1; y2 <= 1; y2++) {
      for (let x2 = -1; x2 <= 1; x2++) {
        const t = this.getTile(c.tx + x2, c.ty + y2);
        if (!t || t.type === "water" || t.type === "rock") continue;
        t.fire = 1;
      }
    }
    this.natureScore += 2;
    this.lastDisaster = "wildfire";
    this.godMemory = Math.max(this.godMemory, 18);
    this.sfx.push("fire");
    this.log("You kindle a wildfire.", "bad");
  }

  castHut(x, y) {
    if (!this.powerReady("hut")) return;
    if (!this.hasTech("mud_huts")) return this.log("No one yet knows how to raise a hut.", "info");
    const c = this.worldToTile(x, y);
    const tile = this.getTile(c.tx, c.ty);
    if (!tile || (tile.type !== "grass" && tile.type !== "path" && tile.type !== "sand") || tile.res) {
      return this.log("That ground will not hold a wall.", "info");
    }
    const tribe = this.nearestTribe(x, y);
    if (!tribe || tribe.wood < 10) return this.log("The nearest camp lacks the wood.", "info");
    if (this.structures.some((s) => s.tx === c.tx && s.ty === c.ty) || this.blueprints.some((s) => s.tx === c.tx && s.ty === c.ty)) {
      return this.log("Something already stands there.", "info");
    }
    this.spend("hut");
    tribe.wood -= 10;
    this.blueprints.push({ id: this.nextId++, type: "hut", tx: c.tx, ty: c.ty, tribeId: tribe.id, progress: 8 });
    this.log("You mark the ground for a hut.", "god");
    this.sfx.push("click");
  }

  pickVillager(x, y, radius = 18) {
    let best = null;
    let d = radius + 6;
    for (const v of this.villagers) {
      let reach = v.isChild ? 12 : radius;
      if (v.dilemma) reach = Math.max(reach, 26);
      if (v.job?.type === "sleep") reach = Math.max(reach, 22);
      if (v.carried) reach = Math.max(reach, 24);
      const cy = v.job?.type === "sleep" ? v.y - 4 : v.y - 8;
      const dd = Math.hypot(v.x - x, cy - y);
      if (dd < d && dd < reach) {
        d = dd;
        best = v;
      }
    }
    return best;
  }
}
