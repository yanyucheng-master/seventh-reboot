import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyNodes } from '../src/game/story.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const enPath = path.join(root, 'src/i18n/locales/en-US/story.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// These are the entries introduced by the current V1.0 topology that have no
// verified translation in the previous English locale. Existing translations
// are retained only when their stable node or choice ID still exists.
const contentPatches = {
  'CH03-GRAV-0001': 'Habitat gravity dropped to 0.76g today.',
  'CH03-GRAV-0002': 'The plate is a little lighter to carry.',
  'CH03-GRAV-0003': 'This thing is not any easier to chew, though.',
  'CH04-0144': 'But I cannot make out a single one.',
  'CH04-0202': 'Then that means',
  'CH04-0205': 'the one being forgotten',
  'CH05A-0068': 'I thought so too.',
  'CH05A-0152': 'This is a recording.',
  'CH05A-0176': '"If you are seeing this, the sixth run failed too."',
  'CH05A-0211': 'It can calculate, but it has no reason to doubt the original course.',
  'CH05A-0228': 'When you are afraid and alone, it is easy to pretend you did not see.',
  'CH05B-GRAV-0001': [
    'ZONED GRAVITY ARRAY DEGRADING',
    'Habitat: 0.78g -> 0.46g',
    'Maintenance deck: 0.18g',
    'Nonessential sections: OFFLINE',
    'Pressure / air circulation: independent loops holding',
  ].join('\n'),
  'CH05B-GRAV-0002': 'The deck just got lighter under my feet.',
  'CH05B-GRAV-0003': 'The maintenance deck is down to 0.18g.',
  'CH05B-GRAV-0004': 'Once I am in, I will have to move slowly using handrails and magnetic boots.',
  'CH05B-0045': [
    'SIXTH-RUN COURSE PACKAGE / VALIDATION RESULT||Detour target: avoid S-7 phase-resonance zone',
    'Public navigation simulation: PASSED',
    'Shipboard AI verification: PASSED',
    'Protocol-layer response: mission deviation / rollback pending',
    'Physical isolation point: PHASE-CORE BUS B',
    'Note: write the new course first, then cut the protocol bus',
  ].join('\n'),
  'CH05B-0049': [
    'EXTERNAL IDENTITY REGISTRY / CURRENT RUN||External Calls 01-06: no reply / no identity created',
    'External Call 07: external-consciousness reply received',
    'Identity created: after the first reply in this run\'s prologue',
    'Identity name: Observer-01',
    'Prior identities with this name: 0',
  ].join('\n'),
  'CH05B-0084': 'Course intersects S-7 safety boundary\nFinal write not executed',
  'CH05B-0105': 'The link is about to break.',
  'FIN-0007': '...',
  'FIN-0030': 'Then I do not have to decide for you what to remember.',
  'FIN-0036': 'But after this link closes',
  'FIN-0039': 'What was the first thing I said to you?',
  'FIN-0045': 'It is okay.',
  'END-T-0002': 'Observer-01',
  'END-T-0004': 'But I know who answered me.',
  'END-N-0001': 'The external link is closing.',
  'END-B-0012': 'LIVE-07 not found.',
};

const choicePatches = {
  'PRO-0128__2': '[I fear neither heaven nor earth.]',
  'PRO-0128__3': '[Why stop halfway through?]',
  'PRO-0152__3': '[Then you have found me now.]',
  'CH01-0044__3': '[Alien monster!]',
  'CH01-0009__4': '[Alien monster? Is it?]',
  'CH01-0063__2': '[I will keep pretending I did not hear that.]',
  'CH01-0115__3': '[I hate pets.]',
  'CH02-0041__1': '[You just sleep too much.]',
  'CH02-0110__3': '[It makes no difference to me.]',
  'CH02-0160__2': '[Navigators do maintenance too?]',
  'CH02-0222__2': '[Is your sleep really that bad?]',
  'CH03-0009__2': '[That is strange.]',
  'CH03-0232__2': '[I do not know.]',
  'CH04-0071__1': '[I do not remember.]',
  'CH04-0071__2': '[It was your cat.]',
  'CH04-0109__2': '[What can I do?]',
  'CH04-0147__0': '[Those are memories from the last few days?]',
  'CH04-0147__1': '[Do you remember saying that?]',
  'CH04-0188__2': '[I am here.]',
  'CH05A-0067__0': '[Six files, so six loops?]',
  'CH05A-0067__1': '[You wrote all of these?]',
  'CH05A-0067__2': '[Why are two completely unreadable?]',
  'CH05A-0076__3': '[Some of it is still unreadable.]',
  'CH05A-0161__0': '[Who is she?]',
  'CH05A-0161__1': '[What happened in the recording?]',
  'CH05A-0161__2': '[Are you all right?]',
  'CH05A-0205__0': '[So the problem was always S-7?]',
  'CH05A-0205__1': '[Why did the AI not find it?]',
  'CH05A-0205__2': '[The sixth run already found a way around it?]',
  'CH05A-0222__0': '[Then do not let it happen.]',
  'CH05A-0222__1': '[Are you afraid?]',
  'CH05A-0222__2': '[How much time do we have left?]',
  'CH05B-0054__0': '[I will stay with you to the end.]',
  'CH05B-0054__1': '[Save the ship first.]',
  'CH05B-0054__2': '[You were already close to the answer.]',
  'CH05B-0091__0': '[Shut down the Seventh Protocol.]',
  'CH05B-0091__1': '[Wait. I do not want to disconnect yet.]',
  'CH05B-0091__2': '[Keep the protocol. Maybe we can try again.]',
  'CH05B-0097__0': '[Shut it down.]',
  'CH05B-0097__1': '[Leave it.]',
  'FIN-0009__0': '[I am here.]',
  'FIN-0028__0': '[I will remember you.]',
  'FIN-0028__1': '[At least you made it to tomorrow.]',
  'FIN-0028__2': '[I am not ready to say goodbye.]',
  'FIN-0040__0': '[Did someone really receive this?]',
  'FIN-0040__1': '[Are you real?]',
  'FIN-0040__2': '[Do we know each other?]',
};

const nextNodes = {};
const missing = [];

for (const node of storyNodes) {
  const previous = en.nodes?.[node.id] ?? {};
  const localized = {};

  if (node.content.trim().length > 0) {
    const content = contentPatches[node.id] ?? previous.content;
    if (typeof content !== 'string' || content.trim().length === 0) {
      missing.push(`${node.id}.content`);
    } else {
      localized.content = content;
    }
  }

  if (node.choices?.length) {
    localized.choices = {};
    for (const choice of node.choices) {
      const choiceId = choice.id;
      const translated = choicePatches[choiceId] ?? previous.choices?.[choiceId];
      if (typeof translated !== 'string' || translated.trim().length === 0) {
        missing.push(`${node.id}.choices.${choiceId}`);
      } else {
        localized.choices[choiceId] = translated;
      }
    }
  }

  if (Object.keys(localized).length > 0) nextNodes[node.id] = localized;
}

if (missing.length > 0) {
  throw new Error(`English story is missing current-topology translations:\n${missing.join('\n')}`);
}

const cjkLeaks = [];
for (const [id, entry] of Object.entries(nextNodes)) {
  if (/\p{Script=Han}/u.test(entry.content ?? '')) cjkLeaks.push(`${id}.content`);
  for (const [choiceId, value] of Object.entries(entry.choices ?? {})) {
    if (/\p{Script=Han}/u.test(value)) cjkLeaks.push(`${id}.choices.${choiceId}`);
  }
}

if (cjkLeaks.length > 0) {
  throw new Error(`English story contains Chinese fallback text:\n${cjkLeaks.join('\n')}`);
}

const previousCount = Object.keys(en.nodes ?? {}).length;
const next = { ...en, version: 'V1.0', nodes: nextNodes };
fs.writeFileSync(enPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');

console.log(`English topology synchronized: ${Object.keys(nextNodes).length} localized nodes.`);
console.log(`Removed ${Math.max(0, previousCount - Object.keys(nextNodes).length)} obsolete locale entries.`);
console.log(`Applied ${Object.keys(contentPatches).length} content patches and ${Object.keys(choicePatches).length} choice patches.`);
