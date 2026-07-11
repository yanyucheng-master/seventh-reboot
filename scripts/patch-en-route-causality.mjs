/**
 * Patch en-US story.json for route-causality / NL polish update nodes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const enPath = path.join(root, 'src/i18n/locales/en-US/story.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const patches = {
  ch5a_vids_compare_file: {
    content: `Six Mission Failures / Cross-check||RECORD RANGE · LOOP-01 to LOOP-06
SHARED COORDINATE · Planned route / Silent Sector S-7 phase-resonance zone
SHARED PRECURSOR · Ship-clock drift / hidden-core load surge / navigation continuity signature rewritten
LOOP-01 · Propulsion fails first / engine detonation
LOOP-02 · Power grid fails first / shipwide blackout
LOOP-03 · Life-support & medical fail first / unknown infection
LOOP-04 · Control systems fail first / automation runaway
LOOP-05 · Hull reference fails first / structural breakup
LOOP-06 · Emergency course correction submitted / judged mission deviation / protective rollback initiated
JUDGMENT · Six mission failures share one phase-resonance event; they are not six unrelated accidents
NOTE · Failure is not the same as six complete hull losses`,
  },
  ch5a_vids_compare1: { content: 'At first I thought they were five different accidents.' },
  ch5a_vids_compare2: { content: 'Stacked together, though, every record starts from the same coordinates.' },
  ch5a_vids_compare3: { content: 'Engines, power, environment, control, hull — only the first thing to fail changes.' },
  ch5a_vids_compare4: { content: 'The planned route cuts through a phase-resonance zone.' },
  ch5a_vids_compare5: { content: 'If we keep flying the original plan, the accident will find us sooner or later.' },
  ch5a_route_record1: {
    content: `LOOP-06 / Emergency Course Correction Log||PLANNED ROUTE · Through S-7 phase-resonance zone
EMERGENCY CORRECTION · Submitted
PURPOSE · Divert around the resonance zone
SEVENTH PROTOCOL JUDGMENT · Deviation from assigned mission route
RESULT · Protective rollback order submitted
NEW ROUTE WRITTEN TO STABLE PHASE ANCHOR · Incomplete`,
  },
  ch5a_route_reveal1: { content: 'The sixth me already found a way around — and really did change course.' },
  ch5a_route_reveal2: { content: 'But the Seventh Protocol judged the diversion as mission failure.' },
  ch5a_route_reveal3: { content: 'The new route never made it into the anchor. The phase core pulled everything back.' },
  ch5a_route_reveal4: { content: 'So when I woke this time, I was still on the old route.' },
  FINALE_DECISION_END: {
    content: `External memory index release confirmed
Current navigator emergency course correction submitted
New route target: divert around S-7 phase-resonance zone
Current navigator shutdown authorization submitted
Memory-anchor return prepared`,
  },
  bad_0: {
    content: `Seventh Protocol shutdown requires current-navigator authorization and external-index release together
Observer-01 holds no protocol control authority
Emergency course correction was submitted, but no stable mission state was written
While the external index remains sealed, shutdown cannot proceed
Incomplete result: the diversion is judged mission deviation, and the planned-route state will be restored`,
  },
  bad_3a: { content: 'Incomplete diversion judged as mission deviation' },
  bad_3b: { content: 'Planned-route restoration command issued' },
  bad_3c: { content: 'Seventh Protocol submits protective rollback to the local phase core' },
  bad_3d: { content: 'New route write failed\nLocal phase field preparing to unfold' },
  bad_8a: { content: 'You know you never controlled the Seventh Protocol.' },
  bad_8b: { content: 'And you never received any authority.' },
  bad_8c: { content: 'You only failed to help her finish the diversion.' },
  bad_8d: { content: 'Closing it would have taken one more step.' },
  bad_8e0: { content: 'The protocol and the navigator never submitted a new route.' },
  bad_8e1: { content: 'Or the diversion was judged as deviation.' },
  bad_8e2: { content: 'Then everything snapped back to the old anchor.' },
  bad_8g: { content: "I'm just a fragment that couldn't divert in time." },
  bad_8h: { content: "Maybe that's me. Maybe that's this cycle." },
  ch5a_protocol4: { content: 'The Seventh Protocol was only a failsafe from the start.' },
  ch5a_protocol4b: { content: "It doesn't reverse time by itself." },
  ch5a_protocol5: { content: "It hides in the core's control layer and decides when to roll back." },
  ch5a_protocol6: { content: 'As soon as the system decides Aurora can no longer be saved' },
  ch5a_protocol7: { content: 'it sends a rollback order to the phase core.' },
  ch5a_protocol7b: { content: 'Then the core releases its charge and spreads the phase field.' },
  ch5a_protocol7c: { content: 'It locks onto the nearest stable anchor.' },
  ch5a_protocol7d: { content: 'Then it pulls us and the whole ship back to that state.' },
  ch5a_protocol7e: { content: "The outside universe doesn't go with it." },
  ch5a_protocol7f: { content: 'The phase field only wraps Aurora and this local mission zone.' },
  ch5a_protocol7g: { content: 'People and events beyond the field are never rewritten.' },
  ch5a_protocol8: { content: 'The record spells it out.' },
  ch5a_core_reveal3: { content: "That hidden package has always nested inside the public core's structure." },
  ch5a_core_choice_c2: { content: 'When did it start locking us — when the Seventh Protocol said so?' },
  ch5a_fut10: { content: "I can't get through." },
  ch5b_file18c: { content: "Last cycle's flower didn't survive to now." },
  ch5b_file18d: { content: 'After every rollback, the same anomaly begins again.' },
  ch5b_file18e: { content: 'So each cycle grows a new one.' },
  ch5b_file18f: { content: "It didn't live through six times." },
  ch5b_file18g: { content: "It only bloomed six times where it shouldn't." },
  ch5b_file18h: { content: 'Not once did it fail to appear.' },
  ch5b_summary1: { content: 'I finally see it now.' },
  ch5b_summary2: { content: "Those six weren't six unrelated accidents." },
  ch5b_summary3: { content: 'They all begin on the same stretch of route.' },
  ch5b_summary4: { content: 'Every time, we fly into the same phase-resonance zone.' },
  ch5b_summary5: { content: 'The sixth me already tried to divert.' },
  ch5b_summary6: { content: 'But the protocol treated the off-course turn as mission failure and dragged the whole ship back to the old anchor.' },
  ch5b_summary7: { content: 'This time, shutting the protocol alone is not enough.' },
  ch5b_summary8: { content: 'I have to take Aurora off that route first.' },
  ch5b_summary_choice_a1: { content: 'Yes.' },
  ch5b_summary_choice_a2: { content: "The new route has to stay, and the protocol can't pull us back again." },
  ch5b_summary_choice_b1: { content: 'It will judge the diversion as mission deviation.' },
  ch5b_summary_choice_b2: { content: 'Then it will restart the rollback and send us back to the old route.' },
  ch5b_summary_choice_c2: { content: "But I know we can't take the old path again." },
  ch5b_fin3: {
    choices: {
      ch5b_fin3__0: '【Release the index, keep the new route, and shut the protocol.】',
      ch5b_fin3__1: '【Refuse to release the external index.】',
    },
  },
  ch5b_summary_choice: {
    choices: {
      ch5b_summary_choice__0: '【So we divert first, then shut the protocol?】',
      ch5b_summary_choice__1: '【What if we only divert?】',
      ch5b_summary_choice__2: '【Are you really ready to leave?】',
    },
  },
  ch5b_fin_lastline: {
    content: `Last line:
Release the external memory index, confirm the current navigator's emergency course correction, terminate the Seventh Protocol, and cancel phase-core rollback standby?`,
  },
  fin_1: { content: 'Emergency course correction confirmed' },
  fin_2: {
    content: `Current navigator: Nova Arlen
External index: Observer-01
New route: divert around S-7 phase-resonance zone`,
  },
  fin_3: { content: 'Unlocking the planned-route lock, shutting the Seventh Protocol, and canceling phase-core rollback standby…' },
  fin_3a: {
    content: `Emergency course correction: waiting to write into current mission state
After Seventh Protocol shutdown, navigator Nova Arlen survival stability: unknown
Memory-return integrity: depends on memory-anchor completeness
Maintaining the protocol will restore the planned route and run another local rollback`,
  },
  fin_term3: {
    content: `Emergency course correction confirmed
Planned-route lock released
Aurora is diverting around the S-7 phase-resonance zone
Seventh Protocol shut down
Phase core unanchored and reduced to ordinary navigation stability mode
New route status: stable
Original shipboard communication record for this cycle: unrecoverable`,
  },
  normal_4b: {
    content: `Emergency course correction confirmed
Aurora is diverting around the S-7 phase-resonance zone
New route status: stable`,
  },
  fin_after_what2: {
    content: 'Aurora will follow the new route around the resonance zone and will not be pulled back to the old record point.',
  },
  ch5b_fin2: {
    content: `SEVENTH_REBOOT||Complete primary loops: 6
Current loop: 7
Accumulated phase residual across six primary loops: 6412 state-difference records
Failure count: 6 (mission failures — not six complete hull losses)
Shared failure coordinates: planned route / Silent Sector S-7 phase-resonance zone
Shared root cause: hidden phase core resonating with local spacetime
Accident variance: propulsion / power / environment / control / hull systems fail first in turn
Loop 06: emergency course correction submitted
Loop 06 failure cause: route deviation judged as mission failure by the Seventh Protocol; protective rollback overwrote the new route
Loop 07 survival condition: divert around the resonance zone first, then terminate the Seventh Protocol and cancel phase-core rollback standby
Public registry device: Deep-Space Navigation Stability Core
Actual executive device: Local Phase-Anchor Core
Control program: Seventh Protocol
Operating condition: low-disturbance spacetime in the Silent Sector
Rollback reference: most recent stable phase anchor
Rollback scope: Aurora local mission state (objects outside the ship unaffected)
Exterior realtime: unaffected by rollback
Link-bound memory: sealed when the channel closes
Ordinary crew memory retention: none
Pre-mission crew awareness: none
Anomalous residual subjects: Nova Arlen / Observer-01
Shutdown result: write new route into current mission state / release external memory index / cancel phase-core rollback standby
Sync effect: saved anchors returned to Nova; index unbound from the player
Memory-return integrity: depends on memory-anchor completeness
Post-shutdown navigator Nova Arlen survival stability: unknown
Current status: planned-route accident countdown and protocol rollback countdown running together
If shutdown handshake incomplete: new route judged invalid; Seventh Protocol orders the phase core to restore planned-route state
Final shutdown conditions:
Current navigator authorization: Nova Arlen
Emergency course correction: divert around S-7 phase-resonance zone
External memory index release: Observer-01
Note: Observer-01 holds no protocol control authority and only participates as the handshake party for index release`,
  },
};

let count = 0;
for (const [id, patch] of Object.entries(patches)) {
  const cur = en.nodes[id] ?? {};
  const next = { ...cur };
  if (patch.content !== undefined) next.content = patch.content;
  if (patch.choices) next.choices = { ...(cur.choices ?? {}), ...patch.choices };
  en.nodes[id] = next;
  count += 1;
}

fs.writeFileSync(enPath, `${JSON.stringify(en, null, 2)}\n`, 'utf8');
console.log(`Patched ${count} en-US nodes for route-causality update`);
