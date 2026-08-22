import type { Choice } from './story';
import { determineEnding } from './endings';
import type { GameStats } from './types';

export function clampStat(value: number): number {
  return Math.max(0, Math.min(6, value));
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
    next.relationshipStrain = clampStat(next.relationshipStrain + (choice.relationshipStrainDelta ?? 0));
  }

  if (choice.acceptFarewell !== undefined) {
    next.acceptFarewell = choice.acceptFarewell;
  } else if (choice.nextId === 'CH05B-0092') {
    next.acceptFarewell = true;
  }

  if (choice.finalChoice) {
    next.finalChoice = choice.finalChoice;
  } else if (choice.nextId === 'CH05B-0092') {
    next.finalChoice = 'accept_farewell';
  } else if (choice.nextId === 'END-B-0001') {
    next.finalChoice = 'refuse_farewell';
  }

  if (next.finalChoice === 'refuse_farewell') next.acceptFarewell = false;

  if (choice.finalFarewellTone) next.finalFarewellTone = choice.finalFarewellTone;
  if (choice.timedResponse) next.timedResponse = choice.timedResponse;
  if (choice.timedProof) next.timedProof = choice.timedProof;
  if (choice.n7ProofSucceeded !== undefined) next.n7ProofSucceeded = choice.n7ProofSucceeded;
  if (choice.firstMessageCorrect !== undefined) next.firstMessageCorrect = choice.firstMessageCorrect;

  const isFinalDecision =
    choice.nextId === 'CH05B-0092' ||
    choice.nextId === 'END-B-0001' ||
    choice.acceptFarewell !== undefined ||
    choice.finalChoice !== undefined;
  if (isFinalDecision) next.ending = determineEnding(next);

  return next;
}

export function applyTimedChoiceTimeoutEffects(current: GameStats, nodeId: string): GameStats {
  const next = cloneStats(current);
  if (nodeId === 'FIN-0040') next.firstMessageCorrect = false;
  return next;
}

export function applyPersistentStoryNodeEffects(current: GameStats, nodeId: string): GameStats {
  if (nodeId === 'CH05B-GRAV-0001' && !current.gravityArrayDegraded) {
    return { ...current, gravityArrayDegraded: true };
  }
  if ((nodeId === 'FIN-0001' || nodeId === 'END-B-0001') && current.gravityArrayDegraded) {
    return { ...current, gravityArrayDegraded: false };
  }
  if (nodeId === 'END-T-0005' && !current.commemorativeArchiveSaved) {
    return { ...current, commemorativeArchiveSaved: true };
  }
  return current;
}
