export type LegacyMessageId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type LegacyMessageMask = {
  id: LegacyMessageId;
  lines: [string, string];
  fullyHidden: boolean;
  semanticReadable: [boolean, boolean];
};

export type LegacyMessageSnapshot = {
  runId: string;
  encounterIndex: number;
  masks: LegacyMessageMask[];
};

export type LegacyMessageState = {
  version: 1;
  profileSeed: string;
  encounterCount: number;
  fullyHiddenPairs: Array<[LegacyMessageId, LegacyMessageId]>;
  firstThreeMaskPlan: LegacyMessageSnapshot[];
  seenRunIds: string[];
  semanticFragmentsSeen: Record<LegacyMessageId, [boolean, boolean]>;
  snapshotsByRunId: Record<string, LegacyMessageSnapshot>;
};

export const LEGACY_MESSAGES: Record<LegacyMessageId, [string, string]> = {
  A: ['醒来先看终端', '别信日期'],
  B: ['别一个人去观测室', '我试过'],
  C: ['没人回应', '也别停'],
  D: ['别一次全想起来', '你会撑不住'],
  E: ['继续', '至少大家还能醒来'],
  F: ['别再继续', '醒来不等于活着'],
};

const IDS = Object.keys(LEGACY_MESSAGES) as LegacyMessageId[];
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

export function createLegacyMessageState(profileSeed = ''): LegacyMessageState {
  return {
    version: 1,
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
  return !/[\s，。！？、：；,.!?\-—/]/.test(value);
}

function hideLine(line: string): string {
  return [...line].map(character => isMaskableCharacter(character) ? '█' : character).join('');
}

function partiallyMaskLine(line: string, random: () => number): { text: string; readable: boolean } {
  const characters = [...line];
  const maskable = characters
    .map((character, index) => isMaskableCharacter(character) ? index : -1)
    .filter(index => index >= 0);
  if (maskable.length <= 1) return { text: line, readable: true };

  const targetRatio = 0.2 + random() * 0.58;
  const hidden = new Set<number>();
  let cursor = Math.floor(random() * maskable.length);
  while (hidden.size / maskable.length < targetRatio) {
    const runLength = 1 + Math.floor(random() * Math.max(1, Math.ceil(maskable.length / 3)));
    for (let offset = 0; offset < runLength; offset += 1) {
      hidden.add(maskable[(cursor + offset) % maskable.length]);
    }
    cursor = Math.floor(random() * maskable.length);
  }

  if (hidden.size === maskable.length) hidden.delete(maskable[Math.floor(random() * maskable.length)]);
  const visibleRatio = (maskable.length - hidden.size) / maskable.length;
  return {
    text: characters.map((character, index) => hidden.has(index) ? '█' : character).join(''),
    readable: visibleRatio >= 0.45,
  };
}

function buildSnapshot(
  runId: string,
  encounterIndex: number,
  fullyHidden: readonly LegacyMessageId[],
  random: () => number,
): LegacyMessageSnapshot {
  const hiddenSet = new Set(fullyHidden);
  return {
    runId,
    encounterIndex,
    masks: IDS.map(id => {
      const source = LEGACY_MESSAGES[id];
      if (hiddenSet.has(id)) {
        return {
          id,
          lines: [hideLine(source[0]), hideLine(source[1])],
          fullyHidden: true,
          semanticReadable: [false, false],
        };
      }
      const first = partiallyMaskLine(source[0], random);
      const second = partiallyMaskLine(source[1], random);
      return {
        id,
        lines: [first.text, second.text],
        fullyHidden: false,
        semanticReadable: [first.readable, second.readable],
      };
    }),
  };
}

function firstThreePlanCoversAllSemantics(plan: LegacyMessageSnapshot[]): boolean {
  return IDS.every(id => [0, 1].every(lineIndex => plan.some(snapshot => {
    const mask = snapshot.masks.find(item => item.id === id);
    return mask?.semanticReadable[lineIndex] === true;
  })));
}

function createFirstThreePlan(profileSeed: string): {
  pairs: Array<[LegacyMessageId, LegacyMessageId]>;
  plan: LegacyMessageSnapshot[];
} {
  const pairRandom = randomFromSeed(`${profileSeed}:pairs`);
  const shuffled = shuffle(IDS, pairRandom);
  const pairs: Array<[LegacyMessageId, LegacyMessageId]> = [
    [shuffled[0], shuffled[1]],
    [shuffled[2], shuffled[3]],
    [shuffled[4], shuffled[5]],
  ];

  for (let attempt = 0; attempt < 4096; attempt += 1) {
    const random = randomFromSeed(`${profileSeed}:mask-plan:${attempt}`);
    const plan = pairs.map((pair, index) => buildSnapshot(
      `__PLAN_${index + 1}__`,
      index,
      pair,
      random,
    ));
    if (firstThreePlanCoversAllSemantics(plan)) return { pairs, plan };
  }

  throw new Error('Unable to create a valid three-encounter legacy message plan.');
}

function cloneSnapshot(snapshot: LegacyMessageSnapshot): LegacyMessageSnapshot {
  return {
    ...snapshot,
    masks: snapshot.masks.map(mask => ({
      ...mask,
      lines: [...mask.lines] as [string, string],
      semanticReadable: [...mask.semanticReadable] as [boolean, boolean],
    })),
  };
}

function normalizePair(value: unknown): [LegacyMessageId, LegacyMessageId] | undefined {
  if (!Array.isArray(value) || value.length !== 2) return undefined;
  if (!IDS.includes(value[0] as LegacyMessageId) || !IDS.includes(value[1] as LegacyMessageId)) return undefined;
  return [value[0] as LegacyMessageId, value[1] as LegacyMessageId];
}

function normalizeSnapshot(value: unknown): LegacyMessageSnapshot | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const source = value as Partial<LegacyMessageSnapshot>;
  if (typeof source.runId !== 'string' || !Array.isArray(source.masks)) return undefined;
  const masks = source.masks.flatMap(mask => {
    if (!mask || typeof mask !== 'object') return [];
    const item = mask as Partial<LegacyMessageMask>;
    if (!IDS.includes(item.id as LegacyMessageId) || !Array.isArray(item.lines) || item.lines.length !== 2) return [];
    return [{
      id: item.id as LegacyMessageId,
      lines: [String(item.lines[0]), String(item.lines[1])] as [string, string],
      fullyHidden: item.fullyHidden === true,
      semanticReadable: [
        item.semanticReadable?.[0] === true,
        item.semanticReadable?.[1] === true,
      ] as [boolean, boolean],
    }];
  });
  if (masks.length !== IDS.length) return undefined;
  return {
    runId: source.runId,
    encounterIndex: Number.isFinite(source.encounterIndex) ? Math.max(0, Math.floor(source.encounterIndex!)) : 0,
    masks,
  };
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
    ? source.firstThreeMaskPlan.map(normalizeSnapshot).filter((item): item is LegacyMessageSnapshot => Boolean(item))
    : [];
  const snapshots = source.snapshotsByRunId && typeof source.snapshotsByRunId === 'object'
    ? Object.fromEntries(Object.entries(source.snapshotsByRunId).flatMap(([runId, snapshot]) => {
        const normalized = normalizeSnapshot(snapshot);
        return normalized ? [[runId, { ...normalized, runId }]] : [];
      }))
    : {};
  const seen = emptySeen();
  for (const id of IDS) {
    const incoming = source.semanticFragmentsSeen?.[id];
    seen[id] = [incoming?.[0] === true, incoming?.[1] === true];
  }
  return {
    version: 1,
    profileSeed,
    encounterCount: Number.isFinite(source.encounterCount)
      ? Math.max(0, Math.floor(source.encounterCount!))
      : Object.keys(snapshots).length,
    fullyHiddenPairs: pairs.length === 3 ? pairs : generated.pairs,
    firstThreeMaskPlan: plan.length === 3 ? plan : generated.plan,
    seenRunIds: Array.isArray(source.seenRunIds)
      ? [...new Set(source.seenRunIds.filter((item): item is string => typeof item === 'string' && item.length > 0))]
      : Object.keys(snapshots),
    semanticFragmentsSeen: seen,
    snapshotsByRunId: snapshots,
  };
}

function afterFirstThreeSnapshot(state: LegacyMessageState, runId: string): LegacyMessageSnapshot {
  const random = randomFromSeed(`${state.profileSeed}:run:${runId}`);
  const hiddenPair = shuffle(IDS, random).slice(0, 2);
  return buildSnapshot(runId, state.encounterCount, hiddenPair, random);
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
    ? {
        ...cloneSnapshot(state.firstThreeMaskPlan[encounterIndex]),
        runId,
        encounterIndex,
      }
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

export function isLegacyMessageReadable(
  snapshot: LegacyMessageSnapshot | undefined,
  id: LegacyMessageId,
): boolean {
  const mask = snapshot?.masks.find(item => item.id === id);
  return Boolean(mask && !mask.fullyHidden && mask.semanticReadable.some(Boolean));
}

export function hasCollectedEveryLegacySemantic(state: LegacyMessageState): boolean {
  return IDS.every(id => state.semanticFragmentsSeen[id].every(Boolean));
}
