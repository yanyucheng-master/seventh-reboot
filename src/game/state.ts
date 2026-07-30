import type { Choice } from './story';
import { determineEnding } from './endings';
import type { FinalFarewellVariant, GameStats } from './types';

const FINAL_MEMORY_VARIANT_BY_CHOICE_ID: Record<string, FinalFarewellVariant> = {
  'FIN-0231__0': 'remembered_until_end',
  'FIN-0231__1': 'remembered_wrong',
  'FIN-0231__2': 'remembered_wrong',
  'FIN-0231__3': 'remembered_wrong',
};

export function clampStat(value: number): number {
  return Math.max(0, Math.min(6, value));
}

export function getFinalFarewellVariant(choice: Choice): FinalFarewellVariant | undefined {
  if (choice.id && FINAL_MEMORY_VARIANT_BY_CHOICE_ID[choice.id]) {
    return FINAL_MEMORY_VARIANT_BY_CHOICE_ID[choice.id];
  }

  // Fallback for callers that still provide a choice object without its stable ID.
  if (choice.nextId === 'FIN-0232') return 'remembered_until_end';
  if (choice.nextId === 'FIN-0246' || choice.nextId === 'FIN-0253' || choice.nextId === 'FIN-0259') {
    return 'remembered_wrong';
  }
  return undefined;
}

function cloneStats(current: GameStats): GameStats {
  return {
    ...current,
    memoryAnchors: [...current.memoryAnchors],
    unlockedArchives: [...current.unlockedArchives],
    endingsUnlocked: [...current.endingsUnlocked],
  };
}

export function applyStoryChoiceEffects(current: GameStats, choice: Choice): GameStats {
  const next = cloneStats(current);
  const shouldApplyStatEffects = choice.statEffect !== 'none';

  if (shouldApplyStatEffects) {
    next.trust = clampStat(next.trust + (choice.trustDelta ?? 0));
    next.memory = clampStat(next.memory + (choice.memoryDelta ?? 0));
    next.attachment = clampStat(next.attachment + (choice.attachmentDelta ?? 0));
  }

  if (choice.acceptFarewell !== undefined) {
    next.acceptFarewell = choice.acceptFarewell;
  } else if (choice.nextId === 'CH05B-0294') {
    next.acceptFarewell = true;
  }

  if (choice.finalChoice) {
    next.finalChoice = choice.finalChoice;
  } else if (choice.nextId === 'CH05B-0294') {
    next.finalChoice = 'accept_farewell';
  } else if (choice.nextId === 'END-B-0001') {
    next.finalChoice = 'refuse_farewell';
  }

  if (next.finalChoice === 'refuse_farewell') next.acceptFarewell = false;

  const finalFarewellVariant = getFinalFarewellVariant(choice);
  if (finalFarewellVariant) next.finalFarewellVariant = finalFarewellVariant;
  if (choice.finalFarewellTone) next.finalFarewellTone = choice.finalFarewellTone;
  if (choice.timedResponse) next.timedResponse = choice.timedResponse;
  if (choice.timedProof) next.timedProof = choice.timedProof;

  const isFinalDecision =
    choice.nextId === 'CH05B-0294' ||
    choice.nextId === 'END-B-0001' ||
    choice.acceptFarewell !== undefined ||
    choice.finalChoice !== undefined;
  if (isFinalDecision) next.ending = determineEnding(next);

  return next;
}

export function applyTimedChoiceTimeoutEffects(current: GameStats, nodeId: string): GameStats {
  const next = cloneStats(current);
  if (nodeId === 'FIN-0231') next.finalFarewellVariant = 'forgetting_started';
  return next;
}

export function applyPersistentStoryNodeEffects(current: GameStats, nodeId: string): GameStats {
  if (nodeId === 'END-T-0005' && !current.commemorativeArchiveSaved) {
    return { ...current, commemorativeArchiveSaved: true };
  }
  return current;
}
