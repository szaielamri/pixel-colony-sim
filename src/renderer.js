/** Procedural pixel renderer: terrain cache, villagers, weather, emotes. */

const BODY = [
  "................",
  "................",
  "................",
  ".....ssssss.....",
  "....ssssssss....",
  "....sswsswss....",
  "....ssssssss....",
  ".....ssmmss.....",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................"
];

const HAIR = [
  [
    "................",
    ".....hhhhhh.....",
    "....hhhhhhhh....",
    "....hh....hh....",
    "................"
  ],
  [
    "................",
    "....hhhhhhhh....",
    "..hhhhhhhhhhhh..",
    "...hh......hh...",
    "...h........h...",
    "...h........h..."
  ],
  [
    "................",
    "......hhhh......",
    ".....hhhhhh.....",
    "....hss..ssh....",
    "................"
  ],
  [
    "................",
    ".....hhhhhh.....",
    "....hhhhhhhh....",
    "................",
    "................",
    ".....hhhhhh....."
  ]
];

const BEARD = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "....h......h....",
  ".....hhhhhh....."
];

const STONE_CLOTH = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "......ffff......",
  ".....fffffff....",
  ".....ffttfff....",
  ".....fffffff....",
  "......fffff....."
];

const BRONZE_CLOTH = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  ".....ttttt......",
  "....ttttttt.....",
  "....ttgtttt.....",
  "....ttttttt.....",
  ".....tttttt.....",
  "......tttt......"
];

const MEDIEVAL_CLOTH = [
  "................",
  "......aaaa......",
  ".....aaaaaa.....",
  ".....aa..aa.....",
  "................",
  "................",
  "................",
  "......aaaa......",
  ".....aaaaaa.....",
  "....aappaapa....",
  "....aaaaaaaa....",
  ".....aaaaaa.....",
  "......tttt......"
];

const LEGS_A = [
  "......ll..ll....",
  "......ll..ll....",
  ".....lll..lll..."
];

const LEGS_B = [
  ".....ll....ll...",
  "......ll..ll....",
  "......lll.lll..."
];

const HEART = ["hh.hh", "hhhhh", "hhhhh", ".hhh.", "..h.."];
const ANGER = ["h...h", ".h.h.", "..h..", ".h.h.", "h...h"];
const BULB = [".yyy.", "y.w.y", "yyyyy", ".ggg.", "..g.."];
const SLEEP = ["zz...", ".z...", ".....", ".....", "....."];
const PRAY = ["..y..", ".y.y.", "..y..", ".y.y.", "y...y"];
const QUESTION = [".yyy.", "y...y", "...y.", "..y..", "..y.."];
const SICK = [".ggg.", "g...g", ".g.g.", "..g..", "....."];
const BROKEN = ["h...h", ".h.h.", "..h..", ".h.h.", "h...h"];

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

function blit(ctx, rows, ox, oy, pal) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === ".") continue;
      const col = pal[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cam = { x: 0, y: 0, zoom: 3 };
    this.terrain = null;
    this.terrainRev = -1;
    this.miniCache = null;
    this.miniRev = -1;
    this.birds = Array.from({ length: 5 }, (_, i) => ({
      x: 80 + i * 140,
      y: 40 + (i % 3) * 30,
      s: 18 + i * 4,
      p: i
    }));
    this.rain = [];
    this.whirls = [];
    this.minimap = { x: 16, y: 16, w: 168, h: 116 };
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  focus(x, y) {
    this.cam.x = x;
    this.cam.y = y;
  }

  viewSize() {
    return { w: this.canvas.width, h: this.canvas.height };
  }

  screenToWorld(sx, sy) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((sx - rect.left) / rect.width) * this.canvas.width;
    const y = ((sy - rect.top) / rect.height) * this.canvas.height;
    const { w, h } = this.viewSize();
    return {
      x: (x - w / 2) / this.cam.zoom + this.cam.x,
      y: (y - h / 2) / this.cam.zoom + this.cam.y
    };
  }

  worldToScreen(x, y) {
    const { w, h } = this.viewSize();
    return {
      x: (x - this.cam.x) * this.cam.zoom + w / 2,
      y: (y - this.cam.y) * this.cam.zoom + h / 2
    };
  }

  palette(v, era) {
    const tribe = v._tribeColor || "#d08a45";
    const pal = {
      s: v.skin,
      S: shade(v.skin, -28),
      w: "#f7f4ee",
      m: "#8d4038",
      h: v.hair,
      H: shade(v.hair, -30),
      f: "#7a5340",
      F: "#4e3424",
      t: tribe,
      T: shade(tribe, -28),
      g: "#e0b15a",
      a: "#b7c0c8",
      A: "#7c868f",
      p: "#e7eef4",
      l: shade(v.skin, -18),
      y: "#f2d36b",
      G: "#6aa85a"
    };
    if (era === "medieval") {
      pal.l = "#8b949c";
      pal.h = v.hair;
    } else if (era === "bronze") {
      pal.l = shade(tribe, -22);
    }
    return pal;
  }

  draw(sim, time) {
    this.resize();
    const ctx = this.ctx;
    const { w, h } = this.viewSize();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    this.drawSky(ctx, sim, w, h, time);
    this.ensureTerrain(sim);

    const z = this.cam.zoom;
    ctx.setTransform(z, 0, 0, z, Math.round(-this.cam.x * z + w / 2), Math.round(-this.cam.y * z + h / 2));
    ctx.drawImage(this.terrain, 0, 0);
    this.drawVisibleGround(ctx, sim, time);
    this.drawObjects(ctx, sim, time);
    this.drawNight(ctx, sim);
    this.drawWeatherWorld(ctx, sim, time);
    this.drawFx(ctx, sim);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.drawLabels(ctx, sim, time);
    this.drawBirds(ctx, time);
    this.drawFlash(ctx, sim, w, h);
    this.drawMinimap(ctx, sim, h);
    this.drawCursor(ctx, sim);
  }

  drawBirds(ctx, time) {
    ctx.fillStyle = "rgba(40,32,28,0.55)";
    for (const b of this.birds) {
      b.x += b.s * 0.016;
      if (b.x > this.canvas.width + 30) b.x = -30;
      const by = 118 + b.p * 10;
      const wing = Math.sin(time * 8 + b.p) * 3;
      ctx.fillRect(b.x, by, 8, 2);
      ctx.fillRect(b.x + 3, by - wing, 2, 2);
    }
  }

  drawSky(ctx, sim, w, h, time) {
    const t = sim.dayT;
    const noon = t > 0.12 && t < 0.62;
    const dusk = t >= 0.62 && t < 0.78;
    const night = t >= 0.78 || t < 0.08;
    let top;
    let bot;
    if (night) {
      top = "#070b16";
      bot = "#1a140f";
    } else if (dusk) {
      top = "#3a2744";
      bot = "#c46a3a";
    } else if (t < 0.16) {
      top = "#f0b07a";
      bot = "#87b6d2";
    } else {
      top = noon ? "#7eb6d6" : "#9ec8df";
      bot = "#d7ecf6";
    }
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top);
    g.addColorStop(1, bot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    if (night) {
      ctx.fillStyle = "#f4f7ff";
      for (let i = 0; i < 28; i++) {
        const sx = (i * 97) % w;
        const sy = (i * 53) % (h * 0.45);
        ctx.globalAlpha = 0.35 + (i % 3) * 0.2;
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.globalAlpha = 1;
    }

    const ang = (t - 0.02) * Math.PI;
    const sx = w * 0.5 + Math.cos(Math.PI - ang) * w * 0.38;
    const sy = h * 0.55 - Math.sin(ang) * h * 0.42;
    ctx.beginPath();
    ctx.fillStyle = night ? "#f3ecd4" : dusk ? "#ffb15a" : "#fff4c8";
    ctx.arc(sx, sy, night ? 16 : 22, 0, Math.PI * 2);
    ctx.fill();
    if (night) {
      ctx.fillStyle = "#070b16";
      ctx.beginPath();
      ctx.arc(sx + 7, sy - 4, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    }

  ensureTerrain(sim) {
    const pw = sim.w * sim.tile;
    const ph = sim.h * sim.tile;
    if (!this.terrain) {
      this.terrain = document.createElement("canvas");
      this.terrain.width = pw;
      this.terrain.height = ph;
    }
    if (this.terrainRev === sim.terrainRev) return;
    this.terrainRev = sim.terrainRev;
    const c = this.terrain.getContext("2d");
    c.imageSmoothingEnabled = false;
    const winter = sim.seasonIndex === 3;
    const autumn = sim.seasonIndex === 2;
    const spring = sim.seasonIndex === 0;
    for (let ty = 0; ty < sim.h; ty++) {
      for (let tx = 0; tx < sim.w; tx++) {
        const tile = sim.getTile(tx, ty);
        const x = tx * sim.tile;
        const y = ty * sim.tile;
        const n = sim.randAt(tx, ty);
        let base = "#4d8f3f";
        if (tile.type === "water") base = n > 0.5 ? "#1d6d99" : "#185a86";
        else if (tile.type === "sand") base = n > 0.5 ? "#e0cb8a" : "#d2b56e";
        else if (tile.type === "rock") base = n > 0.5 ? "#8b877f" : "#6f6c66";
        else if (tile.type === "path") base = "#8b6a42";
        else if (tile.type === "farm") base = "#6a4528";
        else if (tile.type === "barren") base = n > 0.5 ? "#6a5a48" : "#5a4a3a";
        else if (winter) base = n > 0.55 ? "#e7eef2" : "#d5e0d8";
        else if (autumn) base = n > 0.5 ? "#c4a04a" : "#7d8a34";
        else base = n > 0.66 ? "#5ea64a" : n > 0.33 ? "#3f7d34" : "#468a3c";
        if (tile.burned > 0.2 && tile.type !== "water") base = "#3a332e";
        if (tile.type === "water" && (tile.pollution || 0) > 0.35) base = n > 0.5 ? "#3d6a52" : "#2f5544";
        if ((tile.fallout || 0) > 0.2) base = shade(base.startsWith("#") ? base : "#6a6a4a", 20);
        c.fillStyle = base;
        c.fillRect(x, y, sim.tile, sim.tile);
        if ((tile.fallout || 0) > 0.35) {
          c.fillStyle = `rgba(140,255,120,${0.12 + tile.fallout * 0.2})`;
          c.fillRect(x, y, sim.tile, sim.tile);
        }
        if (tile.type === "grass" || tile.type === "sand") {
          c.fillStyle = winter ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.08)";
          for (let i = 0; i < 4; i++) {
            const px = x + ((sim.randAt(tx + i * 3, ty + 11) * 14) | 0);
            const py = y + ((sim.randAt(tx + 5, ty + i * 7) * 14) | 0);
            c.fillRect(px, py, 1, 1);
          }
        }
        if (spring && tile.type === "grass" && n > 0.86) {
          c.fillStyle = n > 0.93 ? "#f0d0e0" : "#f2e07a";
          c.fillRect(x + 6, y + 8, 2, 2);
        }
        if (tile.type === "farm") {
          c.fillStyle = tile.growth > 0.85 ? "#6ea24a" : tile.growth > 0.3 ? "#87b85a" : "#5a3a22";
          for (let row = 3; row < 14; row += 4) {
            c.fillRect(x + 2, y + row, 12, tile.growth > 0.3 ? 2 : 1);
          }
        }
        if (tile.type === "rock") {
          c.fillStyle = "#b7b2aa";
          c.fillRect(x + 4, y + 5, 3, 2);
          c.fillRect(x + 9, y + 9, 2, 2);
        }
      }
    }
  }

  visible(sim) {
    const { w, h } = this.viewSize();
    const x0 = this.cam.x - w / 2 / this.cam.zoom - 24;
    const y0 = this.cam.y - h / 2 / this.cam.zoom - 24;
    const x1 = this.cam.x + w / 2 / this.cam.zoom + 24;
    const y1 = this.cam.y + h / 2 / this.cam.zoom + 48;
    return {
      tx0: Math.max(0, Math.floor(x0 / sim.tile)),
      ty0: Math.max(0, Math.floor(y0 / sim.tile)),
      tx1: Math.min(sim.w - 1, Math.floor(x1 / sim.tile)),
      ty1: Math.min(sim.h - 1, Math.floor(y1 / sim.tile))
    };
  }

  drawVisibleGround(ctx, sim, time) {
    const v = this.visible(sim);
    const winter = sim.seasonIndex === 3;
    for (let ty = v.ty0; ty <= v.ty1; ty++) {
      for (let tx = v.tx0; tx <= v.tx1; tx++) {
        const tile = sim.getTile(tx, ty);
        const x = tx * sim.tile;
        const y = ty * sim.tile;
        if (tile.type === "water") {
          const wave = Math.sin(time * 2.2 + tx * 0.7 + ty * 0.4) * 1.2;
          ctx.fillStyle = "rgba(210,240,255,0.28)";
          ctx.fillRect(x + 2, y + 8 + wave, 6, 1);
          ctx.fillRect(x + 9, y + 4 + wave, 4, 1);
        } else if ((tile.type === "grass" || tile.type === "sand") && ((tx + ty) & 1) === 0) {
          const sway = Math.sin(time * 1.6 + tx) * (winter ? 0.2 : 0.8);
          ctx.fillStyle = winter ? "#f7fbff" : sim.seasonIndex === 2 ? "#d2b15a" : "#2f6a2c";
          ctx.fillRect(x + 3 + sway, y + 12, 1, 3);
        }
        if (tile.fire > 0) {
          const f = tile.fire;
          const flick = Math.abs(Math.sin(time * 18 + tx * 3));
          ctx.fillStyle = `rgba(40,20,12,${0.25 + f * 0.3})`;
          ctx.fillRect(x, y, sim.tile, sim.tile);
          ctx.fillStyle = flick > 0.5 ? "#ffb14a" : "#e25822";
          ctx.fillRect(x + 6, y + 10 - flick * 4, 3, 4);
          ctx.fillStyle = "#ffe7a8";
          ctx.fillRect(x + 7, y + 12 - flick * 3, 1, 2);
        }
      }
    }
  }

  drawObjects(ctx, sim, time) {
    const v = this.visible(sim);
    const items = [];
    for (let ty = v.ty0; ty <= v.ty1; ty++) {
      for (let tx = v.tx0; tx <= v.tx1; tx++) {
        const tile = sim.getTile(tx, ty);
        if (tile.res) items.push({ y: (ty + 1) * sim.tile, kind: "res", tx, ty, tile });
      }
    }
    for (const s of sim.structures) items.push({ y: (s.ty + 1) * sim.tile, kind: "struct", s });
    for (const b of sim.blueprints) items.push({ y: (b.ty + 1) * sim.tile, kind: "blue", b });
    for (const a of sim.animals || []) items.push({ y: a.y + 1, kind: "animal", a });
    for (const p of sim.villagers) {
      const tribe = sim.tribeOf(p.tribeId);
      p._tribeColor = tribe?.color || "#d08a45";
      items.push({ y: p.y + 1, kind: "villager", p });
    }
    items.sort((a, b) => a.y - b.y);
    for (const item of items) {
      if (item.kind === "res") this.drawResource(ctx, sim, item, time);
      else if (item.kind === "struct") this.drawStructure(ctx, sim, item.s, time);
      else if (item.kind === "blue") this.drawBlueprint(ctx, item.b, time);
      else if (item.kind === "animal") this.drawAnimal(ctx, item.a, time);
      else this.drawVillagerWorld(ctx, item.p, sim, time);
    }
    this.drawPlacementGhost(ctx, sim);
  }

  drawAnimal(ctx, a, time) {
    const bob = Math.sin(time * 6 + a.phase) * 1.2;
    ctx.save();
    ctx.translate(Math.round(a.x), Math.round(a.y - bob));
    if (a.kind === "wolf") {
      ctx.fillStyle = "#5a5a62";
      ctx.fillRect(-5, -4, 10, 5);
      ctx.fillRect(4, -6, 4, 3);
      ctx.fillStyle = "#c45a4a";
      ctx.fillRect(7, -5, 1, 1);
    } else {
      ctx.fillStyle = "#c4a07a";
      ctx.fillRect(-4, -5, 8, 5);
      ctx.fillRect(3, -8, 3, 3);
      ctx.fillStyle = "#8d6a45";
      ctx.fillRect(-3, 0, 1, 3);
      ctx.fillRect(2, 0, 1, 3);
    }
    ctx.restore();
  }

  drawPlacementGhost(ctx, sim) {
    if (!sim.cursor) return;
    const { tx, ty } = sim.worldToTile(sim.cursor.x, sim.cursor.y);
    const x = tx * sim.tile;
    const y = ty * sim.tile;
    if (sim.placementBuild) {
      const tile = sim.getTile(tx, ty);
      const ok = tile && tile.type !== "water" && tile.type !== "rock" && !tile.res;
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = ok ? "#f0d78c" : "#e07a62";
      ctx.strokeRect(x + 1.5, y + 1.5, 13, 13);
      ctx.fillStyle = ok ? "#f0d78c" : "#e07a62";
      ctx.fillRect(x + 5, y + 5, 6, 6);
      ctx.restore();
    } else if (sim.brushMode) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = sim.brushMode === "dig" ? "#4aa0d0" : sim.brushMode === "plant" ? "#5aaa4a" : "#d0b06a";
      ctx.fillRect(x, y, sim.tile, sim.tile);
      ctx.restore();
    }
  }

  drawResource(ctx, sim, item, time) {
    const { tx, ty, tile } = item;
    const x = tx * sim.tile + 8;
    const y = ty * sim.tile + 14;
    const wind = (sim.weather?.type === "hurricane" ? 3.2 : sim.weather?.type === "rain" ? 1.1 : 0.5);
    const sway = Math.sin(time * 1.4 + tx) * wind;
    if (tile.res === "tree" && tile.amount > 0) {
      const h = 6 + tile.amount * 2;
      ctx.fillStyle = "#5a3a24";
      ctx.fillRect(x - 1, y - h, 2, h);
      const leaf = sim.seasonIndex === 3 ? "#dfe7ea" : sim.seasonIndex === 2 ? "#d06a2a" : sim.seasonIndex === 0 ? "#3e9a45" : "#2f7d34";
      ctx.fillStyle = leaf;
      ctx.fillRect(x - 6 + sway, y - h - 6, 12, 7);
      ctx.fillRect(x - 4 + sway, y - h - 9, 8, 4);
      if (sim.seasonIndex === 0) {
        ctx.fillStyle = "#f2b6c8";
        ctx.fillRect(x - 3 + sway, y - h - 4, 1, 1);
      }
    } else if (tile.res === "tree") {
      ctx.fillStyle = "#6b4a30";
      ctx.fillRect(x - 2, y - 3, 4, 3);
    } else if (tile.res === "bush") {
      ctx.fillStyle = sim.seasonIndex === 2 ? "#c47a32" : "#2f7a38";
      ctx.fillRect(x - 5, y - 5, 10, 5);
      ctx.fillRect(x - 3, y - 7, 6, 3);
      if (tile.amount > 0) {
        ctx.fillStyle = "#d24b4b";
        ctx.fillRect(x - 3, y - 4, 2, 2);
        ctx.fillRect(x + 1, y - 6, 2, 2);
      }
    } else if (tile.res === "stone") {
      ctx.fillStyle = "#8e8a84";
      ctx.fillRect(x - 5, y - 4, 7, 4);
      ctx.fillStyle = "#b7b2aa";
      ctx.fillRect(x - 1, y - 6, 5, 4);
    } else if (tile.res === "manna") {
      const pulse = 0.65 + Math.sin(time * 5) * 0.35;
      ctx.fillStyle = `rgba(240,215,140,${pulse})`;
      ctx.fillRect(x - 4, y - 5, 8, 5);
      ctx.fillStyle = "#fff6d0";
      ctx.fillRect(x - 1, y - 7, 2, 2);
    }
  }

  drawStructure(ctx, sim, s, time) {
    const x = s.tx * sim.tile;
    const y = s.ty * sim.tile;
    const tribe = sim.tribeOf(s.tribeId);
    const color = tribe?.color || "#d08a45";
    if (s.type === "campfire") {
      ctx.fillStyle = "#5c3a28";
      ctx.fillRect(x + 4, y + 10, 8, 2);
      ctx.fillRect(x + 6, y + 8, 2, 6);
      const flick = Math.sin(time * 16) > 0;
      ctx.fillStyle = flick ? "#ffd27a" : "#f08a32";
      ctx.fillRect(x + 6, y + 4, 4, 5);
      ctx.fillStyle = "#fff1c2";
      ctx.fillRect(x + 7, y + 6, 2, 2);
    } else if (s.type === "hut" || s.type === "longhouse") {
      ctx.fillStyle = "#c4a27a";
      ctx.fillRect(x + 2, y + 7, 12, 8);
      ctx.fillStyle = "#6b3e2a";
      ctx.fillRect(x + 6, y + 10, 3, 5);
      ctx.fillStyle = color;
      for (let i = 0; i < 6; i++) ctx.fillRect(x + 2 + i, y + 6 - i, 12 - i * 2, 2);
      ctx.fillStyle = color;
      ctx.fillRect(x + 7, y + 3, 2, 2);
    } else if (s.type === "shrine") {
      ctx.fillStyle = "#9a958c";
      ctx.fillRect(x + 3, y + 11, 10, 3);
      ctx.fillRect(x + 6, y + 4, 4, 8);
      ctx.fillStyle = color;
      ctx.fillRect(x + 5, y + 2, 6, 3);
      const glow = 0.4 + Math.sin(time * 3) * 0.2;
      ctx.fillStyle = `rgba(240,220,140,${glow})`;
      ctx.fillRect(x + 7, y + 6, 2, 2);
    } else if (s.type === "wall") {
      ctx.fillStyle = "#8d8982";
      ctx.fillRect(x + 1, y + 4, 14, 10);
      ctx.fillStyle = "#d5d0c8";
      ctx.fillRect(x + 2, y + 5, 5, 3);
      ctx.fillRect(x + 9, y + 9, 5, 3);
    } else if (s.type === "forge") {
      ctx.fillStyle = "#6e6a64";
      ctx.fillRect(x + 2, y + 6, 12, 8);
      ctx.fillStyle = "#3a3532";
      ctx.fillRect(x + 5, y + 8, 6, 4);
      ctx.fillStyle = Math.sin(time * 12) > 0 ? "#ffb15a" : "#e25822";
      ctx.fillRect(x + 6, y + 9, 4, 2);
    } else if (s.type === "storage") {
      ctx.fillStyle = "#8d6a42";
      ctx.fillRect(x + 2, y + 5, 12, 9);
      ctx.fillStyle = color;
      ctx.fillRect(x + 4, y + 7, 3, 5);
      ctx.fillRect(x + 9, y + 7, 3, 5);
    } else if (s.type === "research") {
      ctx.fillStyle = "#c4b08a";
      ctx.fillRect(x + 3, y + 8, 10, 5);
      ctx.fillStyle = "#f0d78c";
      ctx.fillRect(x + 5, y + 5, 6, 3);
      ctx.fillStyle = "#6aaa48";
      ctx.fillRect(x + 7, y + 3, 2, 2);
    } else if (s.type === "workbench") {
      ctx.fillStyle = "#a07a48";
      ctx.fillRect(x + 2, y + 8, 12, 5);
      ctx.fillStyle = "#d8c7a2";
      ctx.fillRect(x + 4, y + 5, 8, 3);
      ctx.fillStyle = "#9aa3ad";
      ctx.fillRect(x + 10, y + 3, 2, 3);
    } else if (s.type === "factory") {
      ctx.fillStyle = "#5a5a62";
      ctx.fillRect(x + 1, y + 4, 14, 10);
      ctx.fillStyle = "#8a8a92";
      ctx.fillRect(x + 3, y + 1, 3, 5);
      ctx.fillRect(x + 9, y + 0, 3, 6);
      ctx.fillStyle = "rgba(80,80,80,0.5)";
      ctx.fillRect(x + 3, y - 2 - Math.sin(time * 3) * 2, 2, 3);
    } else if (s.type === "reactor") {
      ctx.fillStyle = s.meltdown ? "#4a8a4a" : "#4a5560";
      ctx.fillRect(x + 2, y + 4, 12, 10);
      ctx.fillStyle = s.meltdown ? "#9dff9a" : "#7ad0ff";
      ctx.fillRect(x + 6, y + 7, 4, 4);
      if (s.meltdown) {
        ctx.fillStyle = `rgba(160,255,120,${0.3 + Math.sin(time * 8) * 0.2})`;
        ctx.fillRect(x, y, 16, 16);
      }
    }
  }

  drawBlueprint(ctx, b) {
    const x = b.tx * 16;
    const y = b.ty * 16;
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = "#f0d78c";
    ctx.strokeRect(x + 2.5, y + 2.5, 11, 11);
    ctx.fillStyle = "#f0d78c";
    const bars = Math.max(1, Math.round((b.progress / 100) * 4));
    for (let i = 0; i < bars; i++) ctx.fillRect(x + 4, y + 12 - i * 2, 8, 1);
    ctx.restore();
  }

  drawVillagerWorld(ctx, v, sim, time) {
    const moving = v.moving;
    const speed = 8;
    const s = Math.sin(time * speed + v.phase);
    const bounce = moving ? Math.abs(s) * 1.7 : v.acting ? Math.abs(Math.sin(time * 13 + v.phase)) * 0.45 : 0;
    if (v.possessed || sim.possessedId === v.id) {
      const pulse = 0.35 + Math.sin(time * 5) * 0.15;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#f0d78c";
      ctx.beginPath();
      ctx.ellipse(v.x, v.y - 8 - bounce, 11, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "rgba(240,215,140,0.85)";
      ctx.strokeRect(Math.round(v.x) - 9, Math.round(v.y) - 20 - bounce, 18, 22);
    }
    ctx.save();
    ctx.translate(Math.round(v.x), Math.round(v.y));
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(-4, -1, 8, 2);
    ctx.translate(0, -bounce);
    if (moving) {
      ctx.rotate(s * 0.08);
      const land = 1 - Math.abs(s);
      ctx.scale(1 + land * 0.08, 1 - land * 0.06);
    } else if (v.acting) {
      ctx.rotate(Math.sin(time * 13 + v.phase) * 0.05);
    }
    const sc = (v.isChild ? 0.66 : 1) * (v.scale || 1);
    ctx.scale(v.facing * sc, sc);
    this.drawVillagerSprite(ctx, v, sim, time);
    ctx.restore();

    if (v.emote) this.drawEmote(ctx, v.x, v.y - 18 - bounce, v.emote, time);
    if (v.illness) {
      ctx.fillStyle = v.illness.type === "radiation" ? "rgba(140,255,120,0.5)" : "rgba(200,220,180,0.45)";
      ctx.fillRect(Math.round(v.x) - 1, Math.round(v.y) - 12 - bounce, 2, 2);
    }
    if (sim.selectedId === v.id || sim.hoveredId === v.id) {
      ctx.strokeStyle = sim.selectedId === v.id ? "#f0d78c" : "rgba(255,255,255,0.7)";
      ctx.strokeRect(Math.round(v.x) - 7, Math.round(v.y) - 18 - bounce, 14, 18);
    }
  }

  drawVillagerSprite(ctx, v, sim, time) {
    const era = sim.era;
    const pal = this.palette(v, era);
    if (v.illness?.type === "radiation") pal.s = "#b8d8a0";
    const step = Math.sin(time * 8 + v.phase) > 0;
    const leftLeg = (v.body?.LeftLeg ?? 100) > 0 || v.prosthetics?.LeftLeg;
    const rightLeg = (v.body?.RightLeg ?? 100) > 0 || v.prosthetics?.RightLeg;
    if (leftLeg || rightLeg) {
      blit(ctx, step ? LEGS_A : LEGS_B, -8, -3, pal);
      if (v.prosthetics?.LeftLeg === "peg") {
        ctx.fillStyle = "#8d6a42";
        ctx.fillRect(-5, -1, 1, 4);
      }
      if (v.prosthetics?.RightLeg === "peg") {
        ctx.fillStyle = "#8d6a42";
        ctx.fillRect(3, -1, 1, 4);
      }
    } else {
      ctx.fillStyle = pal.s;
      ctx.fillRect(-3, -1, 6, 2);
    }
    blit(ctx, BODY, -8, -16, pal);
    const hair = HAIR[v.hairStyle % HAIR.length];
    if (!(era === "medieval" || era === "industrial" || era === "nuclear")) blit(ctx, hair, -8, -16, pal);
    if (v.beard && !v.isChild && v.age > 24 && era !== "medieval") blit(ctx, BEARD, -8, -16, pal);
    const cloth = (era === "medieval" || era === "industrial" || era === "nuclear")
      ? MEDIEVAL_CLOTH
      : era === "bronze" ? BRONZE_CLOTH : STONE_CLOTH;
    blit(ctx, cloth, -8, -16, pal);
    if (v.prosthetics?.LeftArm === "hook" || v.prosthetics?.RightArm === "hook") {
      ctx.fillStyle = "#9aa3ad";
      ctx.fillRect(v.prosthetics?.RightArm === "hook" ? 5 : -7, -9, 2, 1);
      ctx.fillRect(v.prosthetics?.RightArm === "hook" ? 6 : -6, -8, 1, 3);
    }
    if ((v.body?.LeftArm ?? 100) <= 0 && !v.prosthetics?.LeftArm) {
      ctx.fillStyle = "#1a1613";
      ctx.fillRect(-7, -10, 2, 4);
    }
    if ((v.body?.RightArm ?? 100) <= 0 && !v.prosthetics?.RightArm) {
      ctx.fillStyle = "#1a1613";
      ctx.fillRect(5, -10, 2, 4);
    }
    if (v.religionBelief > 48 && sim.religion) {
      ctx.fillStyle = sim.religion.deity === "player" ? "#f0d78c" : "#8fd0a4";
      ctx.fillRect(-1, -13, 1, 1);
    }
    if (v.expecting > 0) {
      ctx.fillStyle = pal.t;
      ctx.fillRect(-2, -6, 3, 2);
    }
    const tool = v.toolKind?.() || null;
    if (tool && (v.acting || v.job?.type === "pray")) this.drawTool(ctx, tool, time, v);
  }

  drawTool(ctx, tool, time, v) {
    const swing = Math.sin(time * 13 + (v.phase || 0));
    ctx.save();
    ctx.translate(5, -8);
    ctx.rotate(-0.6 + swing * 0.85);
    if (tool === "axe" || tool === "pick" || tool === "hoe" || tool === "hammer") {
      ctx.fillStyle = "#6b442c";
      ctx.fillRect(0, 0, 1, 7);
      ctx.fillStyle = tool === "hammer" ? "#d0d4da" : "#9aa3ad";
      if (tool === "pick") ctx.fillRect(-2, 0, 5, 1);
      else if (tool === "hoe") ctx.fillRect(-3, 0, 4, 1);
      else ctx.fillRect(-2, -1, 3, 3);
    } else if (tool === "basket") {
      ctx.fillStyle = "#c4554a";
      ctx.fillRect(-2, 1, 4, 3);
      ctx.fillStyle = "#6aaa48";
      ctx.fillRect(-1, 0, 2, 2);
    } else if (tool === "staff") {
      ctx.fillStyle = "#d8c7a2";
      ctx.fillRect(0, -2, 1, 10);
      ctx.fillStyle = "#f0d78c";
      ctx.fillRect(-1, -3, 3, 2);
    }
    ctx.restore();
  }

  drawEmote(ctx, x, y, emote, time) {
    const bob = Math.sin(time * 4) * 0.6;
    const map = {
      love: HEART, anger: ANGER, idea: BULB, sleep: SLEEP, pray: PRAY,
      question: QUESTION, sick: SICK, broken: BROKEN
    }[emote];
    if (!map) return;
    const pal = {
      h: emote === "love" ? "#e2557a" : "#e23b3b",
      y: emote === "question" ? "#f4efe6" : "#f6d35b",
      w: "#fff",
      g: emote === "sick" ? "#9cbc6a" : "#6d6a64",
      z: "#f4efe6"
    };
    const colors = { ...pal, z: "#f4efe6" };
    if (emote === "sleep") {
      ctx.fillStyle = "#f4efe6";
      ctx.font = "5px sans-serif";
      ctx.fillText("z", x - 2, y + bob);
      return;
    }
    blit(ctx, map, Math.round(x - map[0].length / 2), Math.round(y - 8 + bob), colors);
  }

  drawNight(ctx, sim) {
    const t = sim.dayT;
    let dark = 0;
    if (t >= 0.78) dark = Math.min(0.62, (t - 0.78) / 0.12 * 0.62);
    else if (t < 0.1) dark = (1 - t / 0.1) * 0.55;
    else if (t > 0.64 && t < 0.78) dark = ((t - 0.64) / 0.14) * 0.28;
    const { w, h } = this.viewSize();
    const x0 = this.cam.x - w / 2 / this.cam.zoom;
    const y0 = this.cam.y - h / 2 / this.cam.zoom;
    const ww = w / this.cam.zoom;
    const hh = h / this.cam.zoom;
    if (t > 0.62 && t < 0.8) {
      ctx.fillStyle = "rgba(120,40,20,0.13)";
      ctx.fillRect(x0, y0, ww, hh);
    }
    if (dark > 0.02) {
      ctx.fillStyle = `rgba(6,10,24,${dark})`;
      ctx.fillRect(x0, y0, ww, hh);
      ctx.globalCompositeOperation = "lighter";
      const lights = [];
      for (const s of sim.structures) {
        if (s.type === "campfire" || s.type === "forge" || s.type === "shrine") {
          lights.push({ x: s.tx * sim.tile + 8, y: s.ty * sim.tile + 8, r: s.type === "shrine" ? 28 : 42 });
        }
      }
      for (const tileI of lights) {
        const g = ctx.createRadialGradient(tileI.x, tileI.y, 2, tileI.x, tileI.y, tileI.r);
        g.addColorStop(0, "rgba(255,190,90,0.55)");
        g.addColorStop(1, "rgba(255,140,40,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(tileI.x, tileI.y, tileI.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }
  }

  drawWeatherWorld(ctx, sim, time) {
    const { w, h } = this.viewSize();
    const x0 = this.cam.x - w / 2 / this.cam.zoom - 20;
    const y0 = this.cam.y - h / 2 / this.cam.zoom - 20;
    const ww = w / this.cam.zoom + 40;
    const hh = h / this.cam.zoom + 40;
    const snow = sim.seasonIndex === 3;
    const rain = sim.weather && (sim.weather.type === "rain" || sim.weather.type === "hurricane");
    if (rain || snow) {
      if (this.rain.length < 160) {
        for (let i = 0; i < 4; i++) {
          this.rain.push({
            x: x0 + Math.random() * ww,
            y: y0 + Math.random() * hh,
            v: (snow ? 18 : 90) + Math.random() * 30,
            len: snow ? 1.4 : 6
          });
        }
      }
    }
    ctx.fillStyle = snow ? "#f7fbff" : "rgba(190,210,230,0.8)";
    const wind = sim.weather?.type === "hurricane" ? 10 : snow ? 1.2 : 3;
    for (const p of this.rain) {
      p.y += p.v * 0.016;
      p.x += wind * 0.2;
      if (p.y > y0 + hh) {
        p.y = y0;
        p.x = x0 + Math.random() * ww;
      }
      if (!rain && !snow) continue;
      ctx.fillRect(p.x, p.y, snow ? 2 : 1, p.len);
    }
    if (!rain && !snow && this.rain.length) this.rain.length = 0;

    if (sim.weather?.type === "hurricane") {
      const ex = sim.weather.eyeX;
      const ey = sim.weather.eyeY;
      ctx.strokeStyle = "rgba(230,230,240,0.35)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const spins = 5;
        for (let a = 0; a < spins; a += 0.2) {
          const ang = sim.weather.angle * 2 + a + i;
          const rad = 16 + a * 22 + i * 8;
          const px = ex + Math.cos(ang) * rad;
          const py = ey + Math.sin(ang) * rad * 0.62;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(20,24,32,0.18)";
      ctx.beginPath();
      ctx.ellipse(ex, ey, 78, 48, sim.weather.angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawFx(ctx, sim) {
    for (const p of sim.fx) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    for (const b of sim.bolts) {
      ctx.globalAlpha = Math.max(0, b.life / b.max);
      ctx.strokeStyle = "#fffaf0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      b.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      ctx.strokeStyle = "#9ecbff";
      ctx.lineWidth = 4;
      ctx.globalAlpha *= 0.45;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  drawLabels(ctx, sim) {
    ctx.font = "12px Georgia, serif";
    ctx.textAlign = "center";
    for (const v of sim.villagers) {
      const show = sim.selectedId === v.id || sim.hoveredId === v.id || v.speechT > 0;
      if (!show) continue;
      const p = this.worldToScreen(v.x, v.y);
      if (sim.selectedId === v.id || sim.hoveredId === v.id) {
        ctx.fillStyle = "rgba(10,8,6,0.6)";
        const name = v.name;
        const tw = ctx.measureText(name).width + 10;
        ctx.fillRect(p.x - tw / 2, p.y - 52, tw, 14);
        ctx.fillStyle = "#f4efe6";
        ctx.fillText(name, p.x, p.y - 41);
      }
      if (v.speechT > 0 && v.speech) {
        const text = v.speech;
        const tw = Math.min(190, ctx.measureText(text).width + 14);
        const bx = p.x - tw / 2;
        const by = p.y - 74;
        ctx.fillStyle = "rgba(244,239,230,0.92)";
        roundRect(ctx, bx, by, tw, 22, 8);
        ctx.fill();
        ctx.fillStyle = "#241c16";
        ctx.font = "11px Georgia, serif";
        clipText(ctx, text, p.x, by + 15, tw - 10);
        ctx.font = "12px Georgia, serif";
      }
    }
    ctx.font = "13px Georgia, serif";
    for (const f of sim.floaters) {
      const p = this.worldToScreen(f.x, f.y);
      ctx.globalAlpha = Math.max(0, f.life / f.max);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  drawFlash(ctx, sim, w, h) {
    if (sim.flash > 0.02) {
      ctx.fillStyle = `rgba(255,255,255,${sim.flash * 0.45})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  ensureMinimap(sim) {
    const mw = 168;
    const mh = Math.round(mw * (sim.h / sim.w));
    if (!this.miniCache || this.miniRev !== sim.terrainRev) {
      this.miniRev = sim.terrainRev;
      const cnv = document.createElement("canvas");
      cnv.width = mw;
      cnv.height = mh;
      const mctx = cnv.getContext("2d");
      const sx = mw / sim.w;
      const sy = mh / sim.h;
      for (let ty = 0; ty < sim.h; ty++) {
        for (let tx = 0; tx < sim.w; tx++) {
          const t = sim.getTile(tx, ty);
          if (t.type === "grass") mctx.fillStyle = "#3f7a34";
          else if (t.type === "water") mctx.fillStyle = "#1d6a96";
          else if (t.type === "sand") mctx.fillStyle = "#d2b56e";
          else if (t.type === "rock") mctx.fillStyle = "#8a8680";
          else if (t.type === "farm") mctx.fillStyle = "#c4a05a";
          else mctx.fillStyle = "#8b6a42";
          mctx.fillRect(tx * sx, ty * sy, Math.ceil(sx), Math.ceil(sy));
        }
      }
      this.miniCache = cnv;
    }
    return { mw, mh };
  }

  drawMinimap(ctx, sim, canvasH) {
    const { mw, mh } = this.ensureMinimap(sim);
    const x = 16;
    const y = canvasH - mh - 108;
    this.minimap = { x, y, w: mw, h: mh };
    ctx.fillStyle = "rgba(12,10,8,0.72)";
    roundRect(ctx, x - 6, y - 6, mw + 12, mh + 12, 12);
    ctx.fill();
    ctx.drawImage(this.miniCache, x, y);
    const sx = mw / sim.w;
    const sy = mh / sim.h;
    for (const s of sim.structures) {
      const tribe = sim.tribeOf(s.tribeId);
      ctx.fillStyle = tribe?.color || "#fff";
      ctx.fillRect(x + s.tx * sx, y + s.ty * sy, 2, 2);
    }
    for (const v of sim.villagers) {
      const tribe = sim.tribeOf(v.tribeId);
      ctx.fillStyle = tribe?.color || "#fff";
      ctx.fillRect(x + (v.x / sim.tile) * sx - 1, y + (v.y / sim.tile) * sy - 1, 2, 2);
    }
    const { w, h } = this.viewSize();
    const vx = (this.cam.x - w / 2 / this.cam.zoom) / sim.tile;
    const vy = (this.cam.y - h / 2 / this.cam.zoom) / sim.tile;
    const vw = w / this.cam.zoom / sim.tile;
    const vh = h / this.cam.zoom / sim.tile;
    ctx.strokeStyle = "rgba(240,215,140,0.9)";
    ctx.strokeRect(x + vx * sx, y + vy * sy, vw * sx, vh * sy);
  }

  drawCursor(ctx, sim) {
    if (!sim.cursor) return;
    if (sim.activePower === "inspect" && !sim.placementBuild && !sim.brushMode) return;
    const p = this.worldToScreen(sim.cursor.x, sim.cursor.y);
    ctx.strokeStyle = "#f0d78c";
    ctx.strokeRect(p.x - 8, p.y - 8, 16, 16);
  }

  drawPortrait(ctx, v, sim, time) {
    const c = ctx.canvas;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#17130f";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = v._tribeColor || sim.tribeOf(v.tribeId)?.color || "#d08a45";
    ctx.globalAlpha = 0.25;
    ctx.fillRect(0, c.height - 22, c.width, 22);
    ctx.globalAlpha = 1;
    const tribe = sim.tribeOf(v.tribeId);
    v._tribeColor = tribe?.color || "#d08a45";
    ctx.save();
    ctx.translate(c.width / 2, c.height - 16);
    ctx.scale(4, 4);
    this.drawVillagerSprite(ctx, v, sim, time);
    ctx.restore();
  }

  minimapHit(sx, sy) {
    const m = this.minimap;
    return sx >= m.x && sy >= m.y && sx <= m.x + m.w && sy <= m.y + m.h;
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clipText(ctx, text, x, y, maxW) {
  let t = text;
  while (t.length > 2 && ctx.measureText(t).width > maxW) t = t.slice(0, -2);
  if (t !== text) t = `${t.slice(0, -1)}…`;
  ctx.fillText(t, x, y);
}
