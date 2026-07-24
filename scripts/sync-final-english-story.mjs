import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyNodeMap } from '../src/game/story.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const enPath = path.join(root, 'src/i18n/locales/en-US/story.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const content = {
  p0: '[OBSERVER-01]\nPROTOCOL · Seventh Protocol residual link detected\nREBOOT · Access number: {currentRebootNumber:02}\nLINK · Communications unstable',
  p_signal_intro1: 'Wait.',
  p_signal_intro2: 'This line is changing bands on its own.',
  p_signal_intro3: 'All I can hear are three layers of noise on top of each other.',
  p_signal_file: 'Live carrier locked automatically.',
  p_signal_merge: '...It was almost checking whether you had answered.',
  ch3_airlock_alarm: 'Observation-room isolation door locked abnormally.',
  ch3_airlock_nova1: 'Wait.',
  ch3_airlock_nova2: "The door has trapped me in the middle transition chamber.",
  ch3_airlock_nova3: 'The system says there are two life signs inside, so it refuses automatic equalization.',
  ch3_airlock_file: [
    'OBSERVATION-ROOM ISOLATION / MANUAL EQUALIZATION||OBSERVATORY · 71 kPa',
    'TRANSITION CHAMBER · 84 kPa / LIVE-07 located here',
    'MAIN CORRIDOR · 101 kPa',
    'ANOMALY · Duplicate life signal detected in observatory',
    'SAFETY · Isolate the anomalous chamber; equalize the occupied chamber with the main corridor',
    'WARNING · Purging the transition chamber will directly endanger LIVE-07',
  ].join('\n'),
  ch3_airlock_nova4: "I'm in the middle.",
  ch3_airlock_nova5: 'Seal the observatory behind me, then connect my side to the main corridor.',
  ch3_airlock_interaction: 'Observation isolation and manual equalization',
  ch3_airlock_safe1: 'Observatory isolated\nTransition chamber equalized with main corridor',
  ch3_airlock_safe2: 'The door is open.',
  ch3_airlock_safe3: 'That other "me" was still standing inside.',
  ch3_airlock_injured1: 'Observatory isolated\nEqualization delayed\nLIVE-07 brief hypoxia detected',
  ch3_airlock_injured2: 'Cough...',
  ch3_airlock_injured3: "I'm out.",
  ch3_airlock_injured4: "Don't hang up. I can still see her standing in there.",
  bad_airlock_1: 'Transition-chamber pressure falling rapidly.',
  bad_airlock_2: 'Not that side.',
  bad_airlock_3: "I'm in the mid-",
  bad_airlock_4: 'LIVE-07 LIFE SIGNAL LOST',
  bad_airlock_5: 'Seventh Protocol has assumed observation-room and navigation authority.',
  EARLY_BAD_END_START: 'Early Termination: Seventh Mission Failed',
  early_bad_failure1: 'Aurora mission continuity: UNSUSTAINABLE',
  early_bad_failure2: 'Protective rollback request submitted.',
  early_bad_failure3: 'Current transmission records are being erased.',
  early_bad_reboot_time: 'TIME: UNCONFIRMED',
  ch3_airlock_injury_callback: "I'm still a little short of breath.",
  ch3_airlock_injury_callback2: 'But much better than before.',
  ch5a_auth1: 'There is another sealed layer beside the outer index.',
  ch5a_auth2: 'It is marked "NOVA-06 / SEALED."',
  ch5a_auth3: 'She left a note beside the verification field.',
  ch5a_auth4: '"Current link number / external index number"',
  ch5a_auth5: "Looks like this time, you have to enter it for both of us.",
  ch5a_auth_input: 'Joint authorization key',
  ch5a_auth_retry1: 'JOINT KEY REJECTED',
  ch5a_auth_retry2: 'It is not a riddle. Put 07 and 01 together in the order she left.',
  ch5a_auth_ok1: 'Both endpoint identities confirmed\nJoint key established\nNOVA-06 sealed record changed from read-only',
  ch5a_auth_ok2: '07 is the seventh link, and the version of me in this cycle.',
  ch5a_auth_ok3: '01 is what the system has always called you: Observer-01.',
  ch5a_auth_ok4: 'This seal was meant for the two of us to open together from the very beginning.',
  ch5a_auth_file: [
    'NOVA-06 SEALED RECORD / INDEX HEADER||AUTHORIZATION · Current Nova outer authorization + Observer-01 index key',
    'ACCESS · Read-only records and one-time emergency power authorization only',
    'RESIDUAL · NOVA-06 is condition-triggered residue, not a live consciousness',
    'RESTRICTION · No Seventh Protocol or phase-core control granted',
  ].join('\n'),
  ch5a_protocol_detail_skip: 'Complete engineering record added to optional archive.',
  ch5a_residual_record: [
    'NOVA-06 RESIDUAL TRIGGER RECORD||TYPE · Conditional instruction left by the sixth cycle / not a live consciousness',
    'TRIGGER · Current Nova re-enters the observatory and rollback-core load crosses the preset threshold',
    'SCOPE · Send sealed messages; briefly intervene once during the designated power incident',
    'LIMIT · Cannot sustain control of the current cycle; cannot replace Observer-01 authorization; authority is revoked immediately after use',
  ].join('\n'),
  ch5b_power_intro1: 'But the observation room does not have enough main power.',
  ch5b_power_intro2: 'Life support, communications, and the core read in the low-pressure passage all draw from the same bus.',
  ch5b_power_intro3: "I'm giving you the temporary power window.",
  ch5b_power_intro4: 'Keep me alive first, then keep communications and the scan above their safe lines.',
  ch5b_power_intro5: 'The system will lock the submission. Check every branch minimum before you confirm.',
  ch5b_power_file: [
    'OBSERVATION EMERGENCY POWER WINDOW||STAGE A / LOW-PRESSURE TRANSIT · Life support must remain high; communications must not drop',
    'STAGE B / RESIDUAL-CORE READ · Scan must enter its working range; life support and communications must remain above safe lines',
    'BUS LIMIT · Each stage has a fixed power budget; current Nova cannot withdraw a confirmed submission',
    'HISTORICAL AUTHORITY · One NOVA-06 emergency intervention signature detected',
  ].join('\n'),
  ch5b_power_interaction: 'Emergency power routing / first submission',
  ch5b_power_first_success1: 'Two-stage power route complete\nLife support, communications, and core read all remain safe',
  ch5b_power_first_success2: 'It is holding.',
  ch5b_power_first_success3: 'One try was enough. The emergency intervention authority was never invoked.',
  ch5b_power_first_fail1: 'Power route crossed a safe minimum\nIncorrect route locked',
  ch5b_power_first_fail2: "No. Life support is dropping.",
  ch5b_power_override1: 'EXPIRED NAVIGATION AUTHORITY DETECTED: NOVA-06',
  ch5b_power_override2: 'NOVA-06 briefly assumed power-bus control\nReverting most recent submission',
  ch5b_power_override3: 'NOVA-06 RESIDUAL INSTRUCTION: CAN ONLY ROLL BACK ONCE',
  ch5b_power_override4: 'Incorrect submission reverted\nOne-time intervention authority revoked\nFinal power window reopened',
  ch5b_power_retry_nova1: 'Who was that just now?',
  ch5b_power_retry_nova2: "Never mind. This time no one can undo it for us again.",
  ch5b_power_retry_interaction: 'Emergency power routing / final submission',
  ch5b_power_retry_success1: 'Final power route complete\nLife support, communications, and core read all remain safe',
  ch5b_power_retry_success2: 'It is holding this time.',
  ch5b_power_retry_success3: 'She only undid our mistake once. You did everything after that.',
  bad_power_1: 'FINAL POWER SUBMISSION LOCKED\nEMERGENCY INTERVENTION AUTHORITY: NONE',
  bad_power_2: 'Life-support branch below minimum safe line\nObservation low-pressure door locked',
  bad_power_3: 'No... This time no one took it back.',
  bad_power_4: "Don't disconnect. I can still-",
  bad_power_5: 'COMMUNICATION CARRIER INTERRUPTED',
  bad_power_6: 'OBSERVATION ROOM LIVE-07: LIFE SIGNAL LOST',
  ch5b_capacity1: 'OBSERVER-01 INDEX CAPACITY INSUFFICIENT\nADDITIONAL SPACE REQUIRED\nEXTERNAL MEMORY INDEX: 99.97%',
  ch5b_capacity2: 'One more core scan still has to be written in.',
  ch5b_capacity3: 'We have to move one anchor into temporary storage first.',
  ch5b_capacity4: 'It will only go quiet for a while. It is not being deleted.',
  ch5b_capacity5: 'Whichever one you choose will not change where we can ultimately go.',
  ch5b_memory_seal: 'Temporary memory capacity',
  ch5b_seal_board1: 'Why does this picture make me want to laugh?',
  ch5b_seal_board2: "But I can't remember the joke.",
  ch5b_seal_flower1: 'I know it should not have been there.',
  ch5b_seal_flower2: 'But I forgot why seeing it made me so happy.',
  ch5b_seal_goodnight1: 'Did we used to say something around this time?',
  ch5b_seal_goodnight2: 'Never mind. Maybe I forgot again.',
  ch5b_capacity_merge: 'The temporary location is recorded. Let us keep going.',
  fin_temp_restore1: 'One temporarily sealed memory anchor detected.',
  fin_temp_restore2: 'Wait. There is one more thing we left outside for a while.',
  fin_temp_restore3: 'Let us bring it back first.',
  fin_memory_restore: 'Restore temporarily sealed anchor',
  fin_restore_board1: 'TEMPORARY ANCHOR RESTORED\nmaintenance_board',
  fin_restore_board2: 'Wait, I put those eyes on it myself?\nI actually scared myself from yesterday.',
  fin_restore_flower1: 'TEMPORARY ANCHOR RESTORED\nwhite_flower',
  fin_restore_flower2: 'I remember now.\nIt should not have survived, but it still bloomed.',
  fin_restore_goodnight1: 'TEMPORARY ANCHOR RESTORED\ngoodnight',
  fin_restore_goodnight2: 'So that was the phrase.\nNo wonder every time we disconnected, I felt as though something was still missing.',
  ch2_observer_echo: 'Give one back to them.',
  ch5b_echo_record1: 'There was one more line at the end of the record.',
  ch5b_echo_record2: '“It can see every transmission, but not what you remember.”',
  bad_16: '[OBSERVER-01]\nREBOOT · Next access number: 08\nLINK · Current communications and mission state cleared',
  bad_title_overwrite: 'SEVENTH REBOOT → EIGHTH REBOOT',
};

const choices = {
  ch5a_protocol_detail_choice__0: '[I understand. Continue.]',
  ch5a_protocol_detail_choice__1: '[Open the complete engineering record.]',
  ch5b_signature_detail_choice__0: '[I understand. Continue.]',
  ch5b_signature_detail_choice__1: '[Why did it have to be you?]',
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
