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
  'CH05A-0217': {
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
  'CH05A-0218': { content: 'At first I thought they were five different accidents.' },
  'CH05A-0219': { content: 'Stacked together, though, every record starts from the same coordinates.' },
  'CH05A-0220': { content: 'Engines, power, environment, control, hull — only the first thing to fail changes.' },
  'CH05A-0221': { content: 'The planned route cuts through a phase-resonance zone.' },
  'CH05A-0222': { content: 'If we keep flying the original plan, the accident will find us sooner or later.' },
  'CH05A-0248': {
    content: `LOOP-06 / Emergency Course Correction Log||PLANNED ROUTE · Through S-7 phase-resonance zone
EMERGENCY CORRECTION · Submitted
PURPOSE · Divert around the resonance zone
SEVENTH PROTOCOL JUDGMENT · Deviation from assigned mission route
RESULT · Protective rollback order submitted
NEW ROUTE WRITTEN TO STABLE PHASE ANCHOR · Incomplete`,
  },
  'CH05A-0249': { content: 'The sixth me already found a way around — and really did change course.' },
  'CH05A-0250': { content: 'But the Seventh Protocol judged the diversion as mission failure.' },
  'CH05A-0251': { content: 'The new route never made it into the anchor. The phase core pulled everything back.' },
  'CH05A-0252': { content: 'So when I woke this time, I was still on the old route.' },
  'CH05B-0294': {
    content: `External memory index release confirmed
Current navigator emergency course correction submitted
New route target: divert around S-7 phase-resonance zone
Current navigator shutdown authorization submitted
Memory-anchor return prepared`,
  },
  'END-B-0002': {
    content: `Seventh Protocol shutdown requires current-navigator authorization and external-index release together
Observer-01 holds no protocol control authority
Emergency course correction was submitted, but no stable mission state was written
While the external index remains sealed, shutdown cannot proceed
Incomplete result: the diversion is judged mission deviation, and the planned-route state will be restored`,
  },
  'END-B-0006': { content: 'Incomplete diversion judged as mission deviation' },
  'END-B-0007': { content: 'Planned-route restoration command issued' },
  'END-B-0008': { content: 'Seventh Protocol submits protective rollback to the local phase core' },
  'END-B-0009': { content: 'New route write failed\nLocal phase field preparing to unfold' },
  'END-B-0015': { content: 'You know you never controlled the Seventh Protocol.' },
  'END-B-0016': { content: 'And you never received any authority.' },
  'END-B-0017': { content: 'You only failed to help her finish the diversion.' },
  'END-B-0018': { content: 'Closing it would have taken one more step.' },
  'END-B-0019': { content: 'The protocol and the navigator never submitted a new route.' },
  'END-B-0020': { content: 'Or the diversion was judged as deviation.' },
  'END-B-0021': { content: 'Then everything snapped back to the old anchor.' },
  'END-B-0027': { content: "I'm just a fragment that couldn't divert in time." },
  'END-B-0028': { content: "Maybe that's me. Maybe that's this cycle." },
  'CH05A-0042': { content: 'The Seventh Protocol was only a failsafe from the start.' },
  'CH05A-0043': { content: "It doesn't reverse time by itself." },
  'CH05A-0044': { content: "It hides in the core's control layer and decides when to roll back." },
  'CH05A-0045': { content: 'As soon as the system decides Aurora can no longer be saved' },
  'CH05A-0046': { content: 'it sends a rollback order to the phase core.' },
  'CH05A-0047': { content: 'Then the core releases its charge and spreads the phase field.' },
  'CH05A-0048': { content: 'It locks onto the nearest stable anchor.' },
  'CH05A-0049': { content: 'Then it pulls us and the whole ship back to that state.' },
  'CH05A-0050': { content: "The outside universe doesn't go with it." },
  'CH05A-0051': { content: 'The phase field only wraps Aurora and this local mission zone.' },
  'CH05A-0052': { content: 'People and events beyond the field are never rewritten.' },
  'CH05A-0060': { content: 'The record spells it out.' },
  'CH05A-0031': { content: "That hidden package has always nested inside the public core's structure." },
  'CH05A-0041': { content: 'When did it start locking us — when the Seventh Protocol said so?' },
  'CH05A-0260': { content: "I can't get through." },
  'CH05B-0128': { content: "Last cycle's flower didn't survive to now." },
  'CH05B-0129': { content: 'After every rollback, the same anomaly begins again.' },
  'CH05B-0130': { content: 'So each cycle grows a new one.' },
  'CH05B-0131': { content: "It didn't live through six times." },
  'CH05B-0132': { content: "It only bloomed six times where it shouldn't." },
  'CH05B-0133': { content: 'Not once did it fail to appear.' },
  'CH05B-0277': { content: 'I finally see it now.' },
  'CH05B-0278': { content: "Those six weren't six unrelated accidents." },
  'CH05B-0279': { content: 'They all begin on the same stretch of route.' },
  'CH05B-0280': { content: 'Every time, we fly into the same phase-resonance zone.' },
  'CH05B-0281': { content: 'The sixth me already tried to divert.' },
  'CH05B-0282': { content: 'But the protocol treated the off-course turn as mission failure and dragged the whole ship back to the old anchor.' },
  'CH05B-0283': { content: 'This time, shutting the protocol alone is not enough.' },
  'CH05B-0284': { content: 'I have to take Aurora off that route first.' },
  'CH05B-0286': { content: 'Yes.' },
  'CH05B-0287': { content: "The new route has to stay, and the protocol can't pull us back again." },
  'CH05B-0288': { content: 'It will judge the diversion as mission deviation.' },
  'CH05B-0289': { content: 'Then it will restart the rollback and send us back to the old route.' },
  'CH05B-0291': { content: "But I know we can't take the old path again." },
  'CH05B-0293': {
    choices: {
      'CH05B-0293__0': '【Release the index, keep the new route, and shut the protocol.】',
      'CH05B-0293__1': '【Refuse to release the external index.】',
    },
  },
  'CH05B-0285': {
    choices: {
      'CH05B-0285__0': '【So we divert first, then shut the protocol?】',
      'CH05B-0285__1': '【What if we only divert?】',
      'CH05B-0285__2': '【Are you really ready to leave?】',
    },
  },
  'CH05B-0292': {
    content: `Last line:
Release the external memory index, confirm the current navigator's emergency course correction, terminate the Seventh Protocol, and cancel phase-core rollback standby?`,
  },
  'FIN-0003': { content: 'Emergency course correction confirmed' },
  'FIN-0004': {
    content: `Current navigator: Nova Arlen
External index: Observer-01
New route: divert around S-7 phase-resonance zone`,
  },
  'FIN-0005': { content: 'Unlocking the planned-route lock, shutting the Seventh Protocol, and canceling phase-core rollback standby…' },
  'FIN-0006': {
    content: `Emergency course correction: waiting to write into current mission state
After Seventh Protocol shutdown, navigator Nova Arlen survival stability: unknown
Memory-return integrity: depends on memory-anchor completeness
Maintaining the protocol will restore the planned route and run another local rollback`,
  },
  'FIN-0308': {
    content: `Emergency course correction confirmed
Planned-route lock released
Aurora is diverting around the S-7 phase-resonance zone
Seventh Protocol shut down
Phase core unanchored and reduced to ordinary navigation stability mode
New route status: stable
Original shipboard communication record for this cycle: unrecoverable`,
  },
  'END-N-0007': {
    content: `Emergency course correction confirmed
Aurora is diverting around the S-7 phase-resonance zone
New route status: stable`,
  },
  'FIN-0126': {
    content: 'Aurora will follow the new route around the resonance zone and will not be pulled back to the old record point.',
  },
  'CH05B-0276': {
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
