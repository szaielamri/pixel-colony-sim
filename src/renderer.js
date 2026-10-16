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
    // Chunky pixels: render at 1/pixelScale resolution, CSS scales up crisp
    const coarse = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    // Phone: slightly chunkier pixels + lower zoom so more world fits on screen
    this.pixelScale = coarse
      ? Math.max(2, Math.min(3, Math.round((window.devicePixelRatio || 2) * 0.85) || 2))
      : Math.max(2, Math.min(3, Math.round(window.devicePixelRatio || 2)));
    // Avoid desynchronized — it blanks the canvas on some GPUs/browsers
    this.ctx = canvas.getContext("2d", { alpha: false }) || canvas.getContext("2d");
    this.cam = { x: 0, y: 0, zoom: coarse ? 2.1 : 2.6 };
    this.terrain = null;
    this.terrainRev = -1;
    this.miniCache = null;
    this.miniRev = -1;
    this.miniAcc = 0;
    this.frame = 0;
    this.birds = Array.from({ length: 4 }, (_, i) => ({
      x: 80 + i * 140,
      y: 40 + (i % 3) * 30,
      s: 18 + i * 4,
      p: i
    }));
    this.rain = [];
    this.whirls = [];
    this.minimap = { x: 12, y: 12, w: 140, h: 96 };
  }

  resize() {
    const cssW = this.canvas.clientWidth || window.innerWidth;
    const cssH = this.canvas.clientHeight || window.innerHeight;
    // Internal buffer smaller → bigger pixels, less fill-rate
    const scale = this.pixelScale;
    const w = Math.max(320, Math.floor(cssW / scale));
    const h = Math.max(200, Math.floor(cssH / scale));
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
    this.frame++;
    this.resize();
    const ctx = this.ctx;
    if (!ctx || !sim) return;
    // Recover camera if focus was lost (NaN / missing home)
    if (!Number.isFinite(this.cam.x) || !Number.isFinite(this.cam.y)) {
      this.cam.x = Number.isFinite(sim.homeX) ? sim.homeX : (sim.w * sim.tile) / 2;
      this.cam.y = Number.isFinite(sim.homeY) ? sim.homeY : (sim.h * sim.tile) / 2;
    }
    const { w, h } = this.viewSize();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    this.drawSky(ctx, sim, w, h, time);
    this.ensureTerrain(sim);
    if (!this.terrain) return;

    const z = this.cam.zoom || 2.2;
    // Snap camera to whole pixels for stable pixel art
    const cx = Math.round(this.cam.x * z) / z;
    const cy = Math.round(this.cam.y * z) / z;
    ctx.setTransform(z, 0, 0, z, Math.round(-cx * z + w / 2), Math.round(-cy * z + h / 2));
    ctx.drawImage(this.terrain, 0, 0);
    // Animate ground overlays every other frame when zoomed out
    if (this.frame % 2 === 0 || z > 2.4) this.drawVisibleGround(ctx, sim, time);
    this.drawObjects(ctx, sim, time);
    this.drawNight(ctx, sim);
    if (sim.weather || sim.seasonIndex === 3) this.drawWeatherWorld(ctx, sim, time);
    this.drawFx(ctx, sim);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.drawLabels(ctx, sim, time);
    if (this.frame % 2 === 0) this.drawBirds(ctx, time);
    this.drawFlash(ctx, sim, w, h);
    this.miniAcc++;
    if (this.miniAcc >= 3 || !this._miniSnap) {
      this.miniAcc = 0;
      this.drawMinimap(ctx, sim, h);
    } else {
      ctx.drawImage(this._miniSnap, this._miniX | 0, this._miniY | 0);
    }
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
      // Milky band
      ctx.save();
      ctx.globalAlpha = 0.12;
      const band = ctx.createLinearGradient(0, h * 0.05, w, h * 0.4);
      band.addColorStop(0, "transparent");
      band.addColorStop(0.4, "#c8d4ff");
      band.addColorStop(0.6, "#e8d0ff");
      band.addColorStop(1, "transparent");
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, w, h * 0.45);
      ctx.restore();
      // Stars — fewer, chunkier (reads better at pixel scale)
      const nStars = Math.min(48, 28 + ((w * h) / 12000) | 0);
      for (let i = 0; i < nStars; i++) {
        const sx = ((i * 137.5) % w);
        const sy = ((i * 89.3) % (h * 0.48));
        const twinkle = 0.3 + Math.sin(time * (1.2 + (i % 4) * 0.35) + i) * 0.3;
        ctx.globalAlpha = Math.max(0.15, twinkle);
        ctx.fillStyle = i % 7 === 0 ? "#ffe9c8" : "#f4f7ff";
        ctx.fillRect(sx, sy, i % 9 === 0 ? 2 : 1, i % 9 === 0 ? 2 : 1);
      }
      ctx.globalAlpha = 1;
    }

    const ang = (t - 0.02) * Math.PI;
    const sx = w * 0.5 + Math.cos(Math.PI - ang) * w * 0.38;
    const sy = h * 0.55 - Math.sin(ang) * h * 0.42;
    if (night) {
      // Moon phase from sim time
      const phase = sim.moonPhase ?? 0.3;
      const r = 15;
      ctx.beginPath();
      ctx.fillStyle = "#f3ecd4";
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#070b16";
      ctx.beginPath();
      const shadow = (phase - 0.5) * 2;
      ctx.arc(sx + shadow * 12, sy - 1, r * 0.95, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.fillStyle = dusk ? "#ffb15a" : "#fff4c8";
      ctx.arc(sx, sy, dusk ? 18 : 22, 0, Math.PI * 2);
      ctx.fill();
      if (!dusk) {
        ctx.strokeStyle = "rgba(255,244,200,0.25)";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(sx, sy, 28, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  ensureTerrain(sim) {
    const pw = sim.w * sim.tile;
    const ph = sim.h * sim.tile;
    if (!this.terrain || this.terrain.width !== pw || this.terrain.height !== ph) {
      this.terrain = document.createElement("canvas");
      this.terrain.width = pw;
      this.terrain.height = ph;
      this.terrainRev = -1;
    }
    if (this.terrainRev === sim.terrainRev) return;
    this.terrainRev = sim.terrainRev;
    const c = this.terrain.getContext("2d");
    if (!c) return;
    c.imageSmoothingEnabled = false;
    const winter = sim.seasonIndex === 3;
    const autumn = sim.seasonIndex === 2;
    const spring = sim.seasonIndex === 0;
    for (let ty = 0; ty < sim.h; ty++) {
      for (let tx = 0; tx < sim.w; tx++) {
        const tile = sim.getTile(tx, ty);
        const x = tx * sim.tile;
        const y = ty * sim.tile;
        if (!tile) {
          c.fillStyle = "#2a3828";
          c.fillRect(x, y, sim.tile, sim.tile);
          continue;
        }
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
    const step = this.cam.zoom < 2 ? 2 : 1; // skip tiles when zoomed out
    for (let ty = v.ty0; ty <= v.ty1; ty += step) {
      for (let tx = v.tx0; tx <= v.tx1; tx += step) {
        const tile = sim.getTile(tx, ty);
        if (!tile) continue;
        const x = tx * sim.tile;
        const y = ty * sim.tile;
        if (tile.type === "water" && ((tx + ty + this.frame) & 1) === 0) {
          const wave = ((Math.sin(time * 2.2 + tx * 0.7 + ty * 0.4) * 1.2) | 0);
          ctx.fillStyle = "rgba(210,240,255,0.28)";
          ctx.fillRect(x + 2, y + 8 + wave, 6, 1);
        } else if ((tile.type === "grass" || tile.type === "sand") && ((tx + ty) & 3) === 0) {
          ctx.fillStyle = winter ? "#f7fbff" : sim.seasonIndex === 2 ? "#d2b15a" : "#2f6a2c";
          ctx.fillRect(x + 3, y + 12, 1, 3);
        }
        if (tile.fire > 0) {
          const f = tile.fire;
          const flick = Math.abs(Math.sin(time * 18 + tx * 3));
          ctx.fillStyle = `rgba(40,20,12,${0.25 + f * 0.3})`;
          ctx.fillRect(x, y, sim.tile, sim.tile);
          ctx.fillStyle = flick > 0.5 ? "#ffb14a" : "#e25822";
          ctx.fillRect(x + 6, y + 10 - flick * 4, 3, 4);
        }
      }
    }
  }

  drawObjects(ctx, sim, time) {
    const v = this.visible(sim);
    const pad = sim.tile * 2;
    const x0 = v.tx0 * sim.tile - pad;
    const y0 = v.ty0 * sim.tile - pad;
    const x1 = (v.tx1 + 1) * sim.tile + pad;
    const y1 = (v.ty1 + 1) * sim.tile + pad;
    const inView = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
    const items = [];
    for (let ty = v.ty0; ty <= v.ty1; ty++) {
      for (let tx = v.tx0; tx <= v.tx1; tx++) {
        const tile = sim.getTile(tx, ty);
        if (tile?.res) items.push({ y: (ty + 1) * sim.tile, kind: "res", tx, ty, tile });
      }
    }
    for (const s of sim.structures) {
      if (s.tx < v.tx0 - 1 || s.tx > v.tx1 + 1 || s.ty < v.ty0 - 1 || s.ty > v.ty1 + 1) continue;
      items.push({ y: (s.ty + 1) * sim.tile, kind: "struct", s });
    }
    for (const b of sim.blueprints) {
      if (b.tx < v.tx0 - 1 || b.tx > v.tx1 + 1 || b.ty < v.ty0 - 1 || b.ty > v.ty1 + 1) continue;
      items.push({ y: (b.ty + 1) * sim.tile, kind: "blue", b });
    }
    for (const a of sim.animals || []) {
      if (!inView(a.x, a.y)) continue;
      items.push({ y: a.y + 1, kind: "animal", a });
    }
    for (const g of sim.graves || []) {
      if (!inView(g.x, g.y)) continue;
      items.push({ y: g.y + 1, kind: "grave", g });
    }
    for (const p of sim.villagers) {
      if (!inView(p.x, p.y) && sim.selectedId !== p.id && sim.possessedId !== p.id) continue;
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
      else if (item.kind === "grave") this.drawGrave(ctx, item.g, time);
      else this.drawVillagerWorld(ctx, item.p, sim, time);
    }
    this.drawPlacementGhost(ctx, sim);
    if (sim.festival && inView(sim.festival.x, sim.festival.y)) {
      const pulse = 0.25 + Math.sin(time * 4) * 0.1;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = "#f0d78c";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        (sim.festival.x - 36) | 0,
        (sim.festival.y - 22) | 0,
        72,
        44
      );
      ctx.restore();
    }
  }

  drawGrave(ctx, g, time) {
    const x = Math.round(g.x);
    const y = Math.round(g.y);
    ctx.fillStyle = "#6a655c";
    ctx.fillRect(x - 3, y - 8, 6, 8);
    ctx.fillStyle = "#9a958c";
    ctx.fillRect(x - 4, y - 10, 8, 3);
    ctx.fillStyle = "rgba(200,180,160,0.35)";
    ctx.fillRect(x - 5, y - 1, 10, 2);
    if (Math.sin(time * 2 + (g.forId || 0)) > 0.6) {
      ctx.fillStyle = "rgba(220,120,140,0.7)";
      ctx.fillRect(x + 4, y - 14, 2, 2);
    }
  }

  drawAnimal(ctx, a, time) {
    const bob = Math.sin(time * 6 + a.phase) * (a.kind === "snake" ? 0.4 : 1.2);
    ctx.save();
    ctx.translate(Math.round(a.x), Math.round(a.y - bob));
    // Tiny ground shadow
    ctx.fillStyle = "rgba(12,10,8,0.22)";
    ctx.fillRect(-4, 1, 8, 2);
    const k = a.kind;
    if (k === "wolf") {
      ctx.fillStyle = "#5a5a62";
      ctx.fillRect(-5, -4, 10, 5);
      ctx.fillRect(4, -6, 4, 3);
      ctx.fillStyle = "#c45a4a";
      ctx.fillRect(7, -5, 1, 1);
    } else if (k === "boar") {
      ctx.fillStyle = "#6a4a38";
      ctx.fillRect(-5, -4, 10, 5);
      ctx.fillStyle = "#d8d0c8";
      ctx.fillRect(5, -3, 2, 1);
    } else if (k === "cattle") {
      ctx.fillStyle = a.domestic ? "#e8e0d0" : "#8a7060";
      ctx.fillRect(-6, -5, 12, 6);
      ctx.fillStyle = "#3a3028";
      ctx.fillRect(-5, 1, 2, 3);
      ctx.fillRect(3, 1, 2, 3);
      ctx.fillRect(4, -7, 3, 3);
    } else if (k === "fox") {
      ctx.fillStyle = "#d07838";
      ctx.fillRect(-4, -3, 8, 4);
      ctx.fillStyle = "#f0e8e0";
      ctx.fillRect(3, -2, 2, 2);
      ctx.fillStyle = "#d07838";
      ctx.fillRect(-5, -2, 3, 2); // bushy tail
    } else if (k === "rabbit") {
      ctx.fillStyle = "#e8e0d4";
      ctx.fillRect(-3, -3, 6, 4);
      ctx.fillStyle = "#d0c8bc";
      ctx.fillRect(-2, -7, 1, 4);
      ctx.fillRect(1, -7, 1, 4);
      ctx.fillStyle = "#f0a0a8";
      ctx.fillRect(2, -2, 1, 1);
    } else if (k === "bear") {
      ctx.fillStyle = "#4a3428";
      ctx.fillRect(-7, -6, 14, 8);
      ctx.fillRect(5, -8, 5, 4);
      ctx.fillStyle = "#2a1c14";
      ctx.fillRect(-5, 1, 3, 3);
      ctx.fillRect(2, 1, 3, 3);
      ctx.fillStyle = "#c45a4a";
      ctx.fillRect(9, -6, 1, 1);
    } else if (k === "sheep") {
      ctx.fillStyle = a.domestic ? "#f4f0e8" : "#d8d0c4";
      ctx.fillRect(-5, -4, 10, 6);
      ctx.fillStyle = "#3a3028";
      ctx.fillRect(4, -6, 3, 3);
      ctx.fillRect(-4, 1, 2, 2);
      ctx.fillRect(2, 1, 2, 2);
    } else if (k === "goat") {
      ctx.fillStyle = "#c8b090";
      ctx.fillRect(-4, -4, 9, 5);
      ctx.fillStyle = "#e8e0d0";
      ctx.fillRect(4, -7, 2, 4);
      ctx.fillStyle = "#6a5a48";
      ctx.fillRect(5, -9, 1, 3);
      ctx.fillRect(7, -8, 1, 2);
    } else if (k === "chicken") {
      ctx.fillStyle = a.domestic ? "#f0e8d8" : "#d8c8a0";
      ctx.fillRect(-3, -4, 6, 5);
      ctx.fillStyle = "#e07040";
      ctx.fillRect(2, -6, 2, 2);
      ctx.fillStyle = "#c45a4a";
      ctx.fillRect(3, -4, 2, 1);
      ctx.fillStyle = "#f0d78c";
      ctx.fillRect(-1, -6, 2, 1);
    } else if (k === "horse") {
      ctx.fillStyle = a.domestic ? "#8a6a48" : "#5a4030";
      ctx.fillRect(-7, -6, 12, 6);
      ctx.fillRect(4, -10, 4, 5);
      ctx.fillStyle = "#3a2818";
      ctx.fillRect(-6, 0, 2, 4);
      ctx.fillRect(2, 0, 2, 4);
      ctx.fillStyle = "#2a1c14";
      ctx.fillRect(-8, -5, 3, 2); // mane/tail hint
    } else if (k === "snake") {
      const wiggle = Math.sin(time * 10 + a.phase) * 1.5;
      ctx.fillStyle = "#4a7a48";
      ctx.fillRect((-6 + wiggle) | 0, -2, 4, 2);
      ctx.fillRect((-2 + wiggle * 0.5) | 0, -1, 4, 2);
      ctx.fillRect((2 - wiggle) | 0, -2, 4, 2);
      ctx.fillStyle = "#c45a4a";
      ctx.fillRect((5 - wiggle) | 0, -3, 2, 2);
    } else if (k === "beaver") {
      ctx.fillStyle = "#6a4a28";
      ctx.fillRect(-4, -3, 8, 5);
      ctx.fillStyle = "#4a3018";
      ctx.fillRect(-6, -1, 3, 3); // flat tail
      ctx.fillStyle = "#f0e0c8";
      ctx.fillRect(3, -2, 2, 2);
    } else if (k === "moose") {
      ctx.fillStyle = "#6a4830";
      ctx.fillRect(-7, -6, 13, 7);
      ctx.fillRect(4, -10, 4, 5);
      ctx.fillStyle = "#8a6a48";
      ctx.fillRect(3, -13, 2, 4);
      ctx.fillRect(7, -13, 2, 4);
      ctx.fillRect(2, -12, 8, 2); // antlers
      ctx.fillStyle = "#3a2818";
      ctx.fillRect(-5, 0, 2, 3);
      ctx.fillRect(2, 0, 2, 3);
    } else if (k === "pig") {
      ctx.fillStyle = a.domestic ? "#f0b0a8" : "#c87868";
      ctx.fillRect(-5, -4, 10, 5);
      ctx.fillStyle = "#e09088";
      ctx.fillRect(5, -3, 3, 2);
      ctx.fillStyle = "#3a3028";
      ctx.fillRect(-3, 1, 2, 2);
      ctx.fillRect(2, 1, 2, 2);
    } else {
      // deer default
      ctx.fillStyle = "#c4a07a";
      ctx.fillRect(-4, -5, 8, 5);
      ctx.fillRect(3, -8, 3, 3);
      ctx.fillStyle = "#8d6a45";
      ctx.fillRect(-3, 0, 1, 3);
      ctx.fillRect(2, 0, 1, 3);
      ctx.fillRect(4, -10, 1, 3);
      ctx.fillRect(6, -9, 1, 2);
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
    } else if (tile.res === "gold") {
      ctx.fillStyle = "#8e8a84";
      ctx.fillRect(x - 5, y - 4, 8, 4);
      ctx.fillStyle = "#f0d78c";
      ctx.fillRect(x - 2, y - 6, 4, 3);
      ctx.fillStyle = "#fff6c8";
      ctx.fillRect(x - 1, y - 5, 1, 1);
    } else if (tile.res === "gas") {
      ctx.fillStyle = "#5a6058";
      ctx.fillRect(x - 3, y - 2, 6, 3);
      const puff = Math.sin(time * 4 + tx) * 2;
      ctx.fillStyle = "rgba(180,190,180,0.45)";
      ctx.fillRect(x - 1, y - 6 - puff, 2, 4);
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
      if (s.sickBay) {
        ctx.fillStyle = "rgba(143,208,164,0.85)";
        ctx.fillRect(x + 3, y + 12, 3, 2);
      }
    } else if (s.type === "shrine") {
      ctx.fillStyle = "#9a958c";
      ctx.fillRect(x + 3, y + 11, 10, 3);
      ctx.fillRect(x + 6, y + 4, 4, 8);
      ctx.fillStyle = color;
      ctx.fillRect(x + 5, y + 2, 6, 3);
      const glow = 0.4 + Math.sin(time * 3) * 0.2;
      ctx.fillStyle = `rgba(240,220,140,${glow})`;
      ctx.fillRect(x + 7, y + 6, 2, 2);
      const off = s.offerings || {};
      const n = (off.food || 0) + (off.wood || 0) + (off.stone || 0);
      if (n > 0) {
        ctx.fillStyle = "#c4554a";
        ctx.fillRect(x + 4, y + 12, 2, 2);
        if (n > 2) {
          ctx.fillStyle = "#8d6a42";
          ctx.fillRect(x + 10, y + 12, 2, 2);
        }
        ctx.fillStyle = `rgba(240,215,140,${0.5 + Math.sin(time * 5) * 0.3})`;
        ctx.fillRect(x + 7, y + 1, 2, 1);
      }
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
    } else if (s.type === "well") {
      ctx.fillStyle = "#7a7a82";
      ctx.fillRect(x + 4, y + 6, 8, 7);
      ctx.fillStyle = "#2a6a8a";
      ctx.fillRect(x + 6, y + 8, 4, 3);
      ctx.fillStyle = color;
      ctx.fillRect(x + 5, y + 4, 6, 2);
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
    } else if (s.type === "mine") {
      ctx.fillStyle = "#4a4844";
      ctx.fillRect(x + 2, y + 6, 12, 8);
      ctx.fillStyle = "#1a1814";
      ctx.fillRect(x + 5, y + 8, 6, 5);
      ctx.fillStyle = "#f0d78c";
      ctx.fillRect(x + 7, y + 10, 2, 1);
      ctx.fillStyle = color;
      ctx.fillRect(x + 3, y + 4, 2, 2);
    } else if (s.type === "gaswell") {
      ctx.fillStyle = "#6a7078";
      ctx.fillRect(x + 6, y + 3, 4, 11);
      ctx.fillStyle = "#9aa3ad";
      ctx.fillRect(x + 5, y + 2, 6, 2);
      ctx.fillStyle = "rgba(200,210,200,0.5)";
      ctx.fillRect(x + 7, y - 1 - Math.sin(time * 4), 2, 3);
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
    const sleeping = v.job?.type === "sleep" && v.job.stage === "act";
    const moving = v.moving && !sleeping;
    const speed = 8;
    const s = Math.sin(time * speed + v.phase);
    const bounce = moving ? Math.abs(s) * 1.7 : v.acting && !sleeping ? Math.abs(Math.sin(time * 13 + v.phase)) * 0.45 : 0;
    // Soft ground shadow — cheap depth cue (reads as “3D-ish” at chunky scale)
    if (!v.carried) {
      ctx.fillStyle = "rgba(12,10,8,0.28)";
      ctx.fillRect(Math.round(v.x) - 5, Math.round(v.y) - 1, 10, 3);
      ctx.fillStyle = "rgba(12,10,8,0.14)";
      ctx.fillRect(Math.round(v.x) - 7, Math.round(v.y), 14, 2);
    }
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
    // Leader / president mark
    const tribe = sim.tribeOf(v.tribeId);
    if (tribe?.leaderId === v.id && !sleeping && !v.carried) {
      ctx.fillStyle = tribe.isNation ? "#f0d78c" : "#c9b8e8";
      ctx.fillRect(Math.round(v.x) - 1, Math.round(v.y) - 22 - bounce, 2, 2);
      if (tribe.govTitle === "President") {
        ctx.fillStyle = "#8fd0a4";
        ctx.fillRect(Math.round(v.x) - 2, Math.round(v.y) - 24 - bounce, 4, 1);
      }
    }
    if (v.carried) {
      const lift = 10 + Math.sin(time * 10 + v.phase) * 2;
      ctx.save();
      ctx.globalAlpha = 0.4 + Math.sin(time * 6) * 0.12;
      ctx.fillStyle = "#f0d78c";
      ctx.beginPath();
      ctx.ellipse(v.x, v.y - lift - 6, 12, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(Math.round(v.x), Math.round(v.y) - lift);
      const stageScale = ({ infant: 0.42, child: 0.62, youth: 0.9, adult: 1, mature: 1, elder: 0.94 })[v.lifeStage] || (v.isChild ? 0.66 : 1);
      const sc = stageScale * (v.scale || 1);
      ctx.scale(v.facing * sc, sc);
      this.drawVillagerSprite(ctx, v, sim, time);
      ctx.restore();
      ctx.fillStyle = "rgba(240,215,140,0.9)";
      ctx.font = "bold 8px Georgia, serif";
      ctx.fillText("↑", v.x - 3, v.y - lift - 22);
      return;
    }
    if (sleeping) {
      const breath = Math.sin(time * 1.6 + v.phase) * 0.5;
      ctx.save();
      ctx.globalAlpha = 0.42 + Math.sin(time * 1.8) * 0.1;
      ctx.fillStyle = "#6a5a8a";
      ctx.beginPath();
      ctx.ellipse(v.x, v.y - 3, 16, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Bedroll / shadow under sleeper
      ctx.fillStyle = "rgba(40,32,28,0.55)";
      ctx.fillRect(Math.round(v.x) - 11, Math.round(v.y) - 1, 22, 5);
      ctx.fillStyle = "rgba(90,70,50,0.45)";
      ctx.fillRect(Math.round(v.x) - 10, Math.round(v.y) - 2, 20, 3);
      ctx.save();
      ctx.translate(Math.round(v.x), Math.round(v.y) - 2 + breath);
      ctx.rotate(-Math.PI / 2);
      const stageScale = ({ infant: 0.42, child: 0.62, youth: 0.9, adult: 1, mature: 1, elder: 0.94 })[v.lifeStage] || (v.isChild ? 0.66 : 1);
      const sc = stageScale * (v.scale || 1) * 0.95;
      ctx.scale(sc, sc * (1 + breath * 0.04));
      this.drawVillagerSprite(ctx, v, sim, time);
      ctx.restore();
      // Rising Zzz trail — unmistakable sleep signal
      const zBob = Math.sin(time * 2.8 + v.phase) * 2.5;
      const zAlpha = 0.55 + Math.sin(time * 3 + v.phase) * 0.35;
      ctx.save();
      ctx.globalAlpha = zAlpha;
      ctx.fillStyle = "#e8e0ff";
      ctx.font = "bold 9px Georgia, serif";
      ctx.fillText("z", v.x + 7, v.y - 12 - zBob);
      ctx.font = "bold 11px Georgia, serif";
      ctx.fillText("Z", v.x + 12, v.y - 20 - zBob * 1.3);
      ctx.font = "bold 14px Georgia, serif";
      ctx.fillStyle = "#d4c8f0";
      ctx.fillText("Z", v.x + 18, v.y - 30 - zBob * 1.6);
      ctx.restore();
      // Soft dream motes
      for (let i = 0; i < 3; i++) {
        const a = time * 1.2 + v.phase + i * 2.1;
        ctx.globalAlpha = 0.25 + Math.sin(a) * 0.15;
        ctx.fillStyle = "#c9b8e8";
        ctx.fillRect(
          Math.round(v.x + Math.cos(a) * (8 + i * 3)),
          Math.round(v.y - 8 - Math.sin(a * 0.7) * 6 - i * 4),
          1, 1
        );
      }
      ctx.globalAlpha = 1;
      if (sim.selectedId === v.id || sim.hoveredId === v.id) {
        ctx.fillStyle = "rgba(201,184,232,0.85)";
        ctx.font = "8px Georgia, serif";
        ctx.fillText("sleeping", v.x - 14, v.y - 38);
        ctx.strokeStyle = "#c9b8e8";
        ctx.strokeRect(Math.round(v.x) - 12, Math.round(v.y) - 14, 24, 16);
      }
      return;
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
    const stageScale = ({ infant: 0.42, child: 0.62, youth: 0.9, adult: 1, mature: 1, elder: 0.94 })[v.lifeStage] || (v.isChild ? 0.66 : 1);
    const sc = stageScale * (v.scale || 1);
    ctx.scale(v.facing * sc, sc);
    this.drawVillagerSprite(ctx, v, sim, time);
    ctx.restore();

    // Cold breath in winter nights
    if (sim.seasonIndex === 3 && sim.isNight() && Math.sin(time * 3 + v.phase) > 0.7) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#d8e8f0";
      ctx.fillRect(Math.round(v.x + v.facing * 4), Math.round(v.y - 12 - bounce), 3, 2);
      ctx.globalAlpha = 1;
    }

    if (v.dilemma) {
      const bob = Math.sin(time * 5 + v.phase) * 2;
      ctx.fillStyle = "rgba(10,8,6,0.55)";
      ctx.beginPath();
      ctx.arc(v.x, v.y - 26 - bounce + bob, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f4efe6";
      ctx.font = "bold 11px Georgia, serif";
      ctx.fillText("❓", v.x - 5, v.y - 22 - bounce + bob);
    } else if (v.orphan && v.isChild) {
      const bob = Math.sin(time * 6 + v.phase) * 1.5;
      ctx.fillStyle = "rgba(220,120,100,0.9)";
      ctx.font = "bold 9px Georgia, serif";
      ctx.fillText("✧", v.x - 3, v.y - 20 - bounce + bob);
      this.drawEmote(ctx, v.x + 5, v.y - 18 - bounce, "broken", time);
    } else if (v.emote) {
      this.drawEmote(ctx, v.x, v.y - 18 - bounce, v.emote, time);
    }
    if (v.illness) {
      const rad = v.illness.type === "radiation";
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const a = time * (rad ? 3 : 2) + v.phase + i * 1.7;
        ctx.globalAlpha = 0.35 + Math.sin(a) * 0.2;
        ctx.fillStyle = rad ? "#8fff78" : "#c8d0a0";
        ctx.fillRect(
          Math.round(v.x + Math.cos(a) * (4 + i)),
          Math.round(v.y - 10 - bounce - Math.sin(a * 1.3) * 5 - i * 2),
          rad ? 2 : 1,
          rad ? 2 : 1
        );
      }
      ctx.restore();
      if (!v.emote) this.drawEmote(ctx, v.x + 4, v.y - 20 - bounce, "sick", time);
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
    else if (v.illness) pal.s = shade(pal.s, 28);
    if (v.hereditaryTraits?.includes("Glow Skin")) pal.s = "#c8e8a8";
    if (v.hereditaryTraits?.includes("Twisted Bone")) pal.s = shade(pal.s, -12);
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
      ctx.fillStyle = "rgba(220,210,255,0.95)";
      ctx.font = "bold 8px Georgia, serif";
      ctx.fillText("Zzz", x - 6, y + bob);
      return;
    }
    blit(ctx, map, Math.round(x - map[0].length / 2), Math.round(y - 8 + bob), colors);
  }

  drawNight(ctx, sim) {
    const t = sim.dayT;
    let dark = 0;
    if (t >= 0.78) dark = Math.min(0.48, (t - 0.78) / 0.12 * 0.48);
    else if (t < 0.1) dark = (1 - t / 0.1) * 0.42;
    else if (t > 0.64 && t < 0.78) dark = ((t - 0.64) / 0.14) * 0.22;
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
      // Pixel light pools — cheaper than radial gradients, punchier at chunky scale
      ctx.globalCompositeOperation = "lighter";
      const flick = 0.85 + Math.sin(this.frame * 0.35) * 0.08;
      for (const s of sim.structures) {
        if (s.type !== "campfire" && s.type !== "forge" && s.type !== "shrine") continue;
        const lx = s.tx * sim.tile + 8;
        const ly = s.ty * sim.tile + 8;
        if (lx < x0 - 50 || lx > x0 + ww + 50 || ly < y0 - 50 || ly > y0 + hh + 50) continue;
        const big = s.type === "shrine" ? 22 : 32;
        ctx.fillStyle = `rgba(255,160,60,${0.12 * flick})`;
        ctx.fillRect(lx - big, ly - big, big * 2, big * 2);
        ctx.fillStyle = `rgba(255,190,90,${0.22 * flick})`;
        ctx.fillRect(lx - (big >> 1), ly - (big >> 1), big, big);
        ctx.fillStyle = `rgba(255,220,140,${0.35 * flick})`;
        ctx.fillRect(lx - 4, ly - 4, 8, 8);
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
      const cap = snow ? 70 : 90;
      if (this.rain.length < cap) {
        for (let i = 0; i < 3; i++) {
          this.rain.push({
            x: x0 + Math.random() * ww,
            y: y0 + Math.random() * hh,
            v: (snow ? 18 : 90) + Math.random() * 30,
            len: snow ? 2 : 5
          });
        }
      } else if (this.rain.length > cap) this.rain.length = cap;
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
    // Smaller buffer → slightly larger UI type so it stays readable when scaled up
    ctx.font = "600 11px Sora, sans-serif";
    ctx.textAlign = "center";
    ctx.imageSmoothingEnabled = false;
    for (const v of sim.villagers) {
      const show = sim.selectedId === v.id || sim.hoveredId === v.id || v.speechT > 0;
      if (!show) continue;
      const p = this.worldToScreen(v.x, v.y);
      if (sim.selectedId === v.id || sim.hoveredId === v.id) {
        ctx.fillStyle = "rgba(10,8,6,0.72)";
        const name = v.name;
        const tw = ctx.measureText(name).width + 10;
        const nx = (p.x - tw / 2) | 0;
        const ny = (p.y - 48) | 0;
        ctx.fillRect(nx, ny, tw | 0, 13);
        ctx.fillStyle = "#f6f0e6";
        ctx.fillText(name, p.x | 0, (p.y - 38) | 0);
      }
      if (v.speechT > 0 && v.speech) {
        const text = v.speech;
        const tw = Math.min(160, ctx.measureText(text).width + 12);
        const bx = (p.x - tw / 2) | 0;
        const by = (p.y - 68) | 0;
        ctx.fillStyle = "rgba(246,240,230,0.94)";
        ctx.fillRect(bx, by, tw | 0, 18);
        ctx.fillStyle = "#1a1410";
        ctx.font = "500 10px Sora, sans-serif";
        clipText(ctx, text, p.x | 0, by + 12, tw - 8);
        ctx.font = "600 11px Sora, sans-serif";
      }
    }
    ctx.font = "600 12px Fraunces, serif";
    for (const f of sim.floaters) {
      const p = this.worldToScreen(f.x, f.y);
      ctx.globalAlpha = Math.max(0, f.life / f.max);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, p.x | 0, p.y | 0);
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
    // Scaled-down minimap for the smaller internal buffer
    const drawW = Math.min(mw, this.minimap.w || 140);
    const drawH = Math.round(drawW * (mh / mw));
    const x = 12;
    const y = canvasH - drawH - 88;
    this.minimap = { x, y, w: drawW, h: drawH };
    const pad = 6;
    const snapW = drawW + pad * 2;
    const snapH = drawH + pad * 2;
    if (!this._miniSnap || this._miniSnap.width !== snapW || this._miniSnap.height !== snapH) {
      this._miniSnap = document.createElement("canvas");
      this._miniSnap.width = snapW;
      this._miniSnap.height = snapH;
    }
    const mctx = this._miniSnap.getContext("2d");
    mctx.imageSmoothingEnabled = false;
    mctx.clearRect(0, 0, snapW, snapH);
    mctx.fillStyle = "rgba(12,10,8,0.78)";
    roundRect(mctx, 0, 0, snapW, snapH, 8);
    mctx.fill();
    mctx.drawImage(this.miniCache, pad, pad, drawW, drawH);
    const sx = drawW / sim.w;
    const sy = drawH / sim.h;
    for (const s of sim.structures) {
      const tribe = sim.tribeOf(s.tribeId);
      mctx.fillStyle = tribe?.color || "#fff";
      mctx.fillRect(pad + s.tx * sx, pad + s.ty * sy, 2, 2);
    }
    // Sample villagers for minimap when crowded
    const step = sim.villagers.length > 60 ? 2 : 1;
    for (let i = 0; i < sim.villagers.length; i += step) {
      const v = sim.villagers[i];
      const tribe = sim.tribeOf(v.tribeId);
      mctx.fillStyle = tribe?.color || "#fff";
      mctx.fillRect(pad + (v.x / sim.tile) * sx - 1, pad + (v.y / sim.tile) * sy - 1, 2, 2);
    }
    const { w, h } = this.viewSize();
    const vx = (this.cam.x - w / 2 / this.cam.zoom) / sim.tile;
    const vy = (this.cam.y - h / 2 / this.cam.zoom) / sim.tile;
    const vw = w / this.cam.zoom / sim.tile;
    const vh = h / this.cam.zoom / sim.tile;
    mctx.strokeStyle = "rgba(240,215,140,0.9)";
    mctx.strokeRect(pad + vx * sx, pad + vy * sy, vw * sx, vh * sy);
    this._miniX = x - pad;
    this._miniY = y - pad;
    ctx.drawImage(this._miniSnap, this._miniX, this._miniY);
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
