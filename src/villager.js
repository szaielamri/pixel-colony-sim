/** Villager engine: traits, bonds, memories, pathfinding, and task AI. */

export const TRAITS = ["Curious", "Devout", "Lazy", "Inventive", "Aggressive", "Kind"];

export const NAMES = [
  "Grok", "Asha", "Lira", "Moss", "Fen", "Nia", "Bram", "Sera", "Tarn",
  "Wren", "Hali", "Ivo", "Jor", "Kael", "Orin", "Pella", "Quinn", "Rusk",
  "Uma", "Voss", "Yara", "Cinder", "Dove", "Flint", "Gorse", "Hazel",
  "Indra", "Joss", "Kite", "Maren", "Nox", "Opal", "Pip", "Bramble", "Eland",
  "Cira", "Dorr", "Ena", "Zed", "Lumen"
];

const LINES = {
  Curious: [
    "What if the river remembers us?",
    "I counted the trees and came up short.",
    "Something bright lives past the ridge."
  ],
  Devout: [
    "Someone watches with a quiet hand.",
    "The wind is trying to speak.",
    "We should set a stone and kneel."
  ],
  Lazy: [
    "The moss is already a bed.",
    "Tomorrow is also a day for work.",
    "I have invented resting."
  ],
  Inventive: [
    "A sharper stone would cut the day in half.",
    "If we bend the water, it might stay.",
    "I dreamed of a metal that remembers fire."
  ],
  Aggressive: [
    "That one took my shade.",
    "I do not forget a slight.",
    "Strength is a kind of wall."
  ],
  Kind: [
    "Sit. Eat before you speak.",
    "Your hands are cold.",
    "We can mend this."
  ]
};

export function takeName(used) {
  const pool = NAMES.filter((n) => !used.has(n));
  const name = pool.length
    ? pool[(Math.random() * pool.length) | 0]
    : `${NAMES[(Math.random() * NAMES.length) | 0]}${used.size}`;
  used.add(name);
  return name;
}

export function findPath(sim, x0, y0, x1, y1) {
  const start = sim.worldToTile(x0, y0);
  let goal = sim.worldToTile(x1, y1);
  if (!sim.walkable(goal.tx, goal.ty)) {
    const near = sim.nearestWalkable(goal.tx, goal.ty, 5);
    if (!near) return null;
    goal = near;
  }
  if (start.tx === goal.tx && start.ty === goal.ty) {
    return [sim.tileCenter(goal.tx, goal.ty)];
  }

  const key = (x, y) => y * sim.w + x;
  const h = (x, y) => Math.abs(x - goal.tx) + Math.abs(y - goal.ty);
  const open = [{ x: start.tx, y: start.ty, g: 0, f: h(start.tx, start.ty) }];
  const gScore = new Map([[key(start.tx, start.ty), 0]]);
  const came = new Map();
  const closed = new Set();
  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];
  let guard = 0;

  while (open.length && guard++ < 2200) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    const ck = key(cur.x, cur.y);
    if (closed.has(ck)) continue;
    closed.add(ck);
    if (cur.x === goal.tx && cur.y === goal.ty) {
      const path = [];
      let k = ck;
      let node = { x: cur.x, y: cur.y };
      path.push(sim.tileCenter(node.x, node.y));
      while (came.has(k)) {
        node = came.get(k);
        k = key(node.x, node.y);
        path.push(sim.tileCenter(node.x, node.y));
      }
      path.reverse();
      return path;
    }
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (!sim.walkable(nx, ny)) continue;
      if (dx !== 0 && dy !== 0) {
        if (!sim.walkable(cur.x + dx, cur.y) || !sim.walkable(cur.x, cur.y + dy)) continue;
      }
      const nk = key(nx, ny);
      if (closed.has(nk)) continue;
      const step = dx !== 0 && dy !== 0 ? 1.4 : 1;
      const ng = cur.g + step;
      if (ng >= (gScore.get(nk) ?? Infinity)) continue;
      gScore.set(nk, ng);
      came.set(nk, { x: cur.x, y: cur.y });
      open.push({ x: nx, y: ny, g: ng, f: ng + h(nx, ny) });
    }
  }
  return null;
}

function pick(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

function clampScore(v) {
  return Math.max(-100, Math.min(100, v));
}

export function resolveConversation(a, b, sim) {
  let delta = 2;
  if (a.trait === b.trait) delta += 7;
  if (
    (a.trait === "Aggressive" && b.trait === "Kind") ||
    (b.trait === "Aggressive" && a.trait === "Kind")
  ) {
    delta -= 8;
  }
  if (a.trait === "Devout" && b.trait === "Devout") delta += 6;
  if (a.trait === "Kind") delta += 3;
  if (b.trait === "Kind") delta += 3;
  if (a.urge && a.urge === b.urge) delta += 4;
  if (a.trait === "Aggressive" && Math.random() < 0.28) delta -= 11;
  if (b.trait === "Aggressive" && Math.random() < 0.28) delta -= 11;

  const shared = a.memories.some((m) => b.memories.some((n) => n.text === m.text));
  if (shared) delta += 4;

  a.addAffinity(b, delta);
  b.addAffinity(a, delta * 0.92);

  const aff = a.affinityTo(b.id);
  if (aff > 36) {
    const teacher = a.intelligence >= b.intelligence ? a : b;
    const student = teacher === a ? b : a;
    if (teacher.intelligence - student.intelligence > 10 && !student.isChild && !teacher.isChild) {
      student.tags.set(teacher.id, "Student");
      if (!student.memories.some((m) => m.text.startsWith("Became a student"))) {
        student.remember(`Became a student of ${teacher.name}`, sim.year);
      }
      student.intelligence = Math.min(100, student.intelligence + 0.6);
      sim.addInsight("culture", 0.8, student);
    }
  }

  if (aff <= -35) {
    a.tags.set(b.id, "Rival");
    b.tags.set(a.id, "Rival");
  }
  if (aff <= -60) {
    a.tags.set(b.id, "Hate");
    b.tags.set(a.id, "Hate");
  }

  if (delta <= -8) {
    a.emoteLock = "anger";
    b.emoteLock = "anger";
    a.emoteLockT = 2.2;
    b.emoteLockT = 2.2;
    sim.float((a.x + b.x) / 2, a.y - 18, "quarrel", "#e07a62");
  }

  const thief = a.trait === "Aggressive" && a.affinityTo(b.id) < -28 ? a : b.trait === "Aggressive" && b.affinityTo(a.id) < -28 ? b : null;
  const victim = thief === a ? b : thief === b ? a : null;
  if (thief && victim && Math.random() < 0.45 && victim.hunger < 85) {
    victim.hunger = Math.min(120, victim.hunger + 20);
    thief.hunger = Math.max(0, thief.hunger - 20);
    victim.remember(`Had food stolen by ${thief.name}`, sim.year);
    thief.remember(`Took a meal from ${victim.name}`, sim.year);
    victim.addAffinity(thief, -14);
    thief.tags.set(victim.id, "Rival");
    victim.tags.set(thief.id, "Hate");
    victim.emoteLock = "anger";
    victim.emoteLockT = 2.4;
    sim.log(`${thief.name} snatches a meal from ${victim.name}.`, "bad");
  }

  if (delta > 4) {
    a.shiftPersonality?.(0.4, 0.2, 1.2, 0, "Spoke kindly", sim);
    b.shiftPersonality?.(0.4, 0.1, 1.0, 0, "Heard kindness", sim);
  } else if (delta <= -8) {
    a.shiftPersonality?.(-0.5, 1.2, -2, -0.3, "Quarreled", sim);
    b.shiftPersonality?.(-0.5, 1.0, -2, -0.2, "Quarreled", sim);
    a.joinBrawl?.(sim);
    b.joinBrawl?.(sim);
  } else if (delta >= 6) {
    a.resolvePeace?.(sim);
    b.resolvePeace?.(sim);
  }

  if (
    aff >= 60 &&
    !a.partnerId &&
    !b.partnerId &&
    !a.isChild &&
    !b.isChild &&
    a.age >= 18 &&
    b.age >= 18 &&
    a.tribeId === b.tribeId &&
    Math.random() < 0.55
  ) {
    sim.startFamily(a, b);
  }

  sim.addInsight("culture", 0.9, a.intelligence > b.intelligence ? a : b);
}

function lineFor(v, other) {
  if (v.hunger > 70) return "My belly is louder than my thoughts.";
  if (v.partnerId === other?.id) return "Stay near. The fire is kinder that way.";
  if (v.urge === "shelter") return "The wind taught me what a wall is for.";
  if (v.urge === "faith") return "The storm had a voice. I want its name.";
  if (v.ideaTimer > 0) return "Wait — I can almost see it.";
  return pick(LINES[v.trait] || LINES.Kind);
}

let NEXT_VILLAGER = 1;

export class Villager {
  constructor(opts) {
    this.id = opts.id ?? NEXT_VILLAGER++;
    this.name = opts.name;
    this.age = opts.age ?? 22;
    this.ageAcc = Math.random();
    this.hunger = opts.hunger ?? 30;
    this.energy = opts.energy ?? 80;
    this.health = opts.health ?? 100;
    this.intelligence = opts.intelligence ?? 40;
    this.religionBelief = opts.religionBelief ?? 10;
    this.trait = opts.trait;
    this.aptitude = opts.aptitude || "tools";
    this.tribeId = opts.tribeId;
    this.x = opts.x;
    this.y = opts.y;
    this.skin = opts.skin;
    this.hair = opts.hair;
    this.hairStyle = opts.hairStyle ?? 0;
    this.beard = !!opts.beard;
    this.scale = opts.scale ?? 1;
    this.phase = Math.random() * Math.PI * 2;
    this.facing = Math.random() < 0.5 ? -1 : 1;
    this.affinity = new Map();
    this.tags = new Map();
    this.memories = [];
    this.partnerId = null;
    this.children = [];
    this.parentIds = opts.parentIds || [];
    this.isChild = !!opts.isChild;
    this.expecting = 0;
    this.grief = 0;
    this.urge = null;
    this.job = null;
    this.path = null;
    this.pathI = 0;
    this.moving = false;
    this.acting = false;
    this.speech = "";
    this.speechT = 0;
    this.ideaTimer = 0;
    this.insightTotal = 0;
    this.talkCd = Math.random() * 4;
    this.complainCd = 0;
    this.emote = null;
    this.emoteLock = null;
    this.emoteLockT = 0;
    this.dead = false;
    this.migrating = false;
    this.taskLabel = "Looking around";
    this.stuck = 0;
    this.lastX = this.x;
    this.lastY = this.y;
    this.isFounder = !!opts.isFounder;
    this.generation = opts.generation ?? 0;
    this.founderLineId = opts.founderLineId || null;
    this.founderLineName = opts.founderLineName || null;
    this.sex = opts.sex || (Math.random() < 0.5 ? "m" : "f");
    this.empathyScore = opts.empathyScore ?? 0;
    this.boldnessScore = opts.boldnessScore ?? 0;
    this.peacefulnessScore = opts.peacefulnessScore ?? 0;
    this.godAlignmentScore = opts.godAlignmentScore ?? 0;
    this.personalityXP = opts.personalityXP || [];
    this.traitTags = opts.traitTags || [];
    this.influenceHistory = opts.influenceHistory || [];
    this.dilemma = null;
    this.dilemmaCd = 12 + Math.random() * 20;
    this.abandoned = false;
    this.orphan = false;
    this.geneticHealth = opts.geneticHealth ?? 78 + Math.random() * 18;
    this.hereditaryTraits = opts.hereditaryTraits || [];
    this.inbreedingCoefficient = opts.inbreedingCoefficient ?? 0;
    this.illness = null;
    this.possessed = false;
    this.carried = false;
    this.body = opts.body || {
      Head: 100, Torso: 100, LeftArm: 100, RightArm: 100, LeftLeg: 100, RightLeg: 100
    };
    this.prosthetics = opts.prosthetics || {};
    if (opts.trait && this.empathyScore === 0 && this.boldnessScore === 0 && !opts.empathyScore) {
      this.initPersonalityFromTrait(opts.trait);
    }
    if (typeof this.intelligence === "number" && this.intelligence <= 100 && !opts.iqScaled) {
      this.intelligence = Math.min(200, this.intelligence * 1.6);
    }
  }

  initPersonalityFromTrait(trait) {
    const map = {
      Kind: { e: 55, b: 10, p: 45, g: 15 },
      Aggressive: { e: -35, b: 50, p: -55, g: -10 },
      Devout: { e: 25, b: 5, p: 30, g: 65 },
      Inventive: { e: 10, b: 35, p: 5, g: -5 },
      Curious: { e: 15, b: 40, p: 10, g: 0 },
      Lazy: { e: 5, b: -25, p: 20, g: 5 }
    };
    const m = map[trait] || { e: 0, b: 0, p: 0, g: 0 };
    this.empathyScore = clampScore(m.e + (Math.random() * 20 - 10));
    this.boldnessScore = clampScore(m.b + (Math.random() * 20 - 10));
    this.peacefulnessScore = clampScore(m.p + (Math.random() * 20 - 10));
    this.godAlignmentScore = clampScore(m.g + (Math.random() * 20 - 10));
    this.syncTraitFromScores();
  }

  syncTraitFromScores() {
    const scores = [
      ["Kind", this.empathyScore + this.peacefulnessScore],
      ["Aggressive", -this.peacefulnessScore + this.boldnessScore],
      ["Devout", this.godAlignmentScore],
      ["Inventive", this.boldnessScore * 0.4 + (100 - Math.abs(this.peacefulnessScore)) * 0.2],
      ["Curious", this.boldnessScore * 0.5 + this.empathyScore * 0.2],
      ["Lazy", -this.boldnessScore]
    ];
    scores.sort((a, b) => b[1] - a[1]);
    this.trait = scores[0][0];
    const tags = [];
    if (this.empathyScore >= 75) tags.push("Saintly Healer");
    if (this.empathyScore <= -75) tags.push("Cold Heart");
    if (this.boldnessScore >= 75) tags.push("Rebellious");
    if (this.boldnessScore <= -75) tags.push("Fearful");
    if (this.peacefulnessScore >= 75) tags.push("Pacifist");
    if (this.peacefulnessScore <= -75) tags.push("Belligerent");
    if (this.godAlignmentScore >= 75) tags.push("Devotee");
    if (this.godAlignmentScore <= -75) tags.push("Godless");
    for (const t of tags) {
      if (!this.traitTags.includes(t)) {
        this.traitTags.push(t);
        this.personalityXP.unshift({ text: `Became ${t}`, year: 0, deltas: {}, t: 0 });
      }
    }
  }

  shiftPersonality(de, db, dp, dg, reason, sim) {
    this.empathyScore = clampScore(this.empathyScore + de);
    this.boldnessScore = clampScore(this.boldnessScore + db);
    this.peacefulnessScore = clampScore(this.peacefulnessScore + dp);
    this.godAlignmentScore = clampScore(this.godAlignmentScore + dg);
    if (reason && (Math.abs(de) + Math.abs(db) + Math.abs(dp) + Math.abs(dg) >= 8)) {
      this.personalityXP.unshift({
        text: reason,
        year: sim?.year || 1,
        deltas: { e: de, b: db, p: dp, g: dg },
        t: sim?.time || 0
      });
      if (this.personalityXP.length > 12) this.personalityXP.pop();
    }
    const before = this.trait;
    this.syncTraitFromScores();
    if (sim && this.trait !== before && Math.abs(de) + Math.abs(db) + Math.abs(dp) + Math.abs(dg) >= 12) {
      sim.float(this.x, this.y - 20, this.trait, "#c9b0e8");
    }
  }

  logInfluence(text, year) {
    this.influenceHistory.unshift({ text, year: year || 1 });
    if (this.influenceHistory.length > 10) this.influenceHistory.pop();
  }

  resolvePeace(sim) {
    this.shiftPersonality(1, 0, 2, 0.2, "Chose peace", sim);
  }

  joinBrawl(sim) {
    this.shiftPersonality(-1, 1.5, -2, -0.2, "Joined a fight", sim);
  }

  initRelations(others) {
    for (const o of others) {
      if (!o || o.id === this.id) continue;
      if (this.affinity.has(o.id)) continue;
      let a = -6 + Math.random() * 24;
      if (o.trait === this.trait) a += 12;
      if (this.parentIds?.includes(o.id) || o.parentIds?.includes(this.id)) a += 40;
      this.affinity.set(o.id, a);
      if (!o.affinity.has(this.id)) o.affinity.set(this.id, a + (Math.random() * 8 - 4));
    }
  }

  affinityTo(id) {
    return this.affinity.get(id) ?? 0;
  }

  addAffinity(other, d) {
    const id = typeof other === "number" ? other : other.id;
    const next = Math.max(-100, Math.min(100, this.affinityTo(id) + d));
    this.affinity.set(id, next);
  }

  labelToward(other) {
    if (!other) return "Neutral";
    if (this.partnerId === other.id) return "Love";
    if (this.parentIds?.includes(other.id) || other.parentIds?.includes(this.id) || this.children?.includes(other.id)) {
      return "Love";
    }
    const tag = this.tags.get(other.id);
    const aff = this.affinityTo(other.id);
    if (tag === "Student") return "Student";
    if (tag === "Hate" || aff <= -60) return "Hate";
    if (tag === "Rival" || aff <= -30) return "Rival";
    if (aff >= 75) return "Love";
    if (aff >= 40) return "Friend";
    return "Neutral";
  }

  remember(text, year) {
    if (this.memories[0]?.text === text) return;
    this.memories.unshift({ text, year: year || 1 });
    if (this.memories.length > 6) this.memories.pop();
  }

  say(text) {
    this.speech = text;
    this.speechT = 3;
  }

  get mood() {
    let m = 38;
    m += (100 - Math.min(100, this.hunger)) * 0.26;
    m += this.energy * 0.14;
    m += (this.health - 40) * 0.18;
    if (this.partnerId) m += 8;
    if (this.grief > 0) m -= 16;
    if (this.trait === "Devout" && this.religionBelief > 55) m += 7;
    if (this.isChild) m += 6;
    let rel = 0;
    let n = 0;
    for (const v of this.affinity.values()) {
      rel += v;
      n++;
    }
    if (n) m += (rel / n) * 0.12;
    return Math.max(0, Math.min(100, m));
  }

  moodLabel() {
    const m = this.mood;
    if (m < 18) return "Despairing";
    if (m < 34) return "Miserable";
    if (m < 48) return "Uneasy";
    if (m < 64) return "Content";
    if (m < 80) return "Hopeful";
    return "Joyful";
  }

  describeRelations(sim) {
    const out = [];
    for (const [id, aff] of this.affinity) {
      const o = sim.villagerById(id);
      if (!o || o.dead) continue;
      out.push({
        id,
        name: o.name,
        aff: Math.round(aff),
        label: this.labelToward(o)
      });
    }
    out.sort((a, b) => Math.abs(b.aff) - Math.abs(a.aff));
    return out.slice(0, 5);
  }

  update(dt, sim) {
    if (this.dead) return;
    this.speechT = Math.max(0, this.speechT - dt);
    this.ideaTimer = Math.max(0, this.ideaTimer - dt);
    this.talkCd = Math.max(0, this.talkCd - dt);
    this.complainCd = Math.max(0, this.complainCd - dt);
    this.emoteLockT = Math.max(0, this.emoteLockT - dt);
    if (this.emoteLockT <= 0) this.emoteLock = null;
    this.grief = Math.max(0, this.grief - dt);

    const winter = sim.seasonIndex === 3;
    let hungerRate = (this.isChild ? 0.5 : 0.82) * (winter ? 1.42 : 1) * (this.trait === "Lazy" ? 0.88 : 1);
    if (this.job?.type === "sleep") hungerRate *= 0.72;
    this.hunger = Math.min(125, this.hunger + hungerRate * dt);

    if (this.hunger > 100) this.health -= 5.2 * dt;
    else if (this.health < 100 && this.hunger < 50 && this.energy > 40) this.health = Math.min(100, this.health + 0.8 * dt);

    if (this.age > 74 && !this.isChild) this.health -= (this.age - 74) * 0.35 * dt;

    const yearLen = sim.yearLength;
    this.ageAcc += dt;
    if (this.ageAcc >= yearLen) {
      this.ageAcc -= yearLen;
      this.age += this.isChild ? 8 : 1;
      if (this.isChild && this.age >= 16) {
        this.age = 16;
        this.isChild = false;
        this.remember("Came of age beside the fire", sim.year);
        sim.log(`${this.name} comes of age.`, "good");
      }
    }

    if (this.expecting > 0) {
      const partner = sim.villagerById(this.partnerId);
      if (!partner || partner.dead) {
        this.expecting = 0;
      } else {
        const tribe = sim.tribeOf(this.tribeId);
        if (tribe && tribe.food >= 2) this.expecting -= dt;
        if (this.expecting <= 0) {
          this.expecting = 0;
          sim.bornFrom(this, partner);
        }
      }
    }

    if (this.health <= 0) {
      const cause = this.hunger > 95 ? "starvation" : this.age > 74 ? "old age" : "wounds";
      sim.kill(this, cause);
      return;
    }

    if (this.hunger > 95 && Math.random() < dt * 0.08) {
      this.shiftPersonality(-1.2, 0.4, -0.2, -0.2, "Survived extreme hunger", sim);
    }
    if (this.isChild) this.observeMentors(dt, sim);
    this.tickDilemma(dt, sim);
    this.tickIllness(dt, sim);

    if (this.possessed || this.carried) {
      this.moving = !!this.moving && this.possessed;
      this.acting = !!this.acting && this.possessed;
      this.clampBody(sim);
      this.pickEmote(sim);
      return;
    }

    if (!this.job && this.needsProsthetic() && sim.hasTech("carpentry") && Math.random() < 0.35) {
      this.beginProsthetic(sim);
    }

    if (this.shouldInterrupt(sim)) this.decide(sim, true);
    else if (!this.job) this.decide(sim, false);

    this.execute(dt, sim);
    this.clampBody(sim);
    this.pickEmote(sim);
  }

  observeMentors(dt, sim) {
    for (const o of sim.villagers) {
      if (o.id === this.id || o.dead || o.isChild) continue;
      if (Math.hypot(o.x - this.x, o.y - this.y) > 80) continue;
      if (o.peacefulnessScore > 30) this.peacefulnessScore = clampScore(this.peacefulnessScore + 0.1 * dt);
      if (o.peacefulnessScore < -20 || o.emote === "anger") {
        this.boldnessScore = clampScore(this.boldnessScore + 0.1 * dt);
        this.godAlignmentScore = clampScore(this.godAlignmentScore - 0.1 * dt);
      }
    }
  }

  tickDilemma(dt, sim) {
    this.dilemmaCd = Math.max(0, this.dilemmaCd - dt);
    if (this.dilemma) {
      this.dilemma.t -= dt;
      if (this.dilemma.t <= 0) {
        this.resolveDilemma(sim, "auto");
      }
      return;
    }
    if (this.dilemmaCd > 0 || this.isChild || this.dead) return;
    if (this.hunger > 85 && Math.random() < 0.35) {
      this.openDilemma(sim, "steal", "Food is scarce. Do you take from another basket?");
    } else if (this.tags.size && Math.random() < 0.25) {
      const rival = [...this.tags.entries()].find(([, t]) => t === "Rival" || t === "Hate");
      if (rival) this.openDilemma(sim, "fight", "A rival walks near. Do you strike?");
    } else if (this.mood < 28 && Math.random() < 0.2) {
      this.openDilemma(sim, "leave", "The camp feels wrong. Do you leave?");
    }
  }

  openDilemma(sim, kind, text) {
    this.dilemma = { kind, text, t: 10 };
    this.dilemmaCd = 40 + Math.random() * 30;
    this.emoteLock = "question";
    this.emoteLockT = 10;
  }

  resolveDilemma(sim, choice) {
    if (!this.dilemma) return;
    const kind = this.dilemma.kind;
    this.dilemma = null;
    this.emoteLock = null;
    let path = choice;
    if (choice === "auto") {
      if (this.peacefulnessScore > 20 || this.empathyScore > 25) path = "good";
      else if (this.boldnessScore > 25 || this.peacefulnessScore < -20) path = "conflict";
      else path = "decide";
    }
    if (path === "good") {
      this.shiftPersonality(10, -2, 8, 2, "Chose mercy", sim);
      this.logInfluence("Guided toward good", sim.year);
      this.say("I will not.");
    } else if (path === "conflict") {
      this.shiftPersonality(-6, 10, -10, -2, "Chose conflict", sim);
      this.logInfluence("Guided toward conflict", sim.year);
      if (kind === "leave") this.beginWander(sim, 14);
      else if (kind === "fight") this.beginFlee(sim);
      this.say("So be it.");
    } else {
      this.logInfluence("Left to decide alone", sim.year);
      if (this.empathyScore > this.boldnessScore) this.shiftPersonality(2, 0, 2, 0, "Followed their heart", sim);
      else this.shiftPersonality(-1, 2, -2, 0, "Followed their fire", sim);
    }
  }

  tickIllness(dt, sim) {
    if (!this.illness) return;
    this.illness.t -= dt;
    this.health -= (this.illness.dps || 1.2) * dt * (1 - this.geneticHealth / 200);
    if (this.illness.t <= 0) {
      this.illness = null;
      this.remember("Recovered from sickness", sim.year);
    }
  }

  moveSpeedFactor() {
    const L = this.effectiveLimb("LeftLeg");
    const R = this.effectiveLimb("RightLeg");
    if (L <= 0 && R <= 0) return 0.22;
    if (L <= 0 || R <= 0) return 0.5;
    return 0.55 + 0.45 * ((L + R) / 200);
  }

  workSpeedFactor() {
    const L = this.effectiveLimb("LeftArm");
    const R = this.effectiveLimb("RightArm");
    if (L <= 0 && R <= 0) return 0.2;
    if (L <= 0 || R <= 0) return 0.5;
    return 0.55 + 0.45 * ((L + R) / 200);
  }

  effectiveLimb(part) {
    const base = this.body?.[part] ?? 100;
    if (base > 0) return base;
    const p = this.prosthetics?.[part];
    if (p === "peg" || p === "hook") return 72;
    return 0;
  }

  needsProsthetic() {
    for (const part of ["LeftLeg", "RightLeg", "LeftArm", "RightArm"]) {
      if ((this.body?.[part] ?? 100) <= 0 && !this.prosthetics?.[part]) return part;
    }
    return null;
  }

  injure(part, amount, sim) {
    if (!this.body) return;
    const before = this.body[part] ?? 100;
    this.body[part] = Math.max(0, before - amount);
    this.health = Math.max(0, this.health - amount * 0.35);
    if (before > 0 && this.body[part] <= 0) {
      this.remember(`Lost use of ${part}`, sim?.year || 1);
      if (sim) sim.float(this.x, this.y - 16, part, "#e07a62");
      if (part.includes("Leg")) this.shiftPersonality(0, -8, -2, 0, "Crippled by injury", sim);
    }
  }

  healBody(amount = 40) {
    for (const k of Object.keys(this.body || {})) {
      if (this.body[k] > 0) this.body[k] = Math.min(100, this.body[k] + amount);
    }
  }

  beginProsthetic(sim) {
    const part = this.needsProsthetic();
    if (!part) return;
    const bench = sim.structures.find((s) => s.tribeId === this.tribeId && (s.type === "workbench" || s.type === "campfire"));
    const tribe = sim.tribeOf(this.tribeId);
    if (!bench || !tribe || tribe.wood < 4) return;
    const stand = sim.standNear(bench.tx, bench.ty);
    const kind = part.includes("Leg") ? "peg" : "hook";
    this.setJob(sim, { type: "craft_prosthetic", tx: stand.tx, ty: stand.ty, part, kind });
    this.taskLabel = `Crafting a ${kind === "peg" ? "peg leg" : "hook hand"}`;
  }

  catchIllness(type, dur = 18) {
    if (this.hereditaryTraits.includes("Immune Boost") && Math.random() < 0.55) return;
    this.illness = { type, t: dur, dps: type === "plague" ? 2.4 : type === "radiation" ? 1.8 : 1.1 };
  }

  clampBody(sim) {
    this.hunger = Math.max(0, Math.min(125, this.hunger));
    this.energy = Math.max(0, Math.min(100, this.energy));
    this.health = Math.max(0, Math.min(100, this.health));
    this.religionBelief = Math.max(0, Math.min(100, this.religionBelief));
    const pad = 8;
    const maxX = sim.w * sim.tile - pad;
    const maxY = sim.h * sim.tile - pad;
    this.x = Math.max(pad, Math.min(maxX, this.x));
    this.y = Math.max(pad, Math.min(maxY, this.y));
  }

  shouldInterrupt(sim) {
    const feeding = this.job?.type === "eat" || (this.job?.type === "gather" && this.job.personal);
    if (this.health < 12 && !feeding && this.job?.type !== "flee") return true;
    const hazard = sim.hazardAt(this.x, this.y);
    if (hazard && this.job?.type !== "flee" && this.job?.type !== "pray") return true;
    if (sim.isNight() && this.hunger < 78 && this.energy < 92 && this.job?.type !== "sleep" && this.job?.type !== "eat" && !this.migrating) {
      if (this.job?.type !== "flee" && this.job?.type !== "pray") return this.energy < 55 || sim.dayT > 0.8;
    }
    if (this.hunger > 78 && !feeding && this.job?.type !== "flee" && this.job?.type !== "pray") return true;
    return false;
  }

  decide(sim, urgent) {
    if (this.dead) return;
    const hazard = sim.hazardAt(this.x, this.y);

    if (this.migrating && this.hunger <= 80 && !hazard) {
      const tribe = sim.tribeOf(this.tribeId);
      if (tribe) {
        const tile = sim.worldToTile(tribe.homeX, tribe.homeY);
        this.setJob(sim, { type: "migrate", tx: tile.tx, ty: tile.ty });
        this.taskLabel = "Walking to a new fire";
        return;
      }
    }

    if (hazard) {
      if (this.trait === "Devout" && this.health > 38 && Math.random() < (urgent ? 0.65 : 0.4)) {
        const here = sim.worldToTile(this.x, this.y);
        this.job = { type: "pray", tx: here.tx, ty: here.ty, stage: "act", timer: 4.2, acc: 0 };
        this.path = null;
        this.taskLabel = "Praying into the danger";
        this.say(this.trait === "Devout" ? "The wind is a voice." : "Hold.");
        return;
      }
      this.beginFlee(sim);
      return;
    }

    if (this.isChild) {
      this.childDecide(sim);
      return;
    }

    if (this.hunger > 64) {
      if (this.beginEat(sim)) return;
    }

    if ((sim.isNight() && this.hunger < 80) || this.energy < 16) {
      this.beginSleep(sim);
      return;
    }

    if (this.trait === "Lazy" && this.energy < 42 && Math.random() < 0.7) {
      this.beginSleep(sim);
      return;
    }

    const tribe = sim.tribeOf(this.tribeId);
    if (!tribe) {
      this.beginWander(sim);
      return;
    }

    if (this.trait !== "Lazy" || Math.random() < 0.45) {
      const blueprint = sim.nearestBlueprint(this);
      if (blueprint) {
        const stand = sim.standNear(blueprint.tx, blueprint.ty);
        this.setJob(sim, { type: "build", tx: stand.tx, ty: stand.ty, blueprintId: blueprint.id });
        this.taskLabel = `Raising a ${blueprint.type}`;
        return;
      }

      if (tribe.food < sim.tribePop(tribe.id) * 2.2) {
        if (sim.hasTech("farming")) {
          const ripe = sim.findRipeFarm(this);
          if (ripe) {
            const stand = sim.standNear(ripe.tx, ripe.ty);
            this.setJob(sim, { type: "harvest", tx: ripe.tx, ty: ripe.ty, standTx: stand.tx, standTy: stand.ty });
            this.taskLabel = "Bringing in the harvest";
            return;
          }
          const plot = sim.findFarmSite(this);
          if (plot && sim.farmCount(tribe.id) < Math.max(1, Math.ceil(sim.tribePop(tribe.id) / 4))) {
            const stand = sim.standNear(plot.tx, plot.ty);
            this.setJob(sim, { type: "till", tx: plot.tx, ty: plot.ty, standTx: stand.tx, standTy: stand.ty });
            this.taskLabel = "Turning soil";
            return;
          }
        }
        const foodTile = sim.findResource(this, ["manna", "bush"], 16);
        if (foodTile) {
          const stand = sim.standNear(foodTile.tx, foodTile.ty);
          this.setJob(sim, {
            type: "gather",
            tx: foodTile.tx,
            ty: foodTile.ty,
            standTx: stand.tx,
            standTy: stand.ty,
            personal: tribe.food < 1 && this.hunger > 50
          });
          this.taskLabel = foodTile.res === "manna" ? "Gathering a divine gift" : "Gathering berries";
          return;
        }
      }

      if (tribe.wood < 14) {
        const tree = sim.findResource(this, ["tree"], 18);
        if (tree) {
          const stand = sim.standNear(tree.tx, tree.ty);
          this.setJob(sim, { type: "gather", tx: tree.tx, ty: tree.ty, standTx: stand.tx, standTy: stand.ty });
          this.taskLabel = "Cutting wood";
          return;
        }
      }

      if (tribe.stone < 8 && (this.aptitude === "tools" || this.trait === "Inventive" || Math.random() < 0.4)) {
        const rock = sim.findResource(this, ["stone"], 18);
        if (rock) {
          const stand = sim.standNear(rock.tx, rock.ty);
          this.setJob(sim, { type: "gather", tx: rock.tx, ty: rock.ty, standTx: stand.tx, standTy: stand.ty });
          this.taskLabel = "Knapping stone";
          return;
        }
      }

      if ((this.trait === "Inventive" || this.urge) && Math.random() < (this.urge ? 0.85 : 0.55)) {
        this.beginResearch(sim);
        return;
      }

      if (this.trait === "Devout" && (sim.religion || this.religionBelief > 40) && Math.random() < 0.4) {
        const spot = sim.shrineTile(this.tribeId) || sim.campTile(this.tribeId);
        if (spot) {
          this.setJob(sim, { type: "pray", tx: spot.tx, ty: spot.ty });
          this.taskLabel = "Keeping the rite";
          return;
        }
      }

      if (this.trait === "Curious" && Math.random() < 0.45) {
        this.beginWander(sim, 10);
        this.taskLabel = "Wandering after a question";
        return;
      }
    }

    if (this.talkCd <= 0 && Math.random() < 0.62) {
      const other = this.pickTalkTarget(sim);
      if (other) {
        const tile = sim.worldToTile(other.x, other.y);
        const stand = sim.standNear(tile.tx, tile.ty);
        this.setJob(sim, { type: "talk", tx: stand.tx, ty: stand.ty, otherId: other.id, resolved: false });
        this.taskLabel = `Seeking ${other.name}`;
        return;
      }
    }

    this.beginWander(sim);
  }

  childDecide(sim) {
    if (this.hunger > 60) {
      if (this.beginEat(sim)) return;
    }
    const parent = this.parentIds.map((id) => sim.villagerById(id)).find((p) => p && !p.dead);
    if (parent && Math.hypot(parent.x - this.x, parent.y - this.y) > 36) {
      const tile = sim.worldToTile(parent.x, parent.y);
      this.setJob(sim, { type: "wander", tx: tile.tx, ty: tile.ty });
      this.taskLabel = `Following ${parent.name}`;
      return;
    }
    this.beginWander(sim, 3);
    this.taskLabel = "Playing in the grass";
  }

  pickTalkTarget(sim) {
    let best = null;
    let bestScore = -Infinity;
    for (const o of sim.villagers) {
      if (o.id === this.id || o.dead || o.tribeId !== this.tribeId || o.isChild !== this.isChild) continue;
      if (o.job && !["wander", "talk", "pray", "research"].includes(o.job.type) && o.job.stage === "act") continue;
      const d = Math.hypot(o.x - this.x, o.y - this.y);
      if (d > 150) continue;
      let score = 80 - d;
      if (this.trait === "Aggressive") score += Math.max(0, -this.affinityTo(o.id));
      else if (this.trait === "Kind") score += Math.max(0, 50 - o.mood);
      else score += this.affinityTo(o.id) * 0.4;
      if (this.partnerId === o.id) score += 40;
      if (score > bestScore) {
        bestScore = score;
        best = o;
      }
    }
    return best;
  }

  beginEat(sim) {
    const tribe = sim.tribeOf(this.tribeId);
    if (tribe && tribe.food >= 1) {
      const camp = sim.campTile(this.tribeId);
      if (camp) {
        const stand = sim.standNear(camp.tx, camp.ty);
        this.setJob(sim, { type: "eat", tx: stand.tx, ty: stand.ty, mode: "stock" });
        this.taskLabel = "Going to eat";
        return true;
      }
    }
    const tile = sim.findResource(this, ["manna", "bush"], 20);
    if (tile) {
      const stand = sim.standNear(tile.tx, tile.ty);
      this.setJob(sim, { type: "gather", tx: tile.tx, ty: tile.ty, standTx: stand.tx, standTy: stand.ty, personal: true });
      this.taskLabel = "Foraging a meal";
      return true;
    }
    if (this.complainCd <= 0) {
      this.say("The baskets are empty.");
      this.complainCd = 8;
    }
    return false;
  }

  beginSleep(sim) {
    const hut = sim.nearestStructure(this, ["hut", "longhouse"]) || null;
    const camp = sim.campTile(this.tribeId);
    const spot = hut
      ? sim.standNear(hut.tx, hut.ty)
      : camp
        ? sim.standNear(camp.tx, camp.ty)
        : sim.worldToTile(this.x, this.y);
    this.setJob(sim, { type: "sleep", tx: spot.tx, ty: spot.ty });
    this.taskLabel = "Resting";
  }

  beginResearch(sim) {
    const field = this.urge || this.aptitude || "tools";
    const spot = sim.shrineTile(this.tribeId) || sim.campTile(this.tribeId) || sim.worldToTile(this.x, this.y);
    const stand = sim.standNear(spot.tx, spot.ty);
    this.setJob(sim, { type: "research", tx: stand.tx, ty: stand.ty, field, acc: 0 });
    this.taskLabel = `Thinking about ${field}`;
  }

  beginWander(sim, radius = 6) {
    const here = sim.worldToTile(this.x, this.y);
    const spot = sim.randomWalkableNear(here.tx, here.ty, radius) || here;
    this.setJob(sim, { type: "wander", tx: spot.tx, ty: spot.ty });
    this.taskLabel = "Wandering";
  }

  beginFlee(sim) {
    const threat = sim.threatPoint(this.x, this.y);
    const here = sim.worldToTile(this.x, this.y);
    let best = null;
    let bestD = -1;
    for (let i = 0; i < 10; i++) {
      const tx = here.tx + ((Math.random() * 14) | 0) - 7;
      const ty = here.ty + ((Math.random() * 14) | 0) - 7;
      if (!sim.walkable(tx, ty)) continue;
      if (sim.tileFire(tx, ty) > 0.2) continue;
      const c = sim.tileCenter(tx, ty);
      const d = Math.hypot(c.x - threat.x, c.y - threat.y);
      if (d > bestD) {
        bestD = d;
        best = { tx, ty };
      }
    }
    if (!best) best = sim.nearestWalkable(here.tx, here.ty, 6) || here;
    this.setJob(sim, { type: "flee", tx: best.tx, ty: best.ty });
    this.taskLabel = "Fleeing";
    if (Math.random() < 0.4) this.say("Run!");
  }

  setJob(sim, job) {
    this.job = { stage: "goto", timer: 0, acc: 0, resolved: false, ...job };
    const destTx = job.standTx ?? job.tx;
    const destTy = job.standTy ?? job.ty;
    const dest = sim.tileCenter(destTx, destTy);
    this.path = findPath(sim, this.x, this.y, dest.x, dest.y);
    this.pathI = 0;
    this.stuck = 0;
    if (!this.path) {
      if (sim.walkable(destTx, destTy)) this.path = [dest];
      else {
        this.job = { type: "wander", stage: "act", timer: 0.8, tx: destTx, ty: destTy };
        this.path = null;
      }
    }
  }

  execute(dt, sim) {
    this.moving = false;
    this.acting = false;
    if (!this.job) return;

    if (this.job.stage === "goto") {
      this.follow(dt, sim);
      return;
    }
    this.acting = this.job.type === "gather" || this.job.type === "build" || this.job.type === "till" || this.job.type === "harvest";
    this.job.timer -= dt;

    if (this.job.type === "sleep") {
      this.energy = Math.min(100, this.energy + (this.trait === "Lazy" ? 20 : 16) * dt);
      const nearFire = sim.nearCampfire(this.x, this.y, this.tribeId);
      if (nearFire) sim.addInsight("fire", 0.12 * dt, this);
      if (this.hunger > 82) {
        this.job = null;
        return;
      }
      if (!sim.isNight() && this.energy > 78) this.job = null;
      else if (this.energy >= 100 && sim.dayT > 0.12 && sim.dayT < 0.7) this.job = null;
      this.taskLabel = "Sleeping";
      return;
    }

    if (this.job.type === "eat") {
      const tribe = sim.tribeOf(this.tribeId);
      if (tribe && tribe.food >= 1) {
        tribe.food -= 1;
        this.hunger = Math.max(0, this.hunger - 44);
        this.say("I needed that.");
        sim.addInsight("fire", 0.7, this);
        sim.float(this.x, this.y - 14, "ate", "#d7c4a2");
      }
      this.job = null;
      return;
    }

    if (this.job.type === "gather" || this.job.type === "harvest" || this.job.type === "till") {
      if (this.job.timer > 0) {
        this.energy = Math.max(0, this.energy - 1.15 * dt);
        return;
      }
      if (this.job.type === "gather") sim.harvest(this, this.job.tx, this.job.ty, !!this.job.personal);
      else if (this.job.type === "harvest") sim.harvestFarm(this, this.job.tx, this.job.ty);
      else sim.tillFarm(this, this.job.tx, this.job.ty);
      this.job = null;
      return;
    }

    if (this.job.type === "build") {
      this.energy = Math.max(0, this.energy - 1.05 * dt);
      const bp = sim.blueprintById(this.job.blueprintId);
      if (!bp) {
        this.job = null;
        return;
      }
      const tool = sim.hasTech("stone_tools") ? 1.28 : 1;
      const lazy = this.trait === "Lazy" ? 0.62 : 1;
      bp.progress += dt * 18 * tool * lazy * this.workSpeedFactor();
      sim.addInsight("shelter", 0.35 * dt, this);
      if (bp.progress >= 100) sim.finishBlueprint(bp, this);
      if (!sim.blueprintById(this.job.blueprintId)) this.job = null;
      return;
    }

    if (this.job.type === "craft_prosthetic") {
      this.energy = Math.max(0, this.energy - 0.8 * dt);
      this.job.acc = (this.job.acc || 0) + dt;
      if (this.job.acc >= 5) {
        const tribe = sim.tribeOf(this.tribeId);
        if (tribe && tribe.wood >= 4) {
          tribe.wood -= 4;
          this.prosthetics[this.job.part] = this.job.kind;
          this.remember(`Fitted a ${this.job.kind} ${this.job.part}`, sim.year);
          sim.log(`${this.name} fits a wooden ${this.job.kind === "peg" ? "peg leg" : "hook"}.`, "good");
          sim.float(this.x, this.y - 14, this.job.kind, "#c4a07a");
        }
        this.job = null;
      }
      return;
    }

    if (this.job.type === "pray") {
      this.energy = Math.max(0, this.energy - 0.4 * dt);
      this.religionBelief = Math.min(100, this.religionBelief + 2.4 * dt);
      this.job.acc += dt;
      if (this.job.acc >= 1) {
        this.job.acc = 0;
        sim.addInsight("faith", this.trait === "Devout" ? 1.8 : 0.8, this);
      }
      if (sim.weather?.type === "hurricane") this.health -= 0.45 * dt;
      if (this.job.timer <= 0 || this.health < 22) {
        if (sim.weather?.type === "hurricane" && this.health > 0) {
          this.remember("Prayed while the hurricane screamed", sim.year);
        }
        this.job = null;
      }
      return;
    }

    if (this.job.type === "research") {
      this.energy = Math.max(0, this.energy - 0.55 * dt);
      this.job.acc += dt;
      const rate = this.trait === "Inventive" ? 2.3 : this.trait === "Curious" ? 1.5 : 1;
      if (this.job.acc >= 1) {
        this.job.acc = 0;
        sim.addInsight(this.job.field, rate, this);
      }
      if (this.job.timer <= 0) this.job = null;
      return;
    }

    if (this.job.type === "talk") {
      const other = sim.villagerById(this.job.otherId);
      if (!other || other.dead) {
        this.job = null;
        return;
      }
      this.facing = other.x < this.x ? -1 : 1;
      if (!this.job.resolved) {
        this.job.resolved = true;
        this.say(lineFor(this, other));
        other.say(lineFor(other, this));
        resolveConversation(this, other, sim);
        this.talkCd = 7;
        other.talkCd = 7;
        if (!other.job || other.job.type !== "talk") {
          other.job = { type: "talk", stage: "act", timer: this.job.timer, otherId: this.id, resolved: true };
        }
      }
      if (this.job.timer <= 0) this.job = null;
      return;
    }

    if (this.job.type === "wander" || this.job.type === "flee" || this.job.type === "migrate") {
      if ((this.job.timer || 0) > 0) {
        this.job.timer -= dt;
        return;
      }
      this.job = null;
    }
  }

  follow(dt, sim) {
    if (!this.job) return;
    if (!this.path || this.pathI >= this.path.length) {
      this.arrive(sim);
      return;
    }
    const target = this.path[this.pathI];
    let dx = target.x - this.x;
    let dy = target.y - this.y;
    let dist = Math.hypot(dx, dy);
    if (dist < 3) {
      this.pathI++;
      if (this.pathI >= this.path.length) this.arrive(sim);
      return;
    }

    if (this.job.type === "talk") {
      const other = sim.villagerById(this.job.otherId);
      if (other && Math.hypot(other.x - this.x, other.y - this.y) < 18) {
        this.job.stage = "act";
        this.job.timer = 2.6;
        this.acting = false;
        return;
      }
    }

    const winter = sim.seasonIndex === 3 ? 0.84 : 1;
    let speed = 30 * winter * (this.scale || 1) * this.moveSpeedFactor();
    if (this.trait === "Lazy") speed *= 0.74;
    if (this.isChild) speed *= 0.92;
    if (this.job.type === "flee") speed *= 1.48;
    if (this.energy < 12) speed *= 0.7;
    if (this.illness) speed *= 0.55;

    const step = Math.min(dist, speed * dt);
    this.facing = dx < 0 ? -1 : 1;
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    if (sim.walkablePixel(nx, ny)) {
      this.x = nx;
      this.y = ny;
      this.moving = true;
    } else if (sim.walkablePixel(nx, this.y)) {
      this.x = nx;
      this.moving = true;
    } else if (sim.walkablePixel(this.x, ny)) {
      this.y = ny;
      this.moving = true;
    } else {
      this.stuck += dt;
    }

    const moved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
    if (moved < 0.35) this.stuck += dt;
    else this.stuck = 0;
    this.lastX = this.x;
    this.lastY = this.y;

    if (this.moving && this.job.type !== "flee") {
      const tile = sim.getTileAtPixel(this.x, this.y);
      if (tile && tile.type === "grass") {
        tile.wear = (tile.wear || 0) + dt;
        if (tile.wear > 22) {
          tile.type = "path";
          tile.wear = 0;
          sim.terrainDirty = true;
        }
      }
    }

    this.energy = Math.max(0, this.energy - 0.62 * dt);

    if (this.stuck > 1.1 && this.path?.length) {
      this.stuck = 0;
      const dest = this.path[this.path.length - 1];
      this.path = findPath(sim, this.x, this.y, dest.x, dest.y);
      this.pathI = 0;
      if (!this.path) this.job = null;
    }
  }

  arrive(sim) {
    if (!this.job) return;
    const type = this.job.type;
    if (type === "wander") {
      this.job = null;
      return;
    }
    if (type === "flee") {
      if (sim.hazardAt(this.x, this.y)) this.beginFlee(sim);
      else this.job = null;
      return;
    }
    if (type === "migrate") {
      sim.migrantArrived(this);
      this.job = null;
      return;
    }
    if (type === "talk") {
      const other = sim.villagerById(this.job.otherId);
      if (!other || other.dead || Math.hypot(other.x - this.x, other.y - this.y) > 28) {
        this.job = null;
        return;
      }
      this.job.stage = "act";
      this.job.timer = 2.6;
      return;
    }
    if (type === "gather" || type === "till" || type === "harvest") {
      const tile = sim.getTile(this.job.tx, this.job.ty);
      if (!tile) {
        this.job = null;
        return;
      }
      if (type === "gather" && !(tile.amount > 0)) {
        this.job = null;
        return;
      }
      if (type === "harvest" && !(tile.type === "farm" && tile.growth >= 1)) {
        this.job = null;
        return;
      }
      const lazy = this.trait === "Lazy" ? 1.55 : 1;
      const tools = sim.hasTech("iron") ? 0.55 : sim.hasTech("bronze") ? 0.68 : sim.hasTech("stone_tools") ? 0.78 : 1;
      this.job.stage = "act";
      this.job.timer = 2.15 * lazy * tools;
      const center = sim.tileCenter(this.job.tx, this.job.ty);
      this.facing = center.x < this.x ? -1 : 1;
      return;
    }
    if (type === "build") {
      const bp = sim.blueprintById(this.job.blueprintId);
      if (!bp) {
        this.job = null;
        return;
      }
      this.job.stage = "act";
      this.job.timer = 99;
      return;
    }
    if (type === "sleep" || type === "eat" || type === "pray" || type === "research" || type === "craft_prosthetic") {
      this.job.stage = "act";
      if (type === "pray") this.job.timer = 4.5;
      else if (type === "research") this.job.timer = this.trait === "Inventive" ? 6.5 : 5;
      else if (type === "craft_prosthetic") this.job.timer = 6;
      else this.job.timer = 0;
      return;
    }
    this.job = null;
  }

  pickEmote(sim) {
    if (this.dilemma) {
      this.emote = "question";
      return;
    }
    if (this.ideaTimer > 0) {
      this.emote = "idea";
      return;
    }
    if (this.emoteLock) {
      this.emote = this.emoteLock;
      return;
    }
    if (this.illness) {
      this.emote = "sick";
      return;
    }
    if (this.job?.type === "sleep" && this.job.stage === "act") {
      this.emote = "sleep";
      return;
    }
    if (this.job?.type === "pray" && this.job.stage === "act") {
      this.emote = "pray";
      return;
    }
    if (this.partnerId) {
      const p = sim.villagerById(this.partnerId);
      if (p && Math.hypot(p.x - this.x, p.y - this.y) < 34) {
        this.emote = "love";
        return;
      }
    }
    for (const [id, aff] of this.affinity) {
      if (aff > -50 && this.tags.get(id) !== "Hate" && this.tags.get(id) !== "Rival") continue;
      const o = sim.villagerById(id);
      if (o && Math.hypot(o.x - this.x, o.y - this.y) < 30) {
        this.emote = "anger";
        return;
      }
    }
    this.emote = null;
  }

  toolKind() {
    if (!this.job) return null;
    if (this.job.type === "build" || this.job.type === "till") return "hammer";
    if (this.job.type === "pray") return "staff";
    if (this.job.type === "gather" || this.job.type === "harvest") {
      if (this.taskLabel.includes("wood") || this.taskLabel.includes("Cut")) return "axe";
      if (this.taskLabel.includes("stone") || this.taskLabel.includes("Knap")) return "pick";
      if (this.taskLabel.includes("harvest") || this.taskLabel.includes("soil")) return "hoe";
      return "basket";
    }
    return null;
  }
}
