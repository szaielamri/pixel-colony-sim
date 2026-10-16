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

/** Building blocks for free speech — composed like a living mind. */
const SPEECH_BITS = {
  open: ["Listen—", "I keep thinking…", "Between us—", "Honestly,", "Hmm.", "You know,", ""],
  self: ["I", "Me,", "My gut says", "Something in me"],
  feel: {
    low: ["ache", "feel thin", "can't shake this", "am tired of pretending"],
    mid: ["wonder", "notice", "keep circling", "feel almost alright"],
    high: ["feel light", "could dance", "want to laugh", "am full of the day"]
  },
  about: ["the fire", "the ridge", "tomorrow", "your face", "the empty baskets", "the sky", "what we built", "the cold", "home", "the war", "gold", "a child"],
  ask: ["Do you ever…?", "What would you do?", "Am I wrong?", "Will you stay?", "Did you see that?", "Why us?"],
  trait: {
    Curious: ["I need to know.", "There's a question under that.", "Show me."],
    Devout: ["The quiet is listening.", "Bless this.", "I felt a hand I cannot see."],
    Lazy: ["Later.", "Not with these bones.", "The ground is soft enough."],
    Inventive: ["There's a better way.", "If we change one thing…", "I can almost see it."],
    Aggressive: ["Say that again.", "I won't be small.", "Move."],
    Kind: ["I'm here.", "Take my share.", "You matter more than the work."]
  },
  night: ["The dark feels honest.", "Stars look like old names.", "I should sleep. I won't."],
  cold: ["My hands won't warm.", "Find the fire.", "Winter bites first."],
  love: ["Stay close.", "You smell like home.", "I chose you again today."],
  hate: ["Don't stand near me.", "I remember what you did.", "One day."],
  work: ["My hands know this.", "One more before dark.", "This is who I am when I work."],
  idle: ["…", "Just breathing.", "Nothing is nothing.", "I forgot what I meant to say."]
};

function chance(p) {
  return Math.random() < p;
}

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

  a.socialNeed = Math.min(100, (a.socialNeed || 50) + 8);
  b.socialNeed = Math.min(100, (b.socialNeed || 50) + 8);
  a.loneliness = Math.max(0, (a.loneliness || 0) - 12);
  b.loneliness = Math.max(0, (b.loneliness || 0) - 12);

  // Personal gold exchange — micro-economy
  if (a.tribeId !== b.tribeId || Math.random() < 0.25) {
    if ((a.personalGold || 0) > 0.5 && b.hunger > 60 && Math.random() < 0.4) {
      a.personalGold -= 0.4;
      b.personalGold = (b.personalGold || 0) + 0.2;
      b.hunger = Math.max(0, b.hunger - 15);
      a.gainSkill?.("trade", 1.5);
      b.gainSkill?.("trade", 0.8);
      sim.float((a.x + b.x) / 2, a.y - 16, "deal", "#f0d78c");
    }
  }
  // Mentorship — skills rub off in conversation
  if (Math.random() < 0.3) {
    const sk = a.topSkill?.() || "forage";
    b.gainSkill?.(sk, 0.6);
    a.gainSkill?.(sk, 0.2);
  }

  // Gossip — humans pass stories; shifts third-party affinity
  if (Math.random() < 0.35) {
    const subject = sim.villagers.find((o) =>
      o.id !== a.id && o.id !== b.id && !o.dead && (a.affinity.has(o.id) || b.affinity.has(o.id))
    );
    if (subject) {
      const spin = (Math.random() - 0.45) * 10;
      a.addAffinity(subject, spin * 0.5);
      b.addAffinity(subject, spin * 0.5);
      if (Math.abs(spin) > 5) {
        a.say(spin > 0 ? `About ${subject.name}…` : `Have you heard of ${subject.name}?`);
      }
    }
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
  return v.composeSpeech?.(other, "talk") || pick(LINES[v.trait] || LINES.Kind);
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
    this.thought = "";
    this.want = null;
    this.wantT = 0;
    this.mindAcc = Math.random() * 3;
    this.babbleCd = 2 + Math.random() * 6;
    this.autonomy = 0.55 + Math.random() * 0.4; // how strongly they follow their own wants
    this.moodDrift = (Math.random() - 0.5) * 10; // personal baseline temperament
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
    this.socialNeed = opts.socialNeed ?? 55 + Math.random() * 25;
    this.safetyNeed = opts.safetyNeed ?? 60 + Math.random() * 20;
    this.surname = opts.surname || opts.founderLineName || null;
    this.breakdown = opts.breakdown || null;
    this.breakdownCd = 8 + Math.random() * 20;
    this.prayerBuffT = 0;
    this.vaccineProgress = opts.vaccineProgress ?? 0;
    this.graveX = opts.graveX ?? null;
    this.graveY = opts.graveY ?? null;
    this.sleepDebt = opts.sleepDebt ?? 0;
    this.bodyTemp = opts.bodyTemp ?? 37;
    this.loneliness = opts.loneliness ?? 0;
    this.bondDecayAcc = 0;
    this.routineHint = "living";
    this.personalGold = opts.personalGold ?? 0;
    this.skills = opts.skills || {
      forage: 5 + Math.random() * 10,
      craft: 5 + Math.random() * 10,
      farm: 5 + Math.random() * 8,
      combat: 5 + Math.random() * 10,
      mine: 2 + Math.random() * 6,
      trade: 3 + Math.random() * 8,
      lead: 2 + Math.random() * 6
    };
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

  get displayName() {
    return this.surname ? `${this.name} ${this.surname}` : this.name;
  }

  /** Real human life stage from age. */
  get lifeStage() {
    if (this.age < 3) return "infant";
    if (this.age < 12) return "child";
    if (this.age < 18) return "youth";
    if (this.age < 45) return "adult";
    if (this.age < 65) return "mature";
    return "elder";
  }

  get lifeStageLabel() {
    return ({
      infant: "Infant", child: "Child", youth: "Youth",
      adult: "Adult", mature: "Middle-aged", elder: "Elder"
    })[this.lifeStage];
  }

  /** Needs as 0–100 satisfaction (high = fulfilled). */
  get needHunger() {
    return Math.max(0, Math.min(100, 100 - this.hunger));
  }
  get needRest() {
    return Math.max(0, Math.min(100, this.energy - this.sleepDebt * 0.35));
  }
  get needSocial() {
    return Math.max(0, Math.min(100, this.socialNeed - this.loneliness * 0.2));
  }
  get needSafety() {
    return Math.max(0, Math.min(100, this.safetyNeed));
  }

  /** Fertility window — adults in peak years, partners present. */
  get canConceive() {
    if (this.isChild || this.expecting > 0 || this.dead) return false;
    if (this.age < 16 || this.age > 48) return false;
    if (this.hunger > 85 || this.health < 45 || this.mood < 25) return false;
    return true;
  }

  gainSkill(key, amount = 1) {
    if (!this.skills) this.skills = {};
    const cur = this.skills[key] || 0;
    // Diminishing returns — mastery takes a lifetime
    const gain = amount * (1 - cur / 140);
    this.skills[key] = Math.min(100, cur + Math.max(0.05, gain));
    // Lifetime learning slightly raises IQ when craft/lead grow
    if ((key === "craft" || key === "lead") && Math.random() < 0.08) {
      this.intelligence = Math.min(200, this.intelligence + 0.15);
    }
  }

  topSkill() {
    if (!this.skills) return "living";
    let best = "forage";
    let n = -1;
    for (const [k, v] of Object.entries(this.skills)) {
      if (v > n) {
        n = v;
        best = k;
      }
    }
    return best;
  }

  familyTree(sim) {
    const names = (ids) => (ids || []).map((id) => {
      const o = sim.villagerById(id);
      return o && !o.dead ? o.displayName : null;
    }).filter(Boolean);
    const partner = this.partnerId ? sim.villagerById(this.partnerId) : null;
    return {
      parents: names(this.parentIds),
      spouse: partner && !partner.dead ? partner.displayName : null,
      children: names(this.children)
    };
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
    if (!text) return;
    this.speech = text;
    this.speechT = 3.6 + Math.min(5, text.length * 0.055);
  }

  think(text) {
    this.thought = text;
  }

  /** Compose natural speech from personality, needs, and who they're facing. */
  composeSpeech(other = null, kind = "idle") {
    const mood = this.mood;
    const feelKey = mood < 35 ? "low" : mood > 65 ? "high" : "mid";
    const bits = SPEECH_BITS;
    const traitLine = pick(bits.trait[this.trait] || bits.trait.Kind);

    if (kind === "idle" && chance(0.35)) return pick(bits.idle);
    if (this.bodyTemp < 35.5 && chance(0.5)) return pick(bits.cold);
    if (this._isNight && chance(0.4)) return pick(bits.night);

    if (other) {
      const aff = this.affinityTo(other.id);
      if (this.partnerId === other.id && chance(0.45)) return pick(bits.love);
      if (aff < -40 && chance(0.5)) return pick(bits.hate);
      if (this.hunger > 75 && chance(0.4)) {
        return pick([
          `${other.name}, is there food?`,
          "My belly is arguing with my mouth.",
          `Share with me, ${other.name}.`
        ]);
      }
      if (kind === "talk") {
        const open = pick(bits.open);
        const mid = chance(0.5)
          ? `${pick(bits.self)} ${pick(bits.feel[feelKey])} about ${pick(bits.about)}.`
          : traitLine;
        const end = chance(0.35) ? ` ${pick(bits.ask)}` : "";
        return `${open ? open + " " : ""}${mid}${end}`.replace(/\s+/g, " ").trim();
      }
    }

    if (this.want?.id === "explore") return pick(["I have to go look.", "The edge is calling.", "Don't wait for me."]);
    if (this.want?.id === "rest") return pick(["I need to lie down.", "My bones voted for sleep.", "Wake me for nothing."]);
    if (this.want?.id === "pray") return pick(bits.trait.Devout);
    if (this.want?.id === "fight") return pick(bits.trait.Aggressive);
    if (this.want?.id === "create") return pick(bits.trait.Inventive);
    if (this.want?.id === "help") return pick(bits.trait.Kind);
    if (this.job?.type === "gather" || this.job?.type === "build") return chance(0.5) ? pick(bits.work) : traitLine;

    // Free association
    if (chance(0.4)) return traitLine;
    const open = pick(bits.open);
    const line = `${pick(bits.self)} ${pick(bits.feel[feelKey])} ${pick(["today", "still", "again"])} — ${pick(bits.about)}.`;
    return `${open ? open + " " : ""}${line}`.replace(/\s+/g, " ").trim();
  }

  /** Rank what this person wants right now — free will core. */
  computeWants(sim) {
    const wants = [];
    const push = (id, score, label) => {
      if (score > 0) wants.push({ id, score, label });
    };
    const night = sim.isNight();
    const hazard = sim.hazardAt(this.x, this.y);

    push("eat", this.hunger * 1.2 + (this.hunger > 80 ? 40 : 0), "Find food");
    push("rest", this.sleepDebt * 0.9 + (100 - this.energy) * 0.5 + (night ? 35 : 0), "Sleep");
    push("warmth", this.bodyTemp < 36 ? (37 - this.bodyTemp) * 25 : 0, "Get warm");
    push("flee", hazard ? 90 : this.safetyNeed < 25 ? 40 : 0, "Get safe");
    push("social", (100 - this.socialNeed) * 0.7 + this.loneliness * 0.5 + (this.routineHint === "evening" ? 20 : 0), "Talk to someone");
    push("love", this.partnerId ? 15 + (this.loneliness * 0.3) : 0, "Be with my love");
    push("explore", 8 + this.boldnessScore * 0.15 + (this.trait === "Curious" ? 25 : 0) + (this.skills?.forage || 0) * 0.1, "Wander / explore");
    push("create", 5 + (this.trait === "Inventive" ? 30 : 0) + (this.intelligence / 8) + (this.skills?.craft || 0) * 0.2, "Make / invent");
    push("pray", (this.trait === "Devout" ? 28 : 0) + this.godAlignmentScore * 0.2 + this.religionBelief * 0.15, "Pray");
    push("work", 12 + (this.trait === "Lazy" ? -15 : 10) + (this.routineHint === "morning" || this.routineHint === "afternoon" ? 18 : 0), "Work for the tribe");
    push("help", (this.empathyScore > 20 ? this.empathyScore * 0.35 : 0) + (this.trait === "Kind" ? 20 : 0), "Help someone");
    push("fight", (this.peacefulnessScore < -20 ? 25 : 0) + (this.trait === "Aggressive" ? 22 : 0) + (this.skills?.combat || 0) * 0.15, "Confront / fight");
    push("mine", (this.skills?.mine || 0) * 0.4 + ((sim.tribeOf(this.tribeId)?.gold || 0) < 4 ? 12 : 0), "Seek gold / ore");
    push("idle", 5 + (this.trait === "Lazy" ? 20 : 0) + this.moodDrift * 0.2, "Do nothing for a while");
    push("grief", this.grief > 8 ? this.grief * 2 : 0, "Mourn");

    // Personal autonomy noise — humans aren't optimizers
    for (const w of wants) {
      w.score *= 0.75 + Math.random() * 0.55;
      w.score *= 0.85 + this.autonomy * 0.3;
    }
    wants.sort((a, b) => b.score - a.score);
    return wants;
  }

  tickMind(dt, sim) {
    this.mindAcc += dt;
    this.babbleCd = Math.max(0, this.babbleCd - dt);
    this.wantT = Math.max(0, this.wantT - dt);

    // Refresh desires every few seconds
    if (this.mindAcc > 2.2 + Math.random()) {
      this.mindAcc = 0;
      const wants = this.computeWants(sim);
      const top = wants[0];
      // Sometimes pick 2nd or 3rd want — free will / impulsiveness
      const pickI = chance(this.autonomy * 0.35) ? Math.min(2, (Math.random() * 3) | 0) : 0;
      const chosen = wants[pickI] || top;
      if (chosen && (!this.want || this.wantT <= 0 || chosen.score > (this.want.score || 0) * 1.15)) {
        this.want = chosen;
        this.wantT = 4 + Math.random() * 8;
        this.think(this.thoughtFromWant(chosen, sim));
      } else if (top) {
        this.think(this.thoughtFromWant(top, sim));
      }
    }

    // Spontaneous speech — talk to nearby people or to the air
    if (this.babbleCd <= 0 && !this.dead && this.speechT <= 0 && chance(0.55)) {
      this.babbleCd = 3 + Math.random() * 8 * (this.trait === "Lazy" ? 1.4 : 1);
      const near = sim.villagers.filter((o) =>
        o.id !== this.id && !o.dead && Math.hypot(o.x - this.x, o.y - this.y) < 38
      );
      if (near.length && chance(0.7)) {
        const other = pick(near);
        this.facing = other.x < this.x ? -1 : 1;
        this.say(this.composeSpeech(other, "talk"));
        // They may answer
        if (chance(0.55) && other.speechT <= 0) {
          other.say(other.composeSpeech?.(this, "talk") || pick(LINES[other.trait] || LINES.Kind));
          other.babbleCd = 4;
          // Soft social bond without formal talk job
          this.socialNeed = Math.min(100, this.socialNeed + 4);
          other.socialNeed = Math.min(100, other.socialNeed + 3);
          this.addAffinity(other, 1.5);
          other.addAffinity(this, 1.2);
        }
      } else if (chance(0.5)) {
        // Talking to themselves
        this.say(this.composeSpeech(null, "idle"));
      }
    }

    // Whisper thought as soft speech sometimes
    if (this.thought && this.speechT <= 0 && chance(dt * 0.08)) {
      this.say(this.thought);
    }
  }

  thoughtFromWant(want, sim) {
    const map = {
      eat: pick(["Food. Now.", "I could eat the air.", "Where did the berries go?"]),
      rest: pick(["Eyes heavy.", "If I stop, I'll fall.", "A little sleep…"]),
      warmth: pick(["Too cold.", "Fire. Please.", "My blood feels slow."]),
      flee: pick(["Not here.", "Run.", "Wrong place."]),
      social: pick(["I miss voices.", `Where is everyone?`, "Need a face."]),
      love: (() => {
        const p = this.partnerId ? sim.villagerById(this.partnerId) : null;
        return p ? `Thinking of ${p.name}.` : "Someone…";
      })(),
      explore: pick(["Beyond the trees.", "What if…", "I won't know until I go."]),
      create: pick(["A shape in my head.", "Build it.", "This could work."]),
      pray: pick(["Are you there?", "I need a sign.", "Quiet, please listen."]),
      work: pick(["Hands busy, mind quiet.", "For the tribe.", "One more task."]),
      help: pick(["Someone needs me.", "I can carry that.", "Don't cry alone."]),
      fight: pick(["I've had enough.", "They'll learn.", "Stand up."]),
      mine: pick(["Gold under the rock.", "Dig.", "Wealth is in the stone."]),
      idle: pick(["…", "Nothing urgent.", "Just this moment."]),
      grief: pick(["Still gone.", "I set a stone for you.", "The silence hurt."])
    };
    return map[want.id] || want.label;
  }

  /** Act on current want — true if started something. */
  pursueWant(sim) {
    if (!this.want || this.breakdown) return false;
    const id = this.want.id;
    // Critical needs still win, but softer autonomy
    if (id === "flee") {
      this.beginFlee(sim);
      this.say(this.composeSpeech(null, "idle"));
      return true;
    }
    if (id === "eat" && this.hunger > 45) {
      if (this.beginEat(sim)) {
        if (chance(0.4)) this.say(this.composeSpeech(null, "idle"));
        return true;
      }
    }
    if (id === "rest" && (this.sleepDebt > 35 || sim.isNight() || this.energy < 30)) {
      // Night owls / rebels may refuse sleep
      if (sim.isNight() && this.boldnessScore > 40 && this.autonomy > 0.75 && chance(0.25)) {
        this.say(pick(["Sleep is a rumor.", "I'll watch the dark.", "Not yet."]));
        this.want = { id: "explore", score: 40, label: "Night wander" };
        this.beginExplore(sim);
        return true;
      }
      this.beginSleep(sim);
      return true;
    }
    if (id === "warmth") {
      const camp = sim.campTile(this.tribeId);
      if (camp) {
        this.setJob(sim, { type: "wander", tx: camp.tx, ty: camp.ty });
        this.taskLabel = "Seeking warmth";
        if (chance(0.5)) this.say(pick(SPEECH_BITS.cold));
        return true;
      }
    }
    if (id === "social" || id === "love") {
      let target = null;
      if (id === "love" && this.partnerId) target = sim.villagerById(this.partnerId);
      if (!target || target.dead) target = this.pickTalkTarget(sim);
      if (target) {
        const tile = sim.worldToTile(target.x, target.y);
        const stand = sim.standNear(tile.tx, tile.ty);
        this.setJob(sim, { type: "talk", tx: stand.tx, ty: stand.ty, otherId: target.id });
        this.taskLabel = id === "love" ? `With ${target.name}` : `Finding ${target.name}`;
        this.say(this.composeSpeech(target, "talk"));
        return true;
      }
    }
    if (id === "explore") {
      this.beginExplore(sim);
      this.say(this.composeSpeech(null, "idle"));
      return true;
    }
    if (id === "pray") {
      const spot = sim.shrineTile(this.tribeId) || sim.campTile(this.tribeId);
      if (spot) {
        this.setJob(sim, { type: "pray", tx: spot.tx, ty: spot.ty });
        this.taskLabel = "Praying because I need to";
        this.say(this.composeSpeech(null, "idle"));
        return true;
      }
    }
    if (id === "create") {
      this.beginResearch(sim);
      this.taskLabel = "Chasing an idea";
      this.say(pick(SPEECH_BITS.trait.Inventive));
      return true;
    }
    if (id === "help") {
      const need = sim.villagers.find((o) =>
        o.id !== this.id && !o.dead && o.tribeId === this.tribeId &&
        (o.illness || o.hunger > 80 || o.orphan || o.mood < 30)
      );
      if (need) {
        const tile = sim.worldToTile(need.x, need.y);
        const stand = sim.standNear(tile.tx, tile.ty);
        this.setJob(sim, { type: "talk", tx: stand.tx, ty: stand.ty, otherId: need.id });
        this.taskLabel = `Going to ${need.name}`;
        this.say(pick([`Hold on, ${need.name}.`, "I'm coming.", pick(SPEECH_BITS.trait.Kind)]));
        return true;
      }
    }
    if (id === "fight") {
      const rival = sim.villagers.find((o) =>
        o.id !== this.id && !o.dead && this.affinityTo(o.id) < -20
      );
      if (rival) {
        const tile = sim.worldToTile(rival.x, rival.y);
        const stand = sim.standNear(tile.tx, tile.ty);
        this.setJob(sim, { type: "talk", tx: stand.tx, ty: stand.ty, otherId: rival.id });
        this.taskLabel = `Confronting ${rival.name}`;
        this.say(this.composeSpeech(rival, "talk"));
        return true;
      }
    }
    if (id === "mine") {
      const ore = sim.findResource(this, ["gold", "stone", "gas"], 16);
      if (ore) {
        const stand = sim.standNear(ore.tx, ore.ty);
        this.setJob(sim, { type: "gather", tx: ore.tx, ty: ore.ty, standTx: stand.tx, standTy: stand.ty });
        this.taskLabel = "Mining because I chose to";
        return true;
      }
    }
    if (id === "idle") {
      this.beginWander(sim, 3);
      this.taskLabel = "Living a quiet minute";
      if (chance(0.4)) this.say(pick(SPEECH_BITS.idle));
      return true;
    }
    if (id === "grief") {
      const grave = sim.graves?.[(sim.graves.length - 1) | 0];
      if (grave) {
        const tile = sim.worldToTile(grave.x, grave.y);
        this.setJob(sim, { type: "mourn", tx: tile.tx, ty: tile.ty });
        this.taskLabel = "Sitting with the dead";
        this.say(pick(["…", "I brought nothing but myself.", "Still here."]));
        return true;
      }
    }
    if (id === "work") {
      // Fall through to personality / labor — mark intent
      this.taskLabel = "Choosing work";
      return false;
    }
    return false;
  }

  get mood() {
    let m = 18;
    m += this.needHunger * 0.22;
    m += this.needRest * 0.14;
    m += this.needSocial * 0.16;
    m += this.needSafety * 0.14;
    m += (this.health - 40) * 0.12;
    if (this.partnerId) m += 6;
    if (this.grief > 0) m -= 18;
    if (this.breakdown) m -= 22;
    if (this.trait === "Devout" && this.religionBelief > 55) m += 7;
    if (this.isChild) m += 6;
    if (this.prayerBuffT > 0) m += 4;
    if (this.sleepDebt > 40) m -= 10;
    if (this.bodyTemp < 35.5) m -= 12;
    if (this.loneliness > 50) m -= 8;
    if (this.lifeStage === "elder") m -= 3;
    return Math.max(0, Math.min(100, m));
  }

  moodLabel() {
    const m = this.mood;
    if (this.sleepDebt > 55 && m < 50) return "Exhausted";
    if (this.bodyTemp < 35.2) return "Freezing";
    if (this.loneliness > 60) return "Lonely";
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
    this.prayerBuffT = Math.max(0, this.prayerBuffT - dt);
    this._isNight = sim.isNight();
    this.tickNeeds(dt, sim);
    // Heavy cognition / social / biology: only on this villager's AI batch frame
    const deep = this._aiThisFrame !== false;
    const ai = deep ? (this._aiScale || 1) * dt : 0;
    if (deep) {
      this.tickHumanBiology(ai, sim);
      this.tickBreakdown(ai, sim);
      this.tickSocialDrift(ai, sim);
      if (!this.possessed && !this.carried) this.tickMind(ai, sim);
    }

    if (this.expecting > 0) {
      const partner = sim.villagerById(this.partnerId);
      if (!partner || partner.dead) {
        this.expecting = 0;
      } else {
        // Pregnancy progresses in real time; malnutrition slows it and risks health
        const tribe = sim.tribeOf(this.tribeId);
        const fed = tribe && tribe.food >= 1;
        const pace = fed ? 1 : 0.45;
        if (fed && Math.random() < dt * 0.08) tribe.food = Math.max(0, tribe.food - 0.15);
        this.expecting -= dt * pace;
        this.hunger = Math.min(125, this.hunger + 0.25 * dt);
        this.energy = Math.max(0, this.energy - 0.4 * dt);
        if (!fed) this.health -= 0.6 * dt;
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
    if (deep && this.isChild) this.observeMentors(ai, sim);
    if (deep) {
      this.tickDilemma(ai, sim);
      this.tickIllness(ai, sim);
    }

    if (this.possessed || this.carried) {
      this.moving = !!this.moving && this.possessed;
      this.acting = !!this.acting && this.possessed;
      this.clampBody(sim);
      if (deep) this.pickEmote(sim);
      return;
    }

    if (this.breakdown) {
      // Breakdown AI owns the mind; still move/execute mourn/wander jobs
      if (this.job) this.execute(dt, sim);
      this.clampBody(sim);
      if (deep) this.pickEmote(sim);
      return;
    }

    if (deep && !this.job && this.needsProsthetic() && sim.hasTech("carpentry") && Math.random() < 0.35) {
      this.beginProsthetic(sim);
    }

    // Decide only on AI batch; always execute so motion stays smooth
    if (deep) {
      if (this.shouldInterrupt(sim)) this.decide(sim, true);
      else if (!this.job) this.decide(sim, false);
    }

    this.execute(dt, sim);
    this.clampBody(sim);
    if (deep) this.pickEmote(sim);
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
    let f = 0.55 + 0.45 * ((L + R) / 200);
    if (L <= 0 && R <= 0) f = 0.22;
    else if (L <= 0 || R <= 0) f = 0.5;
    if (this.lifeStage === "infant") f *= 0.35;
    else if (this.lifeStage === "child") f *= 0.75;
    else if (this.lifeStage === "elder") f *= 0.62;
    else if (this.lifeStage === "mature") f *= 0.9;
    if (this.sleepDebt > 50) f *= 0.8;
    if (this.bodyTemp < 35.5) f *= 0.75;
    if (this.expecting > 0) f *= 0.85;
    return f;
  }

  workSpeedFactor() {
    const L = this.effectiveLimb("LeftArm");
    const R = this.effectiveLimb("RightArm");
    let f = 0.55 + 0.45 * ((L + R) / 200);
    if (L <= 0 && R <= 0) f = 0.2;
    else if (L <= 0 || R <= 0) f = 0.5;
    if (this.prayerBuffT > 0) f *= 1.35;
    if (this.breakdown?.type === "mourner") f *= 0.35;
    // Learned craft/mine speeds labor
    f *= 1 + ((this.skills?.craft || 0) + (this.skills?.mine || 0)) / 400;
    return f;
  }

  tickHumanBiology(dt, sim) {
    const winter = sim.seasonIndex === 3;
    const ambient = sim.ambientTemp ?? (winter ? 2 : sim.seasonIndex === 1 ? 22 : 14);
    const nearFire = sim.nearCampfire(this.x, this.y, this.tribeId);
    const sleeping = this.job?.type === "sleep" && this.job.stage === "act";
    const night = sim.isNight();

    // Circadian sleep debt — humans need night rest
    if (sleeping) {
      this.sleepDebt = Math.max(0, this.sleepDebt - 8 * dt);
      this.energy = Math.min(100, this.energy + (night ? 14 : 8) * dt);
    } else {
      const chronotype = this.trait === "Lazy" ? 0.7 : this.boldnessScore > 40 ? 1.25 : 1;
      this.sleepDebt = Math.min(100, this.sleepDebt + (night ? 4.5 : 1.1) * chronotype * dt);
      if (night && this.sleepDebt > 25) this.energy = Math.max(0, this.energy - 3.2 * dt);
      else if (!night) this.energy = Math.max(0, this.energy - 0.55 * dt);
    }

    // Metabolism / hunger by life stage & activity
    const stageMul = ({ infant: 0.55, child: 0.7, youth: 1.05, adult: 1, mature: 0.92, elder: 0.78 })[this.lifeStage] || 1;
    let hungerRate = 0.78 * stageMul * (winter ? 1.35 : 1) * (this.trait === "Lazy" ? 0.9 : 1);
    if (this.moving) hungerRate *= 1.35;
    if (this.acting) hungerRate *= 1.5;
    if (sleeping) hungerRate *= 0.65;
    if (this.prayerBuffT > 0) hungerRate *= 0.72;
    this.hunger = Math.min(125, this.hunger + hungerRate * dt);

    if (this.hunger > 100) this.health -= 5.2 * dt;
    else if (this.health < 100 && this.hunger < 50 && this.energy > 40) {
      this.health = Math.min(100, this.health + 0.8 * dt);
    }

    // Thermoregulation — cold nights & winter hurt without fire
    const target = nearFire ? Math.max(ambient, 34) + 4 : ambient + (sleeping ? 1 : 0);
    this.bodyTemp += (target + 12 - this.bodyTemp) * Math.min(1, 0.35 * dt);
    // Normalize toward 37 when warm enough
    if (nearFire || ambient > 12) this.bodyTemp += (37 - this.bodyTemp) * 0.15 * dt;
    if (this.bodyTemp < 35) {
      this.health -= (35 - this.bodyTemp) * 1.8 * dt;
      this.safetyNeed = Math.max(0, this.safetyNeed - 4 * dt);
    }
    if (winter && !nearFire && night) this.energy = Math.max(0, this.energy - 1.5 * dt);

    // Aging — children grow faster in sim years; elders decline
    const yearLen = sim.yearLength;
    this.ageAcc += dt;
    if (this.ageAcc >= yearLen) {
      this.ageAcc -= yearLen;
      if (this.lifeStage === "infant" || this.lifeStage === "child") this.age += 4;
      else if (this.lifeStage === "youth") this.age += 2;
      else this.age += 1;
      if (this.isChild && this.age >= 16) {
        this.age = 16;
        this.isChild = false;
        this.remember("Came of age beside the fire", sim.year);
        this.shiftPersonality(4, 6, 2, 0, "Came of age", sim);
        sim.log(`${this.displayName} comes of age.`, "good");
      }
      if (this.age === 45) this.remember("Felt the first grey in the mirror of the water", sim.year);
      if (this.age === 65) {
        this.remember("Bones grew quieter", sim.year);
        this.shiftPersonality(2, -6, 4, 2, "Grew old", sim);
      }
    }
    if (this.lifeStage === "elder") {
      this.health -= 0.55 * dt;
      if (this.geneticHealth < 50) this.health -= 0.35 * dt;
    }
    if (this.age > 78) this.health -= (this.age - 78) * 0.4 * dt;

    // Memory fade — humans forget
    if (this.memories.length > 2 && Math.random() < dt * 0.01) {
      this.memories.pop();
    }

    // Infant cling to parent
    if (this.lifeStage === "infant" && !this.carried) {
      const parent = (this.parentIds || []).map((id) => sim.villagerById(id)).find((p) => p && !p.dead);
      if (parent && Math.hypot(parent.x - this.x, parent.y - this.y) > 40) {
        this.x += (parent.x - this.x) * 0.02;
        this.y += (parent.y - this.y) * 0.02;
        this.loneliness = Math.min(100, this.loneliness + 8 * dt);
      }
    }

    // Natural conception for bonded pairs (not only on wedding day)
    if (this.partnerId && this.canConceive && Math.random() < dt * 0.004) {
      const p = sim.villagerById(this.partnerId);
      if (p && p.canConceive && !p.expecting && Math.hypot(p.x - this.x, p.y - this.y) < 28) {
        const bearer = this.sex === "f" ? this : p.sex === "f" ? p : (Math.random() < 0.5 ? this : p);
        if (!bearer.expecting) {
          bearer.expecting = sim.yearLength * 0.72;
          bearer.remember("A child begins", sim.year);
          sim.log(`${bearer.displayName} is with child.`, "good");
          sim.float(bearer.x, bearer.y - 14, "life", "#e2557a");
        }
      }
    }
  }

  tickSocialDrift(dt, sim) {
    this.bondDecayAcc += dt;
    // Loneliness grows in solitude
    let near = 0;
    for (const o of sim.villagers) {
      if (o.id === this.id || o.dead) continue;
      if (Math.hypot(o.x - this.x, o.y - this.y) < 40) near++;
    }
    if (near === 0) this.loneliness = Math.min(100, this.loneliness + 2.5 * dt);
    else this.loneliness = Math.max(0, this.loneliness - 4 * near * dt);

    // Bonds cool without contact — real friendship needs maintenance
    if (this.bondDecayAcc > 8) {
      this.bondDecayAcc = 0;
      for (const [id, aff] of [...this.affinity.entries()]) {
        const o = sim.villagerById(id);
        if (!o || o.dead) {
          this.affinity.delete(id);
          continue;
        }
        if (this.partnerId === id || this.parentIds?.includes(id) || this.children?.includes(id)) continue;
        if (Math.hypot(o.x - this.x, o.y - this.y) > 90) {
          this.affinity.set(id, aff * 0.97 - 0.4);
        }
      }
    }

    // Jealousy — partner too close to a rival
    if (this.partnerId) {
      const p = sim.villagerById(this.partnerId);
      if (p && !p.dead) {
        for (const o of sim.villagers) {
          if (o.id === this.id || o.id === p.id || o.dead) continue;
          if (Math.hypot(o.x - p.x, o.y - p.y) < 22 && this.affinityTo(o.id) < 10 && Math.random() < dt * 0.08) {
            this.addAffinity(o, -3);
            this.addAffinity(p, -1);
            if (Math.random() < 0.2) {
              this.say("Who is that?");
              this.emoteLock = "anger";
              this.emoteLockT = 1.5;
            }
          }
        }
      }
    }
  }

  /** Time-of-day routine: morning work, midday eat, evening social, night sleep. */
  dailyRoutine(sim) {
    const t = sim.dayT;
    if (t >= 0.74 || t < 0.08) {
      this.routineHint = "night";
      return "sleep";
    }
    if (t < 0.18) {
      this.routineHint = "dawn";
      return "wake";
    }
    if (t < 0.42) {
      this.routineHint = "morning";
      return "work";
    }
    if (t < 0.52) {
      this.routineHint = "midday";
      return "eat";
    }
    if (t < 0.68) {
      this.routineHint = "afternoon";
      return "work";
    }
    this.routineHint = "evening";
    return "social";
  }

  tickNeeds(dt, sim) {
    // Social drains when alone; recovers when talking / near allies
    let socialDelta = -1.1 * dt;
    let nearAlly = false;
    for (const o of sim.villagers) {
      if (o.id === this.id || o.dead) continue;
      if (Math.hypot(o.x - this.x, o.y - this.y) < 36) {
        if (this.affinityTo(o.id) > 10) {
          socialDelta += 3.2 * dt;
          nearAlly = true;
        } else if (this.affinityTo(o.id) < -20) {
          socialDelta -= 0.8 * dt;
        } else socialDelta += 0.6 * dt;
      }
    }
    if (this.job?.type === "talk") socialDelta += 5 * dt;
    if (this.partnerId && nearAlly) socialDelta += 1.2 * dt;
    this.socialNeed = Math.max(0, Math.min(100, this.socialNeed + socialDelta));

    // Safety: hazards, night, injury, illness lower it; campfire / walls raise it
    let safety = this.safetyNeed;
    const hazard = sim.hazardAt(this.x, this.y);
    if (hazard) safety -= 18 * dt;
    if (sim.isNight() && !sim.nearCampfire(this.x, this.y, this.tribeId)) safety -= 4 * dt;
    else if (sim.nearCampfire(this.x, this.y, this.tribeId)) safety += 5 * dt;
    if (this.illness) safety -= 6 * dt;
    if (this.health < 40) safety -= 3 * dt;
    if ((this.body?.LeftLeg ?? 100) <= 0 || (this.body?.RightLeg ?? 100) <= 0) safety -= 2 * dt;
    if (sim.weather?.type === "hurricane") safety -= 10 * dt;
    const tile = sim.getTileAtPixel(this.x, this.y);
    if ((tile?.fallout || 0) > 0.2) safety -= 8 * dt;
    safety += 1.2 * dt;
    this.safetyNeed = Math.max(0, Math.min(100, safety));
  }

  tickBreakdown(dt, sim) {
    this.breakdownCd = Math.max(0, this.breakdownCd - dt);
    if (this.breakdown) {
      this.breakdown.t -= dt;
      this.runBreakdown(dt, sim);
      if (this.breakdown.t <= 0) {
        this.remember(`Came out of a ${this.breakdown.type} spell`, sim.year);
        this.breakdown = null;
        this.breakdownCd = 35 + Math.random() * 40;
        this.job = null;
      }
      return;
    }
    if (this.breakdownCd > 0 || this.isChild || this.dead || this.possessed) return;
    if (this.mood >= 25 && this.grief <= 0) return;
    // Trigger breakdown when morale/needs collapse
    if (this.mood >= 25 && !(this.grief > 12 && Math.random() < dt * 0.08)) return;
    if (Math.random() > dt * 0.35) return;
    let type = "brawler";
    if (this.grief > 10) type = "mourner";
    else if (this.trait === "Devout" || this.godAlignmentScore > 40) type = "prophet";
    else if (this.peacefulnessScore < -20 || this.trait === "Aggressive") type = Math.random() < 0.45 ? "pyromaniac" : "brawler";
    else if (this.needSafety < 30) type = "pyromaniac";
    else if (this.needSocial < 25) type = "prophet";
    this.beginBreakdown(sim, type);
  }

  beginBreakdown(sim, type) {
    this.breakdown = { type, t: type === "prophet" ? 18 : type === "mourner" ? 22 : 14 };
    this.breakdownCd = 50;
    this.job = null;
    this.path = null;
    const labels = {
      pyromaniac: "Setting fires in a frenzy",
      brawler: "Looking for a fight",
      mourner: "Grieving at a grave",
      prophet: "Wandering as a prophet"
    };
    this.taskLabel = labels[type] || "Breaking down";
    this.say(type === "prophet" ? "The sky is speaking." : type === "mourner" ? "…" : type === "pyromaniac" ? "Burn it all." : "Face me!");
    this.emoteLock = type === "mourner" ? "broken" : type === "prophet" ? "pray" : "anger";
    this.emoteLockT = 4;
    sim.log(`${this.displayName} breaks — ${type}.`, "bad");
    sim.float(this.x, this.y - 18, type, "#e07a62");
    if (type === "mourner") {
      const grave = sim.graves?.find((g) => g.forId === this.partnerId) || sim.graves?.[0];
      if (grave) {
        const tile = sim.worldToTile(grave.x, grave.y);
        this.setJob(sim, { type: "mourn", tx: tile.tx, ty: tile.ty });
      }
    } else if (type === "prophet") {
      this.beginExplore(sim);
      this.taskLabel = "Prophet walk into the wild";
    }
  }

  runBreakdown(dt, sim) {
    const type = this.breakdown?.type;
    if (!type) return;
    if (type === "pyromaniac" && Math.random() < dt * 0.55) {
      const here = sim.worldToTile(this.x, this.y);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const t = sim.getTile(here.tx + dx, here.ty + dy);
          if (t && t.type !== "water" && Math.random() < 0.4) {
            t.fire = Math.max(t.fire || 0, 0.55 + Math.random() * 0.35);
            sim.terrainDirty = true;
          }
        }
      }
      // Prefer huts / crops
      for (const s of sim.structures) {
        if (s.tribeId !== this.tribeId) continue;
        const c = sim.tileCenter(s.tx, s.ty);
        if (Math.hypot(c.x - this.x, c.y - this.y) < 40 && Math.random() < 0.3) {
          const t = sim.getTile(s.tx, s.ty);
          if (t) t.fire = Math.max(t.fire || 0, 0.8);
          s.hp = Math.max(0, (s.hp || 40) - 8);
        }
      }
      this.taskLabel = "Kindling madness";
      if (!this.job) this.beginWander(sim, 5);
    } else if (type === "brawler") {
      const rival = sim.villagers.find((o) =>
        o.id !== this.id && !o.dead && this.affinityTo(o.id) < -15 && Math.hypot(o.x - this.x, o.y - this.y) < 80
      ) || this.pickTalkTarget(sim);
      if (rival && Math.random() < dt * 0.7) {
        const tile = sim.worldToTile(rival.x, rival.y);
        const stand = sim.standNear(tile.tx, tile.ty);
        this.setJob(sim, { type: "talk", tx: stand.tx, ty: stand.ty, otherId: rival.id });
        this.taskLabel = `Assaulting ${rival.name}`;
        if (Math.hypot(rival.x - this.x, rival.y - this.y) < 22) {
          rival.health -= 8 * dt;
          rival.injure?.(Math.random() < 0.5 ? "LeftArm" : "Torso", 4 * dt, sim);
          this.addAffinity(rival, -3);
          rival.addAffinity(this, -4);
          sim.float(rival.x, rival.y - 12, "hit", "#e07a62");
        }
      }
    } else if (type === "mourner") {
      this.emoteLock = "broken";
      this.emoteLockT = 2;
      this.energy = Math.min(100, this.energy + 2 * dt);
      if (!this.job || this.job.type !== "mourn") {
        const grave = sim.graves?.find((g) => g.forId === this.partnerId)
          || sim.graves?.find((g) => (this.parentIds || []).includes(g.forId))
          || sim.graves?.[sim.graves.length - 1];
        if (grave) {
          const tile = sim.worldToTile(grave.x, grave.y);
          this.setJob(sim, { type: "mourn", tx: tile.tx, ty: tile.ty, stage: "goto" });
        }
      }
      this.taskLabel = "Mourning the dead";
    } else if (type === "prophet") {
      this.religionBelief = Math.min(100, this.religionBelief + 4 * dt);
      this.godAlignmentScore = Math.min(100, this.godAlignmentScore + 2 * dt);
      if (this.breakdown.t < 4 && !this.breakdown.returned) {
        this.breakdown.returned = true;
        this.shiftPersonality(6, 4, 2, 18, "Returned from a prophet walk", sim);
        this.remember("The wilderness named me", sim.year);
        this.say("I saw the true fire.");
        sim.addInsight("faith", 12, this);
        const camp = sim.campTile(this.tribeId);
        if (camp) this.setJob(sim, { type: "pray", tx: camp.tx, ty: camp.ty });
      } else if (!this.job) {
        this.beginExplore(sim);
        this.taskLabel = "Prophet in the wilds";
      }
    }
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
    // Free minds: only interrupt for real crisis, not every night tick
    if (this.sleepDebt > 80 && this.job?.type !== "sleep" && this.job?.type !== "eat") return true;
    if (this.hunger > 95 && !feeding && this.job?.type !== "flee" && this.job?.type !== "pray") return true;
    if (this.bodyTemp < 34.5 && this.job?.type !== "wander" && this.job?.type !== "flee") return true;
    // Want changed strongly mid-job — sometimes they abandon task (human fickleness)
    if (this.want && this.job && !feeding && this.job.type !== "sleep" && this.job.type !== "flee") {
      const aligned =
        (this.want.id === "work" && ["gather", "build", "harvest", "till"].includes(this.job.type)) ||
        (this.want.id === "social" && this.job.type === "talk") ||
        (this.want.id === "pray" && this.job.type === "pray") ||
        (this.want.id === "create" && this.job.type === "research") ||
        (this.want.id === "rest" && this.job.type === "sleep") ||
        (this.want.id === "explore" && this.job.type === "wander");
      if (!aligned && this.autonomy > 0.7 && chance(0.02)) return true;
    }
    return false;
  }

  decide(sim, urgent) {
    if (this.dead || this.breakdown) return;
    const hazard = sim.hazardAt(this.x, this.y);
    this.dailyRoutine(sim); // updates routineHint only

    // Life-threatening: always react
    if (hazard) {
      if (this.trait === "Devout" && this.health > 38 && chance(urgent ? 0.5 : 0.25)) {
        const here = sim.worldToTile(this.x, this.y);
        this.job = { type: "pray", tx: here.tx, ty: here.ty, stage: "act", timer: 4.2, acc: 0 };
        this.path = null;
        this.taskLabel = "Praying into the danger";
        this.say(this.composeSpeech(null, "idle"));
        return;
      }
      this.beginFlee(sim);
      this.say(pick(["Run!", "Not today—", "Out!"]));
      return;
    }

    // Free will — pursue own wants most of the time
    if (!urgent || this.hunger > 90 || this.sleepDebt > 75 || this.bodyTemp < 35) {
      const refreshed = this.computeWants(sim);
      if (!this.want || this.wantT <= 0) {
        this.want = refreshed[chance(this.autonomy * 0.4) ? Math.min(2, (Math.random() * 3) | 0) : 0];
        this.wantT = 5 + Math.random() * 6;
      }
      if (this.pursueWant(sim)) return;
    }

    if (this.migrating && this.hunger <= 80 && !hazard) {
      const tribe = sim.tribeOf(this.tribeId);
      if (tribe) {
        const tile = sim.worldToTile(tribe.homeX, tribe.homeY);
        this.setJob(sim, { type: "migrate", tx: tile.tx, ty: tile.ty });
        this.taskLabel = "Walking to a new fire";
        return;
      }
    }

    if (this.isChild) {
      this.childDecide(sim);
      if (chance(0.2)) this.say(pick(["Watch me!", "Again!", "…", "Look—"]));
      return;
    }

    // Only collapse when truly spent (free will otherwise)
    if (this.energy < 12 || this.sleepDebt > 85) {
      this.beginSleep(sim);
      this.say(pick(["I can't…", "Down.", "Enough."]));
      return;
    }

    // Personality-led choices, then tribe labor as backup
    if (this.personalityDecide(sim)) {
      if (chance(0.25)) this.say(this.composeSpeech(null, "idle"));
      return;
    }

    const tribe = sim.tribeOf(this.tribeId);
    if (!tribe) {
      this.beginWander(sim, this.trait === "Curious" ? 14 : 6);
      return;
    }

    if (this.trait !== "Lazy" || Math.random() < 0.45) {
      const blueprint = sim.nearestBlueprint(this);
      if (blueprint && (this.trait !== "Lazy" || Math.random() < 0.35) && this.boldnessScore > -50) {
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
    // Kids have wants too — play, cling, explore, chatter
    const roll = Math.random();
    const parent = this.parentIds.map((id) => sim.villagerById(id)).find((p) => p && !p.dead);
    if (roll < 0.35 && parent && Math.hypot(parent.x - this.x, parent.y - this.y) > 28) {
      const tile = sim.worldToTile(parent.x, parent.y);
      this.setJob(sim, { type: "wander", tx: tile.tx, ty: tile.ty });
      this.taskLabel = `Following ${parent.name}`;
      this.want = { id: "love", score: 50, label: "Stay with parent" };
      return;
    }
    if (roll < 0.55) {
      const friend = sim.villagers.find((o) =>
        o.id !== this.id && o.isChild && !o.dead && Math.hypot(o.x - this.x, o.y - this.y) < 80
      );
      if (friend) {
        const tile = sim.worldToTile(friend.x, friend.y);
        this.setJob(sim, { type: "talk", tx: tile.tx, ty: tile.ty, otherId: friend.id });
        this.taskLabel = `Playing with ${friend.name}`;
        this.say(pick(["Race you!", "Look what I found!", "Don't tell.", "Again!"]));
        return;
      }
    }
    if (roll < 0.75) {
      this.beginWander(sim, 5);
      this.taskLabel = "Exploring on small legs";
      this.want = { id: "explore", score: 30, label: "Play-explore" };
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
    this.taskLabel = "Sleeping";
    this.emoteLock = "sleep";
    this.emoteLockT = 99;
  }

  /** Distinct life strategies driven by personality scores + trait. */
  personalityDecide(sim) {
    const roll = Math.random();
    const tags = this.traitTags || [];

    // Caregivers: heal / feed the sick and orphans
    if (this.empathyScore > 35 || this.trait === "Kind") {
      const need = sim.villagers.find((o) =>
        o.id !== this.id && !o.dead && o.tribeId === this.tribeId &&
        ((o.illness && o.health < 85) || (o.orphan && o.isChild) || o.hunger > 85)
      );
      if (need && roll < 0.55) {
        if (need.illness) {
          const herb = sim.findResource(this, ["bush"], 14);
          if (herb) {
            const stand = sim.standNear(herb.tx, herb.ty);
            this.setJob(sim, {
              type: "gather", tx: herb.tx, ty: herb.ty, standTx: stand.tx, standTy: stand.ty,
              personal: false, healTargetId: need.id
            });
            this.taskLabel = `Gathering herbs for ${need.name}`;
            this.say("Hold on — I know a leaf for that.");
            return true;
          }
        }
        const tile = sim.worldToTile(need.x, need.y);
        const stand = sim.standNear(tile.tx, tile.ty);
        this.setJob(sim, { type: "talk", tx: stand.tx, ty: stand.ty, otherId: need.id });
        this.taskLabel = need.orphan ? `Adopting care of ${need.name}` : `Comforting ${need.name}`;
        need.hunger = Math.max(0, need.hunger - 8);
        need.health = Math.min(100, need.health + 4);
        if (need.illness) need.illness.t = Math.max(0, need.illness.t - 2);
        if (need.orphan && need.isChild) {
          need.orphan = false;
          need.abandoned = false;
          need.parentIds = [...(need.parentIds || []), this.id];
          this.children.push(need.id);
          this.shiftPersonality(8, 0, 4, 2, "Took in an orphan", sim);
          sim.log(`${this.name} takes ${need.name} under their wing.`, "good");
        }
        this.shiftPersonality(1.2, 0, 0.8, 0.4, "Cared for another", sim);
        return true;
      }
    }

    // Hardened / Rebellious: steal, saboteur streak, or breakaway urge
    if ((tags.includes("Hardened") || tags.includes("Rebellious") || this.empathyScore < -40) && roll < 0.36) {
      const tribe = sim.tribeOf(this.tribeId);
      if (tribe && tribe.food > 4 && this.hunger > 55) {
        tribe.food -= 1;
        this.hunger = Math.max(0, this.hunger - 28);
        this.taskLabel = "Taking more than a share";
        this.say("They won't miss one basket.");
        this.shiftPersonality(-2, 3, -4, -3, "Stole from stores", sim);
        this.logInfluence("Chose self over the tribe", sim.year);
        sim.float(this.x, this.y - 14, "took", "#e07a62");
        return true;
      }
      if (this.boldnessScore > 30 && Math.random() < 0.4) {
        this.beginExplore(sim);
        this.taskLabel = "Scouting a breakaway path";
        this.say("This fire is not mine forever.");
        return true;
      }
    }

    // Lazy: nap, loaf near fire, avoid work
    if (this.trait === "Lazy" || (this.boldnessScore < -30 && this.energy < 75)) {
      if (roll < 0.5) {
        this.beginSleep(sim);
        this.taskLabel = "Napping through the day";
        this.say("Wake me when the work is done.");
        return true;
      }
      if (roll < 0.7) {
        const camp = sim.campTile(this.tribeId);
        if (camp) {
          this.setJob(sim, { type: "wander", tx: camp.tx, ty: camp.ty });
          this.taskLabel = "Loafing by the fire";
          return true;
        }
      }
    }

    // Miners chase gold / gas when skilled or tribe needs wealth
    if ((this.skills?.mine || 0) > 12 || this.boldnessScore > 20) {
      const tribe = sim.tribeOf(this.tribeId);
      if (tribe && roll < 0.38) {
        const want = (tribe.gold || 0) < 5 || (this.skills?.mine || 0) > 25 ? ["gold", "stone"] : ["stone", "gold"];
        if (sim.eraIndex(sim.era) >= 3) want.push("gas");
        const ore = sim.findResource(this, want, 16);
        if (ore) {
          const stand = sim.standNear(ore.tx, ore.ty);
          this.setJob(sim, {
            type: "gather", tx: ore.tx, ty: ore.ty, standTx: stand.tx, standTy: stand.ty, personal: false
          });
          this.taskLabel = ore.res === "gold" ? "Mining gold" : ore.res === "gas" ? "Tapping gas" : "Quarrying stone";
          return true;
        }
      }
    }

    // Traders seek exchange with other tribes' people
    if ((this.skills?.trade || 0) > 20 && roll < 0.3) {
      const foreign = sim.villagers.find((o) =>
        o.id !== this.id && !o.dead && o.tribeId !== this.tribeId && Math.hypot(o.x - this.x, o.y - this.y) < 120
      );
      if (foreign) {
        const tile = sim.worldToTile(foreign.x, foreign.y);
        const stand = sim.standNear(tile.tx, tile.ty);
        this.setJob(sim, { type: "talk", tx: stand.tx, ty: stand.ty, otherId: foreign.id });
        this.taskLabel = `Trading with ${foreign.name}`;
        return true;
      }
    }

    // Explorers: push into far wilderness
    if ((this.trait === "Curious" || this.boldnessScore > 40 || tags.includes("Wanderer")) && roll < 0.42) {
      this.beginExplore(sim);
      this.say(this.intelligence > 110 ? "Maps are lies until walked." : "Something pulls at the horizon.");
      return true;
    }

    // Inventors / high IQ: research, quarantine science, vaccine tinkering
    if ((this.trait === "Inventive" || this.intelligence > 120) && roll < 0.45) {
      const sick = sim.villagers.find((o) => o.illness && !o.dead && o.tribeId === this.tribeId);
      if (sick && this.intelligence > 115 && Math.random() < 0.55) {
        const hut = sim.structures.find((s) => s.tribeId === this.tribeId && (s.type === "hut" || s.type === "longhouse" || s.type === "research"));
        if (hut && Math.random() < 0.5) {
          // Quarantine: move sick to hut / research table
          const bed = sim.tileCenter(hut.tx, hut.ty);
          sick.x = bed.x + 4;
          sick.y = bed.y + 2;
          sick.job = { type: "sleep", stage: "act", timer: 20, tx: hut.tx, ty: hut.ty };
          sick.taskLabel = "Quarantined in a sick bed";
          hut.sickBay = true;
          const stand = sim.standNear(hut.tx, hut.ty);
          this.setJob(sim, { type: "tend_sick", tx: stand.tx, ty: stand.ty, sickId: sick.id, timer: 6 });
          this.taskLabel = `Quarantining ${sick.name}`;
          return true;
        }
        const table = sim.structures.find((s) => s.tribeId === this.tribeId && s.type === "research")
          || sim.structures.find((s) => s.tribeId === this.tribeId && s.type === "campfire");
        if (table && !sim.vaccineReady) {
          const stand = sim.standNear(table.tx, table.ty);
          this.setJob(sim, { type: "research_vaccine", tx: stand.tx, ty: stand.ty, timer: 14 });
          this.taskLabel = `Researching vaccine for ${sick.illness.type}`;
          this.say("Fever has a pattern…");
          return true;
        }
        this.beginResearch(sim);
        this.taskLabel = `Studying ${sick.illness.type} for a cure`;
        sick.illness.t = Math.max(0, sick.illness.t - 1.5);
        sim.addInsight("tools", 3, this);
        return true;
      }
      this.beginResearch(sim);
      this.taskLabel = this.urge ? `Obsessing over ${this.urge}` : "Tinkering with an idea";
      return true;
    }

    // Empaths tend quarantined sick beds
    if ((this.empathyScore > 30 || this.trait === "Kind") && roll < 0.3) {
      const sick = sim.villagers.find((o) =>
        o.id !== this.id && !o.dead && o.illness && o.tribeId === this.tribeId && o.job?.type === "sleep"
      );
      if (sick) {
        const tile = sim.worldToTile(sick.x, sick.y);
        const stand = sim.standNear(tile.tx, tile.ty);
        this.setJob(sim, { type: "tend_sick", tx: stand.tx, ty: stand.ty, sickId: sick.id, timer: 5 });
        return true;
      }
    }

    // Devout / high faith: prayer and shrines
    if ((this.trait === "Devout" || this.godAlignmentScore > 45) && (sim.religion || this.religionBelief > 30) && roll < 0.4) {
      const spot = sim.shrineTile(this.tribeId) || sim.campTile(this.tribeId);
      if (spot) {
        this.setJob(sim, { type: "pray", tx: spot.tx, ty: spot.ty });
        this.taskLabel = "Keeping a private rite";
        this.say("Listen — even silence answers.");
        return true;
      }
    }

    // Aggressive / low peace: pick fights or rival talk
    if ((this.trait === "Aggressive" || this.peacefulnessScore < -35) && roll < 0.38) {
      const rival = this.pickTalkTarget(sim);
      if (rival && this.affinityTo(rival.id) < 10) {
        const tile = sim.worldToTile(rival.x, rival.y);
        const stand = sim.standNear(tile.tx, tile.ty);
        this.setJob(sim, { type: "talk", tx: stand.tx, ty: stand.ty, otherId: rival.id });
        this.taskLabel = `Confronting ${rival.name}`;
        this.emoteLock = "anger";
        this.emoteLockT = 2;
        this.say("We settle this now.");
        return true;
      }
    }

    // Pacifists mediate when morale is low
    if (this.peacefulnessScore > 45 && sim.morale < 45 && roll < 0.35) {
      const tense = sim.villagers.find((o) =>
        o.id !== this.id && !o.dead && this.affinityTo(o.id) < -15
      );
      if (tense) {
        const tile = sim.worldToTile(tense.x, tense.y);
        const stand = sim.standNear(tile.tx, tile.ty);
        this.setJob(sim, { type: "talk", tx: stand.tx, ty: stand.ty, otherId: tense.id });
        this.taskLabel = `Trying to make peace with ${tense.name}`;
        this.addAffinity(tense, 6);
        this.say("Enough blood for one life.");
        return true;
      }
    }

    // Loners / atheists / Godless go far alone
    if ((this.godAlignmentScore < -40 || tags.includes("Godless") || tags.includes("Atheist")) && roll < 0.35) {
      this.beginExplore(sim);
      this.taskLabel = "Walking away from the rite";
      this.say("No sky owns me.");
      return true;
    }

    // Social butterflies: seek company when lonely
    if (this.empathyScore > 20 && this.peacefulnessScore > 10 && roll < 0.28) {
      const friend = this.pickTalkTarget(sim);
      if (friend && this.affinityTo(friend.id) > 20) {
        const tile = sim.worldToTile(friend.x, friend.y);
        const stand = sim.standNear(tile.tx, tile.ty);
        this.setJob(sim, { type: "talk", tx: stand.tx, ty: stand.ty, otherId: friend.id });
        this.taskLabel = `Seeking out ${friend.name}`;
        this.say("Tell me what the morning held.");
        return true;
      }
    }

    return false;
  }

  beginExplore(sim) {
    const edge = Math.random();
    let tx = (Math.random() * sim.w) | 0;
    let ty = (Math.random() * sim.h) | 0;
    if (edge < 0.25) tx = 2 + ((Math.random() * 6) | 0);
    else if (edge < 0.5) tx = sim.w - 8 + ((Math.random() * 5) | 0);
    else if (edge < 0.75) ty = 2 + ((Math.random() * 6) | 0);
    else ty = sim.h - 8 + ((Math.random() * 5) | 0);
    const spot = sim.nearestWalkable(tx, ty, 8) || sim.worldToTile(this.x, this.y);
    this.setJob(sim, { type: "wander", tx: spot.tx, ty: spot.ty });
    this.taskLabel = this.trait === "Curious" ? "Exploring a question at the edge" : "Roaming the far wilds";
    this.say(this.trait === "Curious" ? "What lives out there?" : "I need distance.");
    sim.addInsight("culture", 0.8, this);
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
      this.moving = false;
      this.acting = false;
      this.energy = Math.min(100, this.energy + (this.trait === "Lazy" ? 22 : 16) * dt);
      this.health = Math.min(100, this.health + 0.35 * dt);
      this.emoteLock = "sleep";
      this.emoteLockT = 2;
      const nearFire = sim.nearCampfire(this.x, this.y, this.tribeId);
      if (nearFire) sim.addInsight("fire", 0.12 * dt, this);
      if (this.hunger > 82) {
        this.emoteLock = null;
        this.job = null;
        return;
      }
      // Stay asleep longer when tired; Lazy sleeps deeper
      const wakeAt = this.trait === "Lazy" ? 96 : this.boldnessScore > 40 ? 72 : 88;
      if (!sim.isNight() && this.energy > wakeAt) {
        this.emoteLock = null;
        this.job = null;
      } else if (this.energy >= 100 && sim.dayT > 0.15 && sim.dayT < 0.65) {
        this.emoteLock = null;
        this.job = null;
      }
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
      if (this.job.type === "gather") {
        sim.harvest(this, this.job.tx, this.job.ty, !!this.job.personal);
        if (this.job.healTargetId) {
          const sick = sim.villagerById(this.job.healTargetId);
          if (sick && !sick.dead) {
            sick.health = Math.min(100, sick.health + 18);
            if (sick.illness) sick.illness.t = Math.max(0, sick.illness.t - 8);
            if (sick.illness && sick.illness.t <= 0) sick.illness = null;
            sick.remember(`Healed with herbs by ${this.name}`, sim.year);
            this.shiftPersonality(3, 0, 2, 1, "Brought medicine", sim);
            sim.float(sick.x, sick.y - 14, "healed", "#8fd0a4");
            sim.log(`${this.name} tends ${sick.name} with wild herbs.`, "good");
          }
        }
      } else if (this.job.type === "harvest") sim.harvestFarm(this, this.job.tx, this.job.ty);
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
      this.prayerBuffT = Math.max(this.prayerBuffT, 10);
      this.socialNeed = Math.min(100, this.socialNeed + 1.5 * dt);
      this.job.acc += dt;
      if (this.job.acc >= 1) {
        this.job.acc = 0;
        sim.addInsight("faith", this.trait === "Devout" ? 1.8 : 0.8, this);
        // Leave offerings at shrine
        const shrine = sim.structures.find((s) => s.type === "shrine" && s.tribeId === this.tribeId);
        if (shrine) {
          const tribe = sim.tribeOf(this.tribeId);
          shrine.offerings = shrine.offerings || { food: 0, wood: 0, stone: 0 };
          if (tribe && tribe.food >= 1 && Math.random() < 0.45) {
            tribe.food -= 1;
            shrine.offerings.food += 1;
            sim.float(shrine.tx * sim.tile + 8, shrine.ty * sim.tile, "offer", "#f0d78c");
          } else if (tribe && tribe.wood >= 1 && Math.random() < 0.25) {
            tribe.wood -= 1;
            shrine.offerings.wood += 1;
          }
        }
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

    if (this.job.type === "mourn") {
      this.moving = false;
      this.acting = false;
      this.emoteLock = "broken";
      this.emoteLockT = 2;
      this.energy = Math.min(100, this.energy + 1.5 * dt);
      this.socialNeed = Math.min(100, this.socialNeed + 0.8 * dt);
      this.taskLabel = "Grieving at the grave";
      if (this.job.timer == null) this.job.timer = 8;
      this.job.timer -= dt;
      if (this.job.timer <= 0) this.job = null;
      return;
    }

    if (this.job.type === "tend_sick") {
      const sick = sim.villagerById(this.job.sickId);
      if (!sick || sick.dead) {
        this.job = null;
        return;
      }
      this.acting = true;
      sick.health = Math.min(100, sick.health + 6 * dt);
      if (sick.illness) sick.illness.t = Math.max(0, sick.illness.t - 3 * dt);
      if (sick.illness && sick.illness.t <= 0) sick.illness = null;
      this.job.timer = (this.job.timer ?? 5) - dt;
      this.taskLabel = `Tending ${sick.name} in bed`;
      if (this.job.timer <= 0) {
        this.shiftPersonality(2, 0, 1, 1, "Tended the sick", sim);
        this.job = null;
      }
      return;
    }

    if (this.job.type === "research_vaccine") {
      this.acting = true;
      this.energy = Math.max(0, this.energy - 0.5 * dt);
      this.vaccineProgress = Math.min(100, (this.vaccineProgress || 0) + dt * (this.intelligence / 40));
      sim.addInsight("tools", 0.4 * dt, this);
      this.taskLabel = `Researching a cure (${Math.round(this.vaccineProgress)}%)`;
      if (this.vaccineProgress >= 100) {
        sim.vaccineReady = true;
        this.remember("Discovered a treatment for the fever", sim.year);
        sim.log(`${this.displayName} devises a treatment — the sick may yet rise.`, "good");
        for (const o of sim.villagers) {
          if (o.illness) {
            o.illness.t = Math.max(0, o.illness.t - 10);
            o.health = Math.min(100, o.health + 12);
          }
        }
        this.vaccineProgress = 0;
        this.job = null;
      } else if ((this.job.timer ?? 12) <= 0) this.job = null;
      else this.job.timer = (this.job.timer ?? 12) - dt;
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
    if (type === "sleep" || type === "eat" || type === "pray" || type === "research" || type === "craft_prosthetic"
      || type === "mourn" || type === "tend_sick" || type === "research_vaccine") {
      this.job.stage = "act";
      if (type === "pray") this.job.timer = 4.5;
      else if (type === "research") this.job.timer = this.trait === "Inventive" ? 6.5 : 5;
      else if (type === "craft_prosthetic") this.job.timer = 6;
      else if (type === "mourn") this.job.timer = 10;
      else if (type === "tend_sick") this.job.timer = this.job.timer ?? 6;
      else if (type === "research_vaccine") this.job.timer = 14;
      else this.job.timer = 0;
      return;
    }
    this.job = null;
  }

  pickEmote(sim) {
    if (this.breakdown?.type === "mourner") {
      this.emote = "broken";
      return;
    }
    if (this.breakdown?.type === "prophet") {
      this.emote = "pray";
      return;
    }
    if (this.breakdown) {
      this.emote = "anger";
      return;
    }
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
