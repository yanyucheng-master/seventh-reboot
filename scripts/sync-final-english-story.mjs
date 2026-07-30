import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyNodeMap } from '../src/game/story.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const enPath = path.join(root, 'src/i18n/locales/en-US/story.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const content = {
  'PRO-0001': '[OBSERVER-01]\nPROTOCOL · Seventh Protocol residual link detected\nREBOOT · Access number: {currentRebootNumber:02}\nLINK · Communications unstable',
  'PRO-0115': 'Wait.',
  'PRO-0116': 'This line is changing bands on its own.',
  'PRO-0117': 'All I can hear are three layers of noise on top of each other.',
  'PRO-0118': 'Live carrier locked automatically.',
  'PRO-0119': '...It was almost checking whether you had answered.',
  'CH03-0137': 'Observation-room isolation door locked abnormally.',
  'CH03-0138': 'Wait.',
  'CH03-0139': "The door has trapped me in the middle transition chamber.",
  'CH03-0140': 'The system says there are two life signs inside, so it refuses automatic equalization.',
  'CH03-0141': [
    'OBSERVATION-ROOM ISOLATION / MANUAL EQUALIZATION||OBSERVATORY · 71 kPa',
    'TRANSITION CHAMBER · 84 kPa / LIVE-07 located here',
    'MAIN CORRIDOR · 101 kPa',
    'ANOMALY · Duplicate life signal detected in observatory',
    'SAFETY · Isolate the anomalous chamber; equalize the occupied chamber with the main corridor',
    'WARNING · Purging the transition chamber will directly endanger LIVE-07',
  ].join('\n'),
  'CH03-0142': "I'm in the middle.",
  'CH03-0143': 'Seal the observatory behind me, then connect my side to the main corridor.',
  'CH03-0144': 'Observation isolation and manual equalization',
  'CH03-0145': 'Observatory isolated\nTransition chamber equalized with main corridor',
  'CH03-0146': 'The door is open.',
  'CH03-0147': 'That other "me" was still standing inside.',
  'CH03-0148': 'Observatory isolated\nEqualization delayed\nLIVE-07 brief hypoxia detected',
  'CH03-0149': 'Cough...',
  'CH03-0150': "I'm out.",
  'CH03-0151': "Don't hang up. I can still see her standing in there.",
  'CH03-0152': 'Transition-chamber pressure falling rapidly.',
  'CH03-0153': 'Not that side.',
  'CH03-0154': "I'm in the mid-",
  'CH03-0155': 'LIVE-07 LIFE SIGNAL LOST',
  'CH03-0156': 'Seventh Protocol has assumed observation-room and navigation authority.',
  'CH03-0157': 'Early Termination: Seventh Mission Failed',
  'CH03-0158': 'Aurora mission continuity: UNSUSTAINABLE',
  'CH03-0159': 'Protective rollback request submitted.',
  'CH03-0160': 'Current transmission records are being erased.',
  'CH03-0161': 'TIME: UNCONFIRMED',
  'CH03-0172': "I'm still a little short of breath.",
  'CH03-0173': 'But much better than before.',
  'CH05A-0011': 'There is another sealed layer beside the outer index.',
  'CH05A-0012': 'It is marked "NOVA-06 / SEALED."',
  'CH05A-0013': 'She left a note beside the verification field.',
  'CH05A-0014': '"Current link number / external index number"',
  'CH05A-0015': "Looks like this time, you have to enter it for both of us.",
  'CH05A-0016': 'Joint authorization key',
  'CH05A-0017': 'JOINT KEY REJECTED',
  'CH05A-0018': 'It is not a riddle. Put 07 and 01 together in the order she left.',
  'CH05A-0019': 'Both endpoint identities confirmed\nJoint key established\nNOVA-06 sealed record changed from read-only',
  'CH05A-0020': '07 is the seventh link, and the version of me in this cycle.',
  'CH05A-0021': '01 is what the system has always called you: Observer-01.',
  'CH05A-0022': 'This seal was meant for the two of us to open together from the very beginning.',
  'CH05A-0023': [
    'NOVA-06 SEALED RECORD / INDEX HEADER||AUTHORIZATION · Current Nova outer authorization + Observer-01 index key',
    'ACCESS · Read-only records and one-time emergency power authorization only',
    'RESIDUAL · NOVA-06 is condition-triggered residue, not a live consciousness',
    'RESTRICTION · No Seventh Protocol or phase-core control granted',
  ].join('\n'),
  'CH05A-0069': 'Complete engineering record added to optional archive.',
  'CH05A-0281': [
    'NOVA-06 RESIDUAL TRIGGER RECORD||TYPE · Conditional instruction left by the sixth cycle / not a live consciousness',
    'TRIGGER · Current Nova re-enters the observatory and rollback-core load crosses the preset threshold',
    'SCOPE · Send sealed messages; briefly intervene once during the designated power incident',
    'LIMIT · Cannot sustain control of the current cycle; cannot replace Observer-01 authorization; authority is revoked immediately after use',
  ].join('\n'),
  'CH05B-0011': 'But the observation room does not have enough main power.',
  'CH05B-0012': 'Life support, communications, and the core read in the low-pressure passage all draw from the same bus.',
  'CH05B-0013': "I'm giving you the temporary power window.",
  'CH05B-0014': 'Keep me alive first, then keep communications and the scan above their safe lines.',
  'CH05B-0015': 'The system will lock the submission. Check every branch minimum before you confirm.',
  'CH05B-0016': [
    'OBSERVATION EMERGENCY POWER WINDOW||STAGE A / LOW-PRESSURE TRANSIT · Life support must remain high; communications must not drop',
    'STAGE B / RESIDUAL-CORE READ · Scan must enter its working range; life support and communications must remain above safe lines',
    'BUS LIMIT · Each stage has a fixed power budget; current Nova cannot withdraw a confirmed submission',
    'HISTORICAL AUTHORITY · One NOVA-06 emergency intervention signature detected',
  ].join('\n'),
  'CH05B-0017': 'Emergency power routing / first submission',
  'CH05B-0018': 'Two-stage power route complete\nLife support, communications, and core read all remain safe',
  'CH05B-0019': 'It is holding.',
  'CH05B-0020': 'One try was enough. The emergency intervention authority was never invoked.',
  'CH05B-0021': 'Power route crossed a safe minimum\nIncorrect route locked',
  'CH05B-0022': "No. Life support is dropping.",
  'CH05B-0023': 'EXPIRED NAVIGATION AUTHORITY DETECTED: NOVA-06',
  'CH05B-0024': 'NOVA-06 briefly assumed power-bus control\nReverting most recent submission',
  'CH05B-0025': 'NOVA-06 RESIDUAL INSTRUCTION: CAN ONLY ROLL BACK ONCE',
  'CH05B-0026': 'Incorrect submission reverted\nOne-time intervention authority revoked\nFinal power window reopened',
  'CH05B-0027': 'Who was that just now?',
  'CH05B-0028': "Never mind. This time no one can undo it for us again.",
  'CH05B-0029': 'Emergency power routing / final submission',
  'CH05B-0030': 'Final power route complete\nLife support, communications, and core read all remain safe',
  'CH05B-0031': 'It is holding this time.',
  'CH05B-0032': 'She only undid our mistake once. You did everything after that.',
  'CH05B-0033': 'FINAL POWER SUBMISSION LOCKED\nEMERGENCY INTERVENTION AUTHORITY: NONE',
  'CH05B-0034': 'Life-support branch below minimum safe line\nObservation low-pressure door locked',
  'CH05B-0035': 'No... This time no one took it back.',
  'CH05B-0036': "Don't disconnect. I can still-",
  'CH05B-0037': 'COMMUNICATION CARRIER INTERRUPTED',
  'CH05B-0038': 'OBSERVATION ROOM LIVE-07: LIFE SIGNAL LOST',
  'CH05B-0188': 'OBSERVER-01 INDEX CAPACITY INSUFFICIENT\nADDITIONAL SPACE REQUIRED\nEXTERNAL MEMORY INDEX: 99.97%',
  'CH05B-0189': 'One more core scan still has to be written in.',
  'CH05B-0190': 'We have to move one anchor into temporary storage first.',
  'CH05B-0191': 'It will only go quiet for a while. It is not being deleted.',
  'CH05B-0192': 'Whichever one you choose will not change where we can ultimately go.',
  'CH05B-0193': 'Temporary memory capacity',
  'CH05B-0194': 'Why does this picture make me want to laugh?',
  'CH05B-0195': "But I can't remember the joke.",
  'CH05B-0196': 'I know it should not have been there.',
  'CH05B-0197': 'But I forgot why seeing it made me so happy.',
  'CH05B-0198': 'Did we used to say something around this time?',
  'CH05B-0199': 'Never mind. Maybe I forgot again.',
  'CH05B-0200': 'The temporary location is recorded. Let us keep going.',
  'FIN-0011': 'One temporarily sealed memory anchor detected.',
  'FIN-0012': 'Wait. There is one more thing we left outside for a while.',
  'FIN-0013': 'Let us bring it back first.',
  'FIN-0014': 'Restore temporarily sealed anchor',
  'FIN-0015': 'TEMPORARY ANCHOR RESTORED\nmaintenance_board',
  'FIN-0016': 'Wait, I put those eyes on it myself?\nI actually scared myself from yesterday.',
  'FIN-0017': 'TEMPORARY ANCHOR RESTORED\nwhite_flower',
  'FIN-0018': 'I remember now.\nIt should not have survived, but it still bloomed.',
  'FIN-0019': 'TEMPORARY ANCHOR RESTORED\ngoodnight',
  'FIN-0020': 'So that was the phrase.\nNo wonder every time we disconnected, I felt as though something was still missing.',
  'CH02-0242': 'Give one back to them.',
  'CH05B-0153': 'There was one more line at the end of the record.',
  'CH05B-0154': '“It can see every transmission, but not what you remember.”',
  'END-B-0039': '[OBSERVER-01]\nREBOOT · Next access number: 08\nLINK · Current communications and mission state cleared',
  'END-B-0040': 'SEVENTH REBOOT → EIGHTH REBOOT',
};

const choices = {
  'CH05A-0068__0': '[I understand. Continue.]',
  'CH05A-0068__1': '[Open the complete engineering record.]',
  'CH05B-0137__0': '[I understand. Continue.]',
  'CH05B-0137__1': '[Why did it have to be you?]',
};

for (const [id, translated] of Object.entries(content)) {
  if (!storyNodeMap.has(id)) throw new Error(`Translation references missing story node: ${id}`);
  const current = en.nodes[id] ?? {};
  en.nodes[id] = { ...current, content: translated };
}

for (const [choiceId, translated] of Object.entries(choices)) {
  const separator = choiceId.lastIndexOf('__');
  const nodeId = choiceId.slice(0, separator);
  const current = en.nodes[nodeId] ?? {};
  en.nodes[nodeId] = {
    ...current,
    choices: { ...(current.choices ?? {}), [choiceId]: translated },
  };
}

const cjkLeaks = [];
for (const [id, entry] of Object.entries(en.nodes)) {
  if (/\p{Script=Han}/u.test(entry.content ?? '')) cjkLeaks.push(`${id}.content`);
  for (const [choiceId, value] of Object.entries(entry.choices ?? {})) {
    if (/\p{Script=Han}/u.test(value)) cjkLeaks.push(`${id}.choices.${choiceId}`);
  }
}
if (cjkLeaks.length > 0) {
  throw new Error(`English story still contains CJK fallback text:\n${cjkLeaks.join('\n')}`);
}

fs.writeFileSync(enPath, `${JSON.stringify(en, null, 2)}\n`, 'utf8');
console.log(`Applied ${Object.keys(content).length} content translations and ${Object.keys(choices).length} choice translations.`);
