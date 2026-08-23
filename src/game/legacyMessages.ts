export type LegacyMessageId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type LegacyMessageLineSource = {
  text: string;
  coreToken: string;
};

export type LegacyMessageSource = Record<LegacyMessageId, [LegacyMessageLineSource, LegacyMessageLineSource]>;

export type LegacyMessageMask = {
  id: LegacyMessageId;
  fullyHidden: boolean;
  semanticReadable: [boolean, boolean];
  lineSeeds: [string, string];
};

export type LegacyRenderedMessageMask = LegacyMessageMask & {
  lines: [string, string];
};

export type LegacyMessageSnapshot = {
  runId: string;
  encounterIndex: number;
  masks: LegacyMessageMask[];
};

export type LegacyMessageState = {
  version: 2;
  profileSeed: string;
  encounterCount: number;
  fullyHiddenPairs: Array<[LegacyMessageId, LegacyMessageId]>;
  firstThreeMaskPlan: LegacyMessageSnapshot[];
  seenRunIds: string[];
  semanticFragmentsSeen: Record<LegacyMessageId, [boolean, boolean]>;
  snapshotsByRunId: Record<string, LegacyMessageSnapshot>;
};

export const LEGACY_MESSAGE_IDS: readonly LegacyMessageId[] = ['A', 'B', 'C', 'D', 'E', 'F'];
const MAX_SAVED_SNAPSHOTS = 12;

function emptySeen(): Record<LegacyMessageId, [boolean, boolean]> {
  return {
    A: [false, false],
    B: [false, false],
    C: [false, false],
    D: [false, false],
    E: [false, false],
    F: [false, false],
  };
}

function emptySemanticPlan(): Array<Record<LegacyMessageId, [boolean, boolean]>> {
  return [emptySeen(), emptySeen(), emptySeen()];
}

export function createLegacyMessageState(profileSeed = ''): LegacyMessageState {
  return {
    version: 2,
    profileSeed,
    encounterCount: 0,
    fullyHiddenPairs: [],
    firstThreeMaskPlan: [],
    seenRunIds: [],
    semanticFragmentsSeen: emptySeen(),
    snapshotsByRunId: {},
  };
}

function createProfileSeed(): string {
  try {
    const values = new Uint32Array(4);
    globalThis.crypto?.getRandomValues(values);
    if (values.some(Boolean)) return [...values].map(value => value.toString(16).padStart(8, '0')).join('');
  } catch {
    // Restricted webviews can deny access to crypto.
  }
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 0x7fffffff).toString(36)}`;
}

function hashSeed(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function randomFromSeed(seed: string): () => number {
  let value = hashSeed(seed) || 0x6d2b79f5;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

function isMaskableCharacter(value: string): boolean {
  return !/[\s，。！？、：；,.!?/\-—]/.test(value);
}

function hideLine(line: string): string {
  return [...line].map(character => isMaskableCharacter(character) ? '█' : character).join('');
}

function partiallyMaskSemanticLine(
  source: LegacyMessageLineSource,
  semanticReadable: boolean,
  seed: string,
): string {
  const characters = [...source.text];
  const maskable = characters
    .map((character, index) => isMaskableCharacter(character) ? index : -1)
    .filter(index => index >= 0);
  if (maskable.length === 0) return source.text;

  const hasCore = Boolean(source.coreToken && source.text.includes(source.coreToken));
  const prefixLength = hasCore
    ? [...source.text.slice(0, source.text.indexOf(source.coreToken))].length
    : 0;
  const coreLength = hasCore ? [...source.coreToken].length : characters.length;
  const coreIndices = new Set(
    Array.from({ length: coreLength }, (_, offset) => prefixLength + offset)
      .filter(index => maskable.includes(index)),
  );
  const random = randomFromSeed(seed);
  const protectedIndices = semanticReadable ? coreIndices : new Set<number>();
  const hidden = new Set<number>();
  const candidates = maskable.filter(index => !protectedIndices.has(index));
  const targetCount = Math.min(
    candidates.length,
    Math.max(1, Math.round(maskable.length * (0.22 + random() * 0.36))),
  );
  for (const index of shuffle(candidates, random).slice(0, targetCount)) hidden.add(index);
  if (!semanticReadable) {
    for (const index of coreIndices) hidden.add(index);
  }
  return characters.map((character, index) => hidden.has(index) ? '█' : character).join('');
}

function pairIsAllowed(pair: readonly LegacyMessageId[]): boolean {
  return pair.length === 2 && !(pair.includes('E') && pair.includes('F'));
}

function snapshotHasValidHiddenPair(snapshot: LegacyMessageSnapshot): boolean {
  const hidden = snapshot.masks.filter(mask => mask.fullyHidden).map(mask => mask.id);
  return hidden.length === 2 && pairIsAllowed(hidden);
}

function valueConflictReadable(snapshot: LegacyMessageSnapshot): boolean {
  return (['E', 'F'] as const).some(id => {
    const mask = snapshot.masks.find(item => item.id === id);
    return Boolean(mask && !mask.fullyHidden && mask.semanticReadable.every(Boolean));
  });
}

function buildSnapshot(
  runId: string,
  encounterIndex: number,
  fullyHidden: readonly LegacyMessageId[],
  semantics: Record<LegacyMessageId, [boolean, boolean]>,
  seed: string,
): LegacyMessageSnapshot {
  const hiddenSet = new Set(fullyHidden);
  return {
    runId,
    encounterIndex,
    masks: LEGACY_MESSAGE_IDS.map(id => ({
      id,
      fullyHidden: hiddenSet.has(id),
      semanticReadable: hiddenSet.has(id)
        ? [false, false]
        : [...semantics[id]] as [boolean, boolean],
      lineSeeds: [`${seed}:${id}:0`, `${seed}:${id}:1`],
    })),
  };
}

function createAllowedPartition(profileSeed: string): Array<[LegacyMessageId, LegacyMessageId]> {
  for (let attempt = 0; attempt < 128; attempt += 1) {
    const shuffled = shuffle(LEGACY_MESSAGE_IDS, randomFromSeed(`${profileSeed}:pairs:${attempt}`));
    const pairs: Array<[LegacyMessageId, LegacyMessageId]> = [
      [shuffled[0], shuffled[1]],
      [shuffled[2], shuffled[3]],
      [shuffled[4], shuffled[5]],
    ];
    if (pairs.every(pairIsAllowed)) return pairs;
  }
  return [['A', 'E'], ['B', 'F'], ['C', 'D']];
}

function firstThreePlanCoversAllSemantics(plan: LegacyMessageSnapshot[]): boolean {
  return LEGACY_MESSAGE_IDS.every(id => [0, 1].every(lineIndex => plan.some(snapshot => {
    const mask = snapshot.masks.find(item => item.id === id);
    return mask?.semanticReadable[lineIndex] === true;
  })));
}

function createFirstThreePlan(profileSeed: string): {
  pairs: Array<[LegacyMessageId, LegacyMessageId]>;
  plan: LegacyMessageSnapshot[];
} {
  const pairs = createAllowedPartition(profileSeed);
  const semanticPlan = emptySemanticPlan();
  const random = randomFromSeed(`${profileSeed}:semantic-plan`);

  for (const id of LEGACY_MESSAGE_IDS) {
    for (const lineIndex of [0, 1] as const) {
      const availableEncounters = [0, 1, 2].filter(index => !pairs[index].includes(id));
      const primary = availableEncounters[Math.floor(random() * availableEncounters.length)];
      semanticPlan[primary][id][lineIndex] = true;
      if (random() > 0.58) {
        const secondary = availableEncounters.find(index => index !== primary);
        if (secondary != null) semanticPlan[secondary][id][lineIndex] = true;
      }
    }
  }

  for (let encounterIndex = 0; encounterIndex < 3; encounterIndex += 1) {
    const readable = (['E', 'F'] as const).find(id => (
      !pairs[encounterIndex].includes(id) && semanticPlan[encounterIndex][id].every(Boolean)
    ));
    if (!readable) {
      const fallback = (['E', 'F'] as const).find(id => !pairs[encounterIndex].includes(id))!;
      semanticPlan[encounterIndex][fallback] = [true, true];
    }
  }

  const plan = pairs.map((pair, index) => buildSnapshot(
    `__PLAN_${index + 1}__`,
    index,
    pair,
    semanticPlan[index],
    `${profileSeed}:plan:${index}`,
  ));
  if (!firstThreePlanCoversAllSemantics(plan)) {
    throw new Error('Unable to create a complete three-encounter legacy message plan.');
  }
  return { pairs, plan };
}

function cloneSnapshot(snapshot: LegacyMessageSnapshot): LegacyMessageSnapshot {
  return {
    ...snapshot,
    masks: snapshot.masks.map(mask => ({
      ...mask,
      semanticReadable: [...mask.semanticReadable] as [boolean, boolean],
      lineSeeds: [...mask.lineSeeds] as [string, string],
    })),
  };
}

function normalizePair(value: unknown): [LegacyMessageId, LegacyMessageId] | undefined {
  if (!Array.isArray(value) || value.length !== 2) return undefined;
  const pair = value as LegacyMessageId[];
  if (!pair.every(id => LEGACY_MESSAGE_IDS.includes(id)) || !pairIsAllowed(pair)) return undefined;
  return [pair[0], pair[1]];
}

function normalizeSnapshot(value: unknown, profileSeed: string): LegacyMessageSnapshot | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const source = value as Partial<LegacyMessageSnapshot>;
  if (typeof source.runId !== 'string' || !Array.isArray(source.masks)) return undefined;
  const masks = source.masks.flatMap(mask => {
    if (!mask || typeof mask !== 'object') return [];
    const item = mask as Partial<LegacyMessageMask>;
    if (!LEGACY_MESSAGE_IDS.includes(item.id as LegacyMessageId)) return [];
    const id = item.id as LegacyMessageId;
    const fullyHidden = item.fullyHidden === true;
    return [{
      id,
      fullyHidden,
      semanticReadable: fullyHidden
        ? [false, false] as [boolean, boolean]
        : [item.semanticReadable?.[0] === true, item.semanticReadable?.[1] === true] as [boolean, boolean],
      lineSeeds: [
        typeof item.lineSeeds?.[0] === 'string' ? item.lineSeeds[0] : `${profileSeed}:${source.runId}:${id}:0`,
        typeof item.lineSeeds?.[1] === 'string' ? item.lineSeeds[1] : `${profileSeed}:${source.runId}:${id}:1`,
      ] as [string, string],
    }];
  });
  if (masks.length !== LEGACY_MESSAGE_IDS.length || new Set(masks.map(mask => mask.id)).size !== masks.length) {
    return undefined;
  }
  const snapshot: LegacyMessageSnapshot = {
    runId: source.runId,
    encounterIndex: Number.isFinite(source.encounterIndex) ? Math.max(0, Math.floor(source.encounterIndex!)) : 0,
    masks,
  };
  if (!snapshotHasValidHiddenPair(snapshot)) return undefined;
  if (!valueConflictReadable(snapshot)) {
    const target = (['E', 'F'] as const).find(id => !snapshot.masks.find(mask => mask.id === id)?.fullyHidden)!;
    snapshot.masks.find(item => item.id === target)!.semanticReadable = [true, true];
  }
  return snapshot;
}

export function normalizeLegacyMessageState(value: unknown): LegacyMessageState {
  const source = value && typeof value === 'object' ? value as Partial<LegacyMessageState> : {};
  const profileSeed = typeof source.profileSeed === 'string' && source.profileSeed
    ? source.profileSeed
    : createProfileSeed();
  const generated = createFirstThreePlan(profileSeed);
  const pairs = Array.isArray(source.fullyHiddenPairs)
    ? source.fullyHiddenPairs.map(normalizePair).filter((pair): pair is [LegacyMessageId, LegacyMessageId] => Boolean(pair))
    : [];
  const plan = Array.isArray(source.firstThreeMaskPlan)
    ? source.firstThreeMaskPlan
      .map(item => normalizeSnapshot(item, profileSeed))
      .filter((item): item is LegacyMessageSnapshot => Boolean(item))
    : [];
  const validPlan = pairs.length === 3
    && plan.length === 3
    && plan.every(valueConflictReadable)
    && firstThreePlanCoversAllSemantics(plan);
  const firstThreeMaskPlan = validPlan ? plan : generated.plan;
  const fullyHiddenPairs = validPlan ? pairs : generated.pairs;
  const snapshots = source.snapshotsByRunId && typeof source.snapshotsByRunId === 'object'
    ? Object.fromEntries(Object.entries(source.snapshotsByRunId).flatMap(([runId, snapshot]) => {
        const normalized = normalizeSnapshot(snapshot, profileSeed);
        if (normalized) return [[runId, { ...normalized, runId }]];
        const encounterIndex = Number((snapshot as Partial<LegacyMessageSnapshot> | undefined)?.encounterIndex);
        if (Number.isInteger(encounterIndex) && encounterIndex >= 0 && encounterIndex < 3) {
          return [[runId, { ...cloneSnapshot(firstThreeMaskPlan[encounterIndex]), runId, encounterIndex }]];
        }
        return [];
      }))
    : {};
  const seen = emptySeen();
  for (const id of LEGACY_MESSAGE_IDS) {
    const incoming = source.semanticFragmentsSeen?.[id];
    seen[id] = [incoming?.[0] === true, incoming?.[1] === true];
  }
  for (const snapshot of Object.values(snapshots)) {
    for (const mask of snapshot.masks) {
      seen[mask.id] = [
        seen[mask.id][0] || mask.semanticReadable[0],
        seen[mask.id][1] || mask.semanticReadable[1],
      ];
    }
  }
  const seenRunIds = Array.isArray(source.seenRunIds)
    ? [...new Set(source.seenRunIds.filter((item): item is string => typeof item === 'string' && item.length > 0))]
    : Object.keys(snapshots);
  return {
    version: 2,
    profileSeed,
    encounterCount: Math.max(
      seenRunIds.length,
      Number.isFinite(source.encounterCount) ? Math.max(0, Math.floor(source.encounterCount!)) : 0,
    ),
    fullyHiddenPairs,
    firstThreeMaskPlan,
    seenRunIds,
    semanticFragmentsSeen: seen,
    snapshotsByRunId: snapshots,
  };
}

function afterFirstThreeSnapshot(state: LegacyMessageState, runId: string): LegacyMessageSnapshot {
  const random = randomFromSeed(`${state.profileSeed}:run:${runId}`);
  let hiddenPair: LegacyMessageId[] = [];
  for (let attempt = 0; attempt < 32; attempt += 1) {
    hiddenPair = shuffle(LEGACY_MESSAGE_IDS, random).slice(0, 2);
    if (pairIsAllowed(hiddenPair)) break;
  }
  const semantics = emptySeen();
  for (const id of LEGACY_MESSAGE_IDS) {
    if (hiddenPair.includes(id)) continue;
    semantics[id] = [random() > 0.38, random() > 0.38];
  }
  if (!(semantics.E.every(Boolean) || semantics.F.every(Boolean))) {
    const target = hiddenPair.includes('E') ? 'F' : 'E';
    semantics[target] = [true, true];
  }
  return buildSnapshot(
    runId,
    state.encounterCount,
    hiddenPair,
    semantics,
    `${state.profileSeed}:run:${runId}`,
  );
}

export function getOrCreateLegacyMessageSnapshot(
  value: LegacyMessageState,
  runId: string,
): { state: LegacyMessageState; snapshot: LegacyMessageSnapshot; created: boolean } {
  const state = normalizeLegacyMessageState(value);
  const existing = state.snapshotsByRunId[runId];
  if (existing) return { state, snapshot: cloneSnapshot(existing), created: false };

  const encounterIndex = state.encounterCount;
  const snapshot = encounterIndex < 3
    ? { ...cloneSnapshot(state.firstThreeMaskPlan[encounterIndex]), runId, encounterIndex }
    : afterFirstThreeSnapshot(state, runId);
  const semanticFragmentsSeen = { ...state.semanticFragmentsSeen };
  for (const mask of snapshot.masks) {
    semanticFragmentsSeen[mask.id] = [
      semanticFragmentsSeen[mask.id][0] || mask.semanticReadable[0],
      semanticFragmentsSeen[mask.id][1] || mask.semanticReadable[1],
    ];
  }
  const snapshotEntries = [
    ...Object.entries(state.snapshotsByRunId),
    [runId, cloneSnapshot(snapshot)] as const,
  ].slice(-MAX_SAVED_SNAPSHOTS);
  const nextState: LegacyMessageState = {
    ...state,
    encounterCount: encounterIndex + 1,
    seenRunIds: [...new Set([...state.seenRunIds, runId])],
    semanticFragmentsSeen,
    snapshotsByRunId: Object.fromEntries(snapshotEntries),
  };
  return { state: nextState, snapshot, created: true };
}

export function renderLegacyMessageSnapshot(
  snapshot: LegacyMessageSnapshot,
  source: LegacyMessageSource,
): LegacyRenderedMessageMask[] {
  return snapshot.masks.map(mask => ({
    ...mask,
    semanticReadable: [...mask.semanticReadable] as [boolean, boolean],
    lineSeeds: [...mask.lineSeeds] as [string, string],
    lines: mask.fullyHidden
      ? [hideLine(source[mask.id][0].text), hideLine(source[mask.id][1].text)]
      : [
          partiallyMaskSemanticLine(source[mask.id][0], mask.semanticReadable[0], mask.lineSeeds[0]),
          partiallyMaskSemanticLine(source[mask.id][1], mask.semanticReadable[1], mask.lineSeeds[1]),
        ],
  }));
}

export function isLegacyMessageReadable(
  snapshot: LegacyMessageSnapshot | undefined,
  id: LegacyMessageId,
): boolean {
  const mask = snapshot?.masks.find(item => item.id === id);
  return Boolean(mask && !mask.fullyHidden && mask.semanticReadable.every(Boolean));
}

export function hasCollectedEveryLegacySemantic(state: LegacyMessageState): boolean {
  return LEGACY_MESSAGE_IDS.every(id => state.semanticFragmentsSeen[id].every(Boolean));
}
