import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { novaAvatarAssets } from '../src/game/assets.ts';
import {
  applyNovaAvatarNodeEffect,
  createDefaultNovaAvatarState,
  resolveNovaAvatarOverlay,
  resolveNovaAvatarPresentation,
} from '../src/game/avatarState.ts';
import { storyNodes } from '../src/game/story.ts';
import {
  defaultStats,
  migrateSaveData,
  SAVE_STATE_VERSION,
  STORY_CONTENT_VERSION,
} from '../src/game/storage.ts';
import type { DisplayMessage, NovaAvatarStoryState } from '../src/game/types.ts';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: new MemoryStorage(),
});

function advance(state: NovaAvatarStoryState, nodeId: string): NovaAvatarStoryState {
  return applyNovaAvatarNodeEffect(state, nodeId, `2026-07-15T00:00:${nodeId.length.toString().padStart(2, '0')}Z`).state;
}

let state = createDefaultNovaAvatarState();
assert.deepEqual(resolveNovaAvatarPresentation(state), { base: 'unknown_signal', overlay: 'signal_weak' });

const firstNotice = applyNovaAvatarNodeEffect(state, 'p9');
assert.deepEqual(firstNotice.noticeKeys, ['avatar.connection.unregistered']);
state = firstNotice.state;
assert.deepEqual(applyNovaAvatarNodeEffect(state, 'p9').noticeKeys, [], 'Unknown contact notice must be idempotent');

state = advance(state, 'ch1_pet5');
state = advance(state, 'ch1_n7photo');
state = advance(state, 'ch3_flower1');
assert.equal(state.n7AvatarQueued, true);
assert.equal(state.whiteFlowerAvatarQueued, true);
assert.equal(resolveNovaAvatarPresentation(state).base, 'unknown_signal', 'Story photos must not become avatars before identity proof');

const verified = applyNovaAvatarNodeEffect(state, 'ch4_id_confirm');
state = verified.state;
assert.equal(verified.transition, 'identity-verification');
assert.equal(resolveNovaAvatarPresentation(state).base, 'official_navigator');

const privateProfile = applyNovaAvatarNodeEffect(state, 'ch4_trust1');
state = privateProfile.state;
assert.equal(privateProfile.transition, 'private-profile');
assert.equal(resolveNovaAvatarPresentation(state).base, 'n7_private');

const flowerProfile = applyNovaAvatarNodeEffect(state, 'ch4_gn1');
state = flowerProfile.state;
assert.equal(flowerProfile.transition, 'flower-profile');
assert.equal(resolveNovaAvatarPresentation(state).base, 'white_flower');

state = advance(state, 'ch4_offline');
assert.deepEqual(resolveNovaAvatarPresentation(state), { base: 'n7_private', overlay: 'offline_residual' });
state = advance(state, 'ch5a_1');
assert.deepEqual(resolveNovaAvatarPresentation(state), { base: 'n7_private', overlay: 'none' });

const trueEnding = advance(state, 'fin_action_prompt');
assert.deepEqual(resolveNovaAvatarPresentation(trueEnding), { base: 'n7_private', overlay: 'archived' });
const normalEnding = advance(state, 'normal_action_prompt');
assert.deepEqual(resolveNovaAvatarPresentation(normalEnding), { base: 'n7_private', overlay: 'offline_residual' });

const badEndingEffect = applyNovaAvatarNodeEffect(state, 'bad_15');
assert.equal(badEndingEffect.transition, 'profile-clear');
assert.deepEqual(badEndingEffect.noticeKeys, ['avatar.badEnding.profileReset']);
assert.deepEqual(resolveNovaAvatarPresentation(badEndingEffect.state), {
  base: 'official_navigator',
  overlay: 'offline_residual',
});

let missingN7 = createDefaultNovaAvatarState();
missingN7 = advance(missingN7, 'ch4_id_confirm');
missingN7 = advance(missingN7, 'ch4_trust1');
assert.equal(resolveNovaAvatarPresentation(missingN7).base, 'official_navigator');

let missingFlower = createDefaultNovaAvatarState();
for (const nodeId of ['ch1_pet5', 'ch1_n7photo', 'ch4_id_confirm', 'ch4_trust1', 'ch4_gn1']) {
  missingFlower = advance(missingFlower, nodeId);
}
assert.equal(resolveNovaAvatarPresentation(missingFlower).base, 'n7_private');

assert.equal(resolveNovaAvatarOverlay(state, {
  nova06AvatarInterferenceActive: true,
  activeSpecialInteraction: 'power-routing',
}), 'nova06_interference', 'NOVA-06 must outrank special-interaction overlays');
assert.equal(resolveNovaAvatarOverlay(state, { activeSpecialInteraction: 'power-routing' }), 'special_power');
assert.equal(resolveNovaAvatarOverlay(state, { activeSpecialInteraction: 'bulkhead-isolation' }), 'special_bulkhead');

const legacyMessages = [
  {
    id: 'ch1_pet5_1',
    speaker: 'nova',
    type: 'text',
    content: 'N7',
    sourceNodeId: 'ch1_pet5',
    emotion: 'smile',
    avatarProfile: 'nova_normal',
    avatarUrl: '/assets/nova_normal.png',
    contactStage: 'named',
  },
  {
    id: 'ch1_n7photo_2',
    speaker: 'nova',
    type: 'image',
    content: 'N7 photo',
    image: '/assets/nova_n7_photo.png',
    sourceNodeId: 'ch1_n7photo',
  },
] as unknown as DisplayMessage[];

const migrated = migrateSaveData({
  pendingNodeId: 'ch4_trust1',
  messages: legacyMessages,
  novaEmotion: 'sad',
  contactStage: 'verified',
  stats: { ...defaultStats, memoryAnchors: ['n7'] },
  timestamp: Date.now(),
  storyVersion: 'V1.0',
  storyContentVersion: STORY_CONTENT_VERSION,
  saveStateVersion: SAVE_STATE_VERSION,
});
assert.ok(migrated);
assert.equal(resolveNovaAvatarPresentation(migrated.avatarState).base, 'n7_private');
const migratedJson = JSON.stringify(migrated.messages);
assert.equal(migratedJson.includes('nova_normal'), false);
assert.equal(migratedJson.includes('novaEmotion'), false);
assert.equal(migratedJson.includes('avatarProfile'), false);
assert.equal(migratedJson.includes('contactStage'), false);

assert.deepEqual(Object.keys(novaAvatarAssets).sort(), [
  'n7_private',
  'official_navigator',
  'unknown_signal',
  'white_flower',
]);
assert.deepEqual(novaAvatarAssets, {
  unknown_signal: null,
  official_navigator: '/assets/nova_avatar_official_navigator.png',
  n7_private: '/assets/nova_avatar_n7_private.png',
  white_flower: null,
});

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
for (const asset of Object.values(novaAvatarAssets)) {
  if (!asset) continue;
  const assetPath = resolve(projectRoot, 'public', asset.replace(/^\/+/, ''));
  assert.equal(existsSync(assetPath), true, `Configured avatar asset is missing: ${asset}`);
}

for (const node of storyNodes) {
  const legacy = node as unknown as Record<string, unknown>;
  assert.equal('emotion' in legacy, false, `${node.id} still contains legacy emotion data`);
  assert.equal('avatarProfile' in legacy, false, `${node.id} still contains a direct avatar path`);
}

console.log('Avatar system tests passed.');
