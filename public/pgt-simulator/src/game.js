/**
 * OliveWings PGT Simulator — game.js
 * Balli Fatta Rassi: Progressive Group Task Training Game
 * ──────────────────────────────────────────────────────
 * Phases:   3 (Setup, Execution, Recovery)
 * Questions: 4 per phase = 12 total
 * Timer:    5 min per phase (300s)
 * OLQs:     Logic & Reasoning · Grit & Stamina · Influence
 */

// ════════════════════════════════════════════════════════
//  CONTENT DATABASE
// ════════════════════════════════════════════════════════

const PHASES = [
  /* ────────── PHASE 1: SETUP & RULES ────────── */
  {
    id: 1,
    title: 'Phase 1 — Setup & Rules',
    sub: 'Understand the equipment, rules, and initial plan.',
    olq: 'logic',
    equipment: [
      { label: 'Balli (6ft bamboo pole)', id: 'balli' },
      { label: 'Rassi (20m rope)', id: 'rassi' },
      { label: 'Plank (8ft)', id: 'plank' },
      { label: 'Blue Pillar ×2', id: 'pillar' },
      { label: 'Red Stump (OOB)', id: 'redstump' },
    ],
    visual: 'setup',
    questions: [
      {
        scenario: 'Your team arrives at the PGT obstacle. A 22-foot sand pit separates the <strong>Start Bank</strong> from the <strong>End Bank</strong>. You have: one bamboo pole (balli, 6ft), a 20m rope (rassi), one plank (8ft), two blue pillars on each bank, and one red-tipped stump in the centre. A heavy drum (the "load") must reach the other side.',
        twist: null,
        q: 'Before touching any equipment, what is the FIRST correct action as group leader?',
        choices: [
          {
            text: 'Call the group together. Brief everyone on the task rules: no OOB contact, explain the role of balli fatta rassi, and assign roles (anchor, stabiliser, load-carrier, guide).',
            correct: true,
            fb: 'Correct. A GTO assessor awards marks for pre-task briefing, clear role assignment, and demonstrating knowledge of the balli-fatta-rassi principle before execution begins.',
            olq_bonus: { logic: 2, grit: 1, influence: 1 }
          },
          {
            text: 'Immediately pick up the balli and begin tying the rassi to span the first pillar.',
            correct: false,
            fb: 'Acting before briefing the team is an Influence failure. Without role clarity, the group works at cross-purposes. Assessors penalise leaders who skip the planning stage.',
            olq_bonus: { logic: 0, grit: 1, influence: 0 }
          },
          {
            text: 'Send the largest team member into the pit to physically move the drum.',
            correct: false,
            fb: 'This is an immediate OOB violation — touching the sand pit disqualifies the task. Understanding rules before action is the most basic GTO requirement.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Ask the GTO officer to clarify the rules again before starting.',
            correct: false,
            fb: 'Requesting re-briefing when rules have already been given signals a lack of preparation. A leader is expected to internalise the rules and brief their own team.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          }
        ]
      },
      {
        scenario: 'You\'ve briefed the team. The balli (bamboo pole) must now be lashed with the rassi (rope) in the <strong>"balli fatta rassi"</strong> configuration — the pole tied at both ends of the rope to act as a horizontal load-carrier spanning the gap.',
        twist: null,
        q: 'Which configuration correctly describes balli fatta rassi for the PGT?',
        choices: [
          {
            text: 'The bamboo pole is tied at its centre to one end of the rope. The other end of the rope is held by a team member on the starting bank as a pendulum swing.',
            correct: false,
            fb: 'A centre-tied pendulum is unstable and incorrect. The balli fatta rassi requires both rope ends secured so the pole can bear and transfer load horizontally.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'The rope is threaded through the hollow of the bamboo pole to form a rigid support beam locked to both pillars.',
            correct: false,
            fb: 'Standard bamboo poles used in PGT are not hollow tubes for threading rope. This describes a different engineering concept — not the balli fatta rassi technique.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'The rope is tied to one end of the bamboo (balli). The balli is extended across the gap while a team member on each bank holds their respective rope-end, keeping the balli level and under tension.',
            correct: true,
            fb: 'Correct! This is the authentic balli fatta rassi configuration. The balli bridges the gap; the rassi provides tension and control from both banks. The load travels along this axis.',
            olq_bonus: { logic: 3, grit: 1, influence: 1 }
          },
          {
            text: 'The plank is placed flat across the gap and the balli is used as a rolling pin underneath the drum to reduce friction.',
            correct: false,
            fb: 'The plank spanning the gap without structural support on the blue pillars is invalid. The balli\'s function is load-bridging, not friction reduction.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          }
        ]
      },
      {
        scenario: 'You\'ve established the balli fatta rassi setup. Now you need to position the plank. The blue pillars are on <strong>each bank edge</strong>. The red-tipped stump is in the <strong>centre of the pit</strong> — it is OUT OF BOUNDS for any equipment.',
        twist: null,
        q: 'How should the plank be used in conjunction with the balli fatta rassi?',
        choices: [
          {
            text: 'Lay the plank from the starting bank to the far blue pillar, resting it on top of the balli for extra structural support.',
            correct: false,
            fb: 'The balli is a load-carrier rope-system, not a rigid platform. Resting a plank on it without pillar support on both sides creates a dangerous unsupported cantilever.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Rest the plank between the two near-side blue pillars as a loading ramp, then transfer the drum onto the balli fatta rassi for the crossing.',
            correct: true,
            fb: 'Correct engineering. The plank acts as a loading bridge on the bank, placing the drum onto the balli-rassi system without OOB contact. This is standard PGT technique.',
            olq_bonus: { logic: 3, grit: 1, influence: 0 }
          },
          {
            text: 'Balance the plank on the red-tipped stump to create a midpoint support.',
            correct: false,
            fb: 'The red stump is explicitly Out of Bounds for equipment. Resting the plank here causes immediate task disqualification.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Store the plank on the bank as a reserve — use only balli and rassi for the entire crossing.',
            correct: false,
            fb: 'Ignoring available equipment is a Logic failure. The plank serves a critical loading function. Wasting resources reduces team efficiency, which GTO assessors note.',
            olq_bonus: { logic: 0, grit: 1, influence: 0 }
          }
        ]
      },
      {
        scenario: 'Team roles need to be assigned before execution. You have 6 members including yourself. The roles are: <strong>Anchor</strong> (holds rassi tension from starting bank), <strong>Guide</strong> (controls far-end rassi), <strong>Load Carrier</strong> (manages drum movement), and <strong>Stabilisers ×2</strong> (prevent sway).',
        twist: '⚡ Twist: Your strongest member reports a back spasm. They cannot carry the load.',
        q: 'How do you re-assign roles with the constraint?',
        choices: [
          {
            text: 'Push through — assign the injured member as load carrier anyway. The mission takes priority.',
            correct: false,
            fb: 'Forcing an injured subordinate into a high-strain role risks further injury and mission failure. The GTO specifically tests social adaptability — ignoring health signals is a clear OLQ failure.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Remove the injured member from the task entirely. Reassign: you become Load Carrier, two members become Anchors (one each on balli ends), two become Stabilisers.',
            correct: false,
            fb: 'Partially correct — but removing the member without giving them a useful role damages morale. Also, a commander leaving command position is poor leadership in a 6-person task.',
            olq_bonus: { logic: 1, grit: 1, influence: 0 }
          },
          {
            text: 'Reassign the injured member to Anchor (low-strain, uses arms only). Promote the next strongest to Load Carrier. Keep your command position to coordinate.',
            correct: true,
            fb: 'Excellent adaptability. The injured member is kept engaged in a meaningful low-strain role (morale preserved). You maintain command. This is textbook OLQ — flexible planning, inclusive leadership.',
            olq_bonus: { logic: 2, grit: 2, influence: 2 }
          },
          {
            text: 'Halt the task and request a replacement team member from the GTO.',
            correct: false,
            fb: 'PGT does not allow substitutions mid-task. Requesting one shows poor understanding of the exercise format and wastes critical time.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          }
        ]
      }
    ]
  },

  /* ────────── PHASE 2: EXECUTION ────────── */
  {
    id: 2,
    title: 'Phase 2 — Execution',
    sub: 'Move the load across. Maintain discipline under pressure.',
    olq: 'grit',
    equipment: [
      { label: 'Balli (deployed)', id: 'balli' },
      { label: 'Rassi (under tension)', id: 'rassi' },
      { label: 'Plank (loading ramp)', id: 'plank' },
      { label: 'Load (drum)', id: 'drum' },
    ],
    visual: 'execution',
    questions: [
      {
        scenario: 'Execution begins. The balli fatta rassi is set. The drum is on the loading plank. Team is in position. The rassi is under tension. You give the command to begin the transfer. Halfway through, the <strong>balli starts to sag</strong> toward the pit — load weight is causing the rope tension to drop on the far end.',
        twist: null,
        q: 'What is your immediate command?',
        choices: [
          {
            text: 'Call "HALT!" — instruct the far-side Guide to increase rope tension by stepping back and re-gripping before proceeding.',
            correct: true,
            fb: 'Decisive crisis control. Halting movement when the structure is unstable prevents OOB contact. Adjusting rassi tension from the far bank is the correct technical fix. GTO: full marks for Grit and Logic.',
            olq_bonus: { logic: 2, grit: 3, influence: 1 }
          },
          {
            text: 'Tell the Load Carrier to push the drum across faster before the balli sags further.',
            correct: false,
            fb: 'Speed under a failing structure worsens the problem. Rushing into instability with a heavy load guarantees an OOB violation or dropped load — immediate task failure.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Step into the pit yourself to manually support the balli from below.',
            correct: false,
            fb: 'Entering the Out-of-Bounds zone — even as commander — immediately disqualifies the task. No exception applies, regardless of intent.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Pull the drum back to the start and reassess the entire setup.',
            correct: false,
            fb: 'Retreating is overly cautious when a small adjustment (retightening rassi) can solve the issue. A good leader makes the minimal intervention needed, not the maximal one.',
            olq_bonus: { logic: 0, grit: 1, influence: 0 }
          }
        ]
      },
      {
        scenario: 'Tension is restored. The drum is three-quarters across. Suddenly a stabiliser team member <strong>loses grip on the balli</strong> — the pole tilts at a 20° angle and the drum slides to one side.',
        twist: '⚡ Twist: 2 minutes remain on the phase timer.',
        q: 'You have 2 minutes and the drum is slipping. What do you do?',
        choices: [
          {
            text: 'Yell at the stabiliser who dropped the balli. This must not happen again.',
            correct: false,
            fb: 'Demoralising a team member under time pressure destroys group cohesion. The GTO assessor scores Influence heavily here — anger is the opposite of effective leadership.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Stay calm. Command: "Hold steady — all stabilisers re-grip now." Direct the Load Carrier to slow the drum movement. Re-tilt the balli level before continuing.',
            correct: true,
            fb: 'Composure under time pressure with decisive micro-commands is what Grit & Stamina measures. The drum is caught, balli is re-levelled, and the task proceeds. Calm voice = confident team.',
            olq_bonus: { logic: 2, grit: 3, influence: 2 }
          },
          {
            text: 'Take over the stabiliser role yourself — physically grab the balli to fix the tilt.',
            correct: false,
            fb: 'Abandoning command position disrupts team coordination. Even well-intentioned, a commander who micromanages physical tasks loses situational awareness of the whole group.',
            olq_bonus: { logic: 0, grit: 1, influence: 0 }
          },
          {
            text: 'Let the drum reach the end bank on its own momentum — it\'s close enough.',
            correct: false,
            fb: 'An unsupported tilting drum crossing a gap will slide off the balli. "Close enough" thinking is a logic failure that causes task failure in real PGT conditions.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          }
        ]
      },
      {
        scenario: 'The drum reaches the far bank. The transfer was a success. Now the team must physically cross the gap themselves — using the plank, pillar grips, and balli-rassi as guide rails. No one may touch the sand.',
        twist: null,
        q: 'In what order should team members cross?',
        choices: [
          {
            text: 'Lightest member first (tests the bridge), then heaviest, then remaining members, commander crosses last.',
            correct: true,
            fb: 'Correct crossing protocol. The lightest tests structural integrity, the heaviest crosses when the bridge is confirmed safe, and the commander crosses last — maintaining command until all subordinates are safe. Classic OLQ leadership.',
            olq_bonus: { logic: 2, grit: 2, influence: 2 }
          },
          {
            text: 'Commander crosses first to demonstrate confidence and leadership.',
            correct: false,
            fb: 'In a crossing situation, a commander going first abandons monitoring. If a member falls, no one is coordinating. "Lead from the front" in GTO means decision leadership, not necessarily first-mover.',
            olq_bonus: { logic: 0, grit: 1, influence: 0 }
          },
          {
            text: 'All members cross simultaneously to save time.',
            correct: false,
            fb: 'Simultaneous crossing overloads the structure with combined weight. The balli fatta rassi is designed for sequential load — not all-at-once. This causes structural collapse risk.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Injured member crosses first — they need more time and support.',
            correct: false,
            fb: 'While compassionate, placing a limited-mobility member first on an untested crossing is dangerous. The correct protocol is lightest/tester first, injured members in the supported middle.',
            olq_bonus: { logic: 0, grit: 0, influence: 1 }
          }
        ]
      },
      {
        scenario: 'Three members have crossed safely. The plank begins to wobble. The fourth member — a junior — freezes midway, gripping the balli, <strong>refusing to move</strong> due to fear. 45 seconds remain on the timer.',
        twist: '⚡ Twist: Timer at 45 seconds. Member frozen on the bridge.',
        q: 'How do you handle the frozen team member under this time pressure?',
        choices: [
          {
            text: 'Shout "Just go! You\'re wasting time!" to snap them out of it.',
            correct: false,
            fb: 'Fear response cannot be overridden by aggression. Shouting freezes the person further and may cause them to panic and fall. This is a critical Influence failure — zero score.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Stay calm. Use their name. Give one clear instruction: "Look at me. Move your left hand forward first. I\'ve got the rope." Guide step by step.',
            correct: true,
            fb: 'This is elite-level influence. Personalised, calm, step-by-step guidance breaks fear paralysis. Using their name and making physical reassurance ("I\'ve got the rope") builds trust instantly. Maximum Influence score.',
            olq_bonus: { logic: 1, grit: 2, influence: 3 }
          },
          {
            text: 'Ask the members on the far bank to pull the member across by the rope.',
            correct: false,
            fb: 'Forcing a panicking person with rope tension can cause them to lose grip entirely. The solution must be psychological — not physical force.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Leave them for now. Get the remaining members across first, then come back for the frozen member.',
            correct: false,
            fb: 'Leaving a team member alone mid-structure is abandonment. It also violates group safety — if the timer expires, the member is still stranded.',
            olq_bonus: { logic: 0, grit: 1, influence: 0 }
          }
        ]
      }
    ]
  },

  /* ────────── PHASE 3: RECOVERY & DEBRIEF ────────── */
  {
    id: 3,
    title: 'Phase 3 — Recovery & Command',
    sub: 'Lead recovery when the plan changes mid-mission.',
    olq: 'influence',
    equipment: [
      { label: 'Balli (secondary use)', id: 'balli' },
      { label: 'Rassi (re-rigged)', id: 'rassi' },
      { label: 'Plank (stowed)', id: 'plank' },
      { label: 'Load (secured)', id: 'drum' },
    ],
    visual: 'recovery',
    questions: [
      {
        scenario: 'Task complete — almost. The GTO officer calls: <strong>"Rope snapped on the re-cross. Restart Phase 3."</strong> Simulated failure. Your team must engineer a solution using only the balli (pole), half the rassi (10m remaining), and the plank. No extra equipment.',
        twist: null,
        q: 'With half the rope and no second chance, what is your revised bridging plan?',
        choices: [
          {
            text: 'Use the balli as a rigid horizontal bridge between the two blue pillars. Lash it at both ends with the 10m rassi split into two 5m sections. Use the plank as a walkway on top.',
            correct: true,
            fb: 'Correct improvisation. Splitting the rassi into two lashing sections creates a stable balli bridge. The plank layered on top gives the load-crossing surface. Resourceful Engineering = Logic OLQ.',
            olq_bonus: { logic: 3, grit: 2, influence: 1 }
          },
          {
            text: 'Tie the full 10m rassi to one pillar only and swing the load across.',
            correct: false,
            fb: 'A single-pillar swing with 10m rope cannot guarantee a controlled landing. Uncontrolled momentum with the load is an OOB risk and unsafe. Rejected.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Declare the task impossible with reduced resources and request a GTO intervention.',
            correct: false,
            fb: 'Declaring impossibility when the task is solvable is a Grit failure. GTO assessors use exactly these "reduced resource" scenarios to test creative problem-solving under stress.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Ask team members to form a human chain across the pit to pass the load by hand.',
            correct: false,
            fb: 'Human contact with the OOB pit zone — even leaning into it — violates the core rule. Equipment must bridge the gap; human bodies cannot span the OOB area.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          }
        ]
      },
      {
        scenario: 'The revised plan is underway. A senior team member (who was not the commander) begins issuing his own orders to the Stabilisers, <strong>contradicting your commands</strong>. The group is confused — two people are now giving different instructions.',
        twist: '⚡ Twist: Contradicting commands causing team confusion mid-crossing.',
        q: 'You are the Commander. How do you restore command clarity?',
        choices: [
          {
            text: 'Ignore the team member and continue giving your own commands louder.',
            correct: false,
            fb: 'Competing loudness escalates confusion. When two voices shout simultaneously, teams freeze. Volume is not command. This is a failure of command technique.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Immediately say: "Stand down — all instructions through me." Calmly brief the team: "I am the commander. [Name], I need you as my rear anchor. That is your role." Resume.',
            correct: true,
            fb: 'Firm, respectful, and immediate. Reasserting command with role clarity (not aggression) resolves dual-command without humiliating the team member. The GTO assessor awards full Influence marks for exactly this.',
            olq_bonus: { logic: 1, grit: 1, influence: 3 }
          },
          {
            text: 'Argue with the team member to establish who is in charge.',
            correct: false,
            fb: 'Public argument during a live task destroys morale and delays execution. Never debate command authority mid-operation. It is resolved with a single clear statement, not debate.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Let both command streams continue — maybe the team can figure out the best instructions themselves.',
            correct: false,
            fb: 'Abdication of command authority is the worst outcome. A group without a single clear leader is not a team — it\'s a mob. GTO will score this as near-zero on Influence.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          }
        ]
      },
      {
        scenario: 'Command is restored. The team is tired and morale is low after the rope failure and command confusion. The timer shows <strong>90 seconds</strong>. The load still needs to travel the final 6 feet to the End Bank.',
        twist: null,
        q: 'How do you energise the team for the final push?',
        choices: [
          {
            text: 'Say nothing — the team knows what to do. Actions speak louder than words.',
            correct: false,
            fb: 'Silence in a low-morale, time-pressured environment signals indifference. A commander must verbalise encouragement. Teams need to hear their leader believe in them.',
            olq_bonus: { logic: 0, grit: 1, influence: 0 }
          },
          {
            text: 'Tell the team the exact time remaining and explain consequences if they fail.',
            correct: false,
            fb: 'Announcing the countdown to a demoralised team creates panic, not energy. Threat-based motivation under fatigue causes errors. GTO: poor Influence and Social Adaptability.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Give one firm, positive command: "6 feet. We\'ve done harder. Move on my mark — 3, 2, 1." Execute the final push with full commitment.',
            correct: true,
            fb: 'This is the hallmark of effective operational leadership. Quantify the task (6 feet), validate past effort (we\'ve done harder), give a count (3-2-1). Short, galvanising, actionable. Full Influence score.',
            olq_bonus: { logic: 1, grit: 2, influence: 3 }
          },
          {
            text: 'Offer a reward — tell the team you\'ll buy them tea after the task if they finish.',
            correct: false,
            fb: 'Transactional motivation during a GTO task signals poor leadership character. OLQ assessors look for intrinsic motivation and team spirit — not bribery.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          }
        ]
      },
      {
        scenario: 'Mission accomplished. The GTO officer asks you to debrief your team in 60 seconds before scores are announced. This is the final OLQ evaluation moment.',
        twist: null,
        q: 'What does your debrief cover?',
        choices: [
          {
            text: 'List every mistake made by individual team members so they learn from them.',
            correct: false,
            fb: 'A public blame-list destroys team cohesion and demoralises subordinates. Individual feedback is given privately. Group debrief focuses on team decisions, not personal failure.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Skip debrief — everyone is tired and the task is done.',
            correct: false,
            fb: 'Skipping the debrief is a missed leadership moment. The GTO specifically observes how a commander closes out the mission. The debrief is part of the task assessment.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          },
          {
            text: 'Cover: what went right (balli-rassi setup, crossing discipline), what was adapted (rope failure recovery, frozen member), and acknowledge every member\'s contribution before dismissing.',
            correct: true,
            fb: 'A balanced, forward-looking debrief: celebrate success, name adaptations, acknowledge individuals. This is the full OLQ cycle — logic, grit, and influence in one 60-second moment. Perfect close.',
            olq_bonus: { logic: 2, grit: 1, influence: 3 }
          },
          {
            text: 'Focus only on what you personally did well as commander to show self-awareness.',
            correct: false,
            fb: 'Commander-centric debrief ignores the team. Self-promotion in a group debrief alienates subordinates. The GTO assessor looks for team-first leadership, not individual glory.',
            olq_bonus: { logic: 0, grit: 0, influence: 0 }
          }
        ]
      }
    ]
  }
];

// ════════════════════════════════════════════════════════
//  SVG VISUALS — Obstacle scene per phase
// ════════════════════════════════════════════════════════

const VISUALS = {
  setup: `
<svg viewBox="0 0 300 200" width="300" height="200" xmlns="http://www.w3.org/2000/svg">
  <!-- Sky -->
  <rect width="300" height="200" fill="#0d0f0b"/>
  <!-- Labels -->
  <text x="30" y="20" font-family="Space Mono,monospace" font-size="7" fill="#4a5424">START BANK</text>
  <text x="210" y="20" font-family="Space Mono,monospace" font-size="7" fill="#4a5424">END BANK</text>
  <!-- Banks -->
  <rect x="0" y="140" width="80" height="60" fill="#1c2016" stroke="#3a4530" stroke-width="0.5"/>
  <rect x="220" y="140" width="80" height="60" fill="#1c2016" stroke="#3a4530" stroke-width="0.5"/>
  <!-- Sand pit -->
  <rect x="80" y="140" width="140" height="60" fill="#2a2510" stroke="#4a4020" stroke-width="0.5"/>
  <text x="150" y="178" font-family="Space Mono,monospace" font-size="6.5" fill="#6a5a20" text-anchor="middle">OUT OF BOUNDS</text>
  <!-- Blue pillars -->
  <rect x="72" y="120" width="10" height="24" fill="#1a4a70" stroke="#3a8fb5" stroke-width="1"/>
  <rect x="218" y="120" width="10" height="24" fill="#1a4a70" stroke="#3a8fb5" stroke-width="1"/>
  <text x="77" y="116" font-family="Space Mono,monospace" font-size="5.5" fill="#3a8fb5" text-anchor="middle">PILLAR</text>
  <text x="223" y="116" font-family="Space Mono,monospace" font-size="5.5" fill="#3a8fb5" text-anchor="middle">PILLAR</text>
  <!-- Red stump centre -->
  <rect x="144" y="130" width="12" height="14" fill="#3a1010" stroke="#c0392b" stroke-width="1"/>
  <rect x="144" y="130" width="12" height="4" fill="#c0392b"/>
  <text x="150" y="126" font-family="Space Mono,monospace" font-size="5" fill="#c0392b" text-anchor="middle">OOB</text>
  <!-- Balli on start bank -->
  <line x1="10" y1="132" x2="70" y2="132" stroke="#a3b85c" stroke-width="3" stroke-linecap="round"/>
  <text x="40" y="128" font-family="Space Mono,monospace" font-size="5.5" fill="#7a8c3e" text-anchor="middle">BALLI</text>
  <!-- Rassi coil -->
  <circle cx="40" cy="148" r="10" fill="none" stroke="#d4922a" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="40" y="163" font-family="Space Mono,monospace" font-size="5" fill="#d4922a" text-anchor="middle">RASSI</text>
  <!-- Drum -->
  <ellipse cx="50" cy="136" rx="8" ry="6" fill="#242b1e" stroke="#7a8c3e" stroke-width="1"/>
  <text x="50" y="140" font-family="Space Mono,monospace" font-size="5" fill="#7a8c3e" text-anchor="middle">LOAD</text>
  <!-- Plank -->
  <rect x="8" y="148" width="50" height="6" fill="#3d2e10" stroke="#7a5520" stroke-width="0.5"/>
  <text x="33" y="160" font-family="Space Mono,monospace" font-size="5" fill="#7a5520" text-anchor="middle">PLANK</text>
</svg>`,


  execution: `
<svg viewBox="0 0 300 200" width="300" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="200" fill="#0d0f0b"/>
  <text x="30" y="20" font-family="Space Mono,monospace" font-size="7" fill="#4a5424">START</text>
  <text x="235" y="20" font-family="Space Mono,monospace" font-size="7" fill="#4a5424">END</text>
  <!-- Banks -->
  <rect x="0" y="140" width="80" height="60" fill="#1c2016" stroke="#3a4530" stroke-width="0.5"/>
  <rect x="220" y="140" width="80" height="60" fill="#1c2016" stroke="#3a4530" stroke-width="0.5"/>
  <!-- Pit -->
  <rect x="80" y="140" width="140" height="60" fill="#2a2510" stroke="#4a4020" stroke-width="0.5"/>
  <!-- Blue pillars -->
  <rect x="72" y="118" width="10" height="26" fill="#1a4a70" stroke="#3a8fb5" stroke-width="1"/>
  <rect x="218" y="118" width="10" height="26" fill="#1a4a70" stroke="#3a8fb5" stroke-width="1"/>
  <!-- Red stump -->
  <rect x="144" y="130" width="12" height="14" fill="#3a1010" stroke="#c0392b" stroke-width="1"/>
  <rect x="144" y="130" width="12" height="4" fill="#c0392b"/>
  <!-- BALLI spanning gap (deployed) -->
  <line x1="77" y1="128" x2="223" y2="128" stroke="#a3b85c" stroke-width="4" stroke-linecap="round"/>
  <text x="150" y="122" font-family="Space Mono,monospace" font-size="5.5" fill="#7a8c3e" text-anchor="middle">BALLI (DEPLOYED)</text>
  <!-- RASSI tensions -->
  <line x1="10" y1="128" x2="77" y2="128" stroke="#d4922a" stroke-width="2" stroke-dasharray="4,2"/>
  <line x1="223" y1="128" x2="290" y2="128" stroke="#d4922a" stroke-width="2" stroke-dasharray="4,2"/>
  <text x="40" y="122" font-family="Space Mono,monospace" font-size="5" fill="#d4922a" text-anchor="middle">RASSI</text>
  <text x="257" y="122" font-family="Space Mono,monospace" font-size="5" fill="#d4922a" text-anchor="middle">RASSI</text>
  <!-- Load in transit -->
  <ellipse cx="155" cy="122" rx="12" ry="9" fill="#1c2016" stroke="#a3b85c" stroke-width="1.5"/>
  <text x="155" y="125" font-family="Space Mono,monospace" font-size="5" fill="#a3b85c" text-anchor="middle">LOAD</text>
  <!-- Team members (stick figures simplified) -->
  <circle cx="25" cy="128" r="5" fill="#4a5424" stroke="#7a8c3e" stroke-width="1"/>
  <text x="25" y="143" font-family="Space Mono,monospace" font-size="4.5" fill="#4a5424" text-anchor="middle">ANCHOR</text>
  <circle cx="265" cy="128" r="5" fill="#4a5424" stroke="#7a8c3e" stroke-width="1"/>
  <text x="265" y="143" font-family="Space Mono,monospace" font-size="4.5" fill="#4a5424" text-anchor="middle">GUIDE</text>
  <!-- Plank on start bank -->
  <rect x="45" y="136" width="30" height="5" fill="#3d2e10" stroke="#7a5520" stroke-width="0.5"/>
  <!-- Status -->
  <rect x="90" y="155" width="120" height="16" rx="1" fill="#1c2016" stroke="#3a4530" stroke-width="0.5"/>
  <text x="150" y="166" font-family="Space Mono,monospace" font-size="5.5" fill="#7a8c3e" text-anchor="middle">⚡ LOAD IN TRANSIT</text>
</svg>`,

  recovery: `
<svg viewBox="0 0 300 200" width="300" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="200" fill="#0d0f0b"/>
  <!-- Banks -->
  <rect x="0" y="140" width="80" height="60" fill="#1c2016" stroke="#3a4530" stroke-width="0.5"/>
  <rect x="220" y="140" width="80" height="60" fill="#1c2016" stroke="#3a4530" stroke-width="0.5"/>
  <!-- Pit -->
  <rect x="80" y="140" width="140" height="60" fill="#2a2510" stroke="#4a4020" stroke-width="0.5"/>
  <text x="150" y="178" font-family="Space Mono,monospace" font-size="6" fill="#6a5a20" text-anchor="middle">OUT OF BOUNDS</text>
  <!-- Blue pillars -->
  <rect x="72" y="118" width="10" height="26" fill="#1a4a70" stroke="#3a8fb5" stroke-width="1"/>
  <rect x="218" y="118" width="10" height="26" fill="#1a4a70" stroke="#3a8fb5" stroke-width="1"/>
  <!-- Red stump -->
  <rect x="144" y="130" width="12" height="14" fill="#3a1010" stroke="#c0392b" stroke-width="1"/>
  <rect x="144" y="130" width="12" height="4" fill="#c0392b"/>
  <!-- Revised balli as rigid bridge on pillars -->
  <line x1="72" y1="125" x2="228" y2="125" stroke="#a3b85c" stroke-width="5" stroke-linecap="square"/>
  <!-- Lashing at pillars -->
  <line x1="72" y1="118" x2="72" y2="144" stroke="#d4922a" stroke-width="2"/>
  <line x1="228" y1="118" x2="228" y2="144" stroke="#d4922a" stroke-width="2"/>
  <text x="60" y="112" font-family="Space Mono,monospace" font-size="5" fill="#d4922a">LASH</text>
  <text x="214" y="112" font-family="Space Mono,monospace" font-size="5" fill="#d4922a">LASH</text>
  <!-- Plank on top of balli -->
  <rect x="72" y="120" width="156" height="5" fill="#3d2e10" stroke="#7a5520" stroke-width="0.5" opacity="0.9"/>
  <text x="150" y="116" font-family="Space Mono,monospace" font-size="5" fill="#7a5520" text-anchor="middle">PLANK WALKWAY</text>
  <!-- Load secured on end bank -->
  <ellipse cx="255" cy="136" rx="12" ry="9" fill="#1c2016" stroke="#2ecc71" stroke-width="1.5"/>
  <text x="255" y="139" font-family="Space Mono,monospace" font-size="5" fill="#2ecc71" text-anchor="middle">LOAD ✓</text>
  <!-- Status banner -->
  <rect x="70" y="152" width="160" height="16" rx="1" fill="#1c3a10" stroke="#2ecc71" stroke-width="0.5"/>
  <text x="150" y="163" font-family="Space Mono,monospace" font-size="5.5" fill="#2ecc71" text-anchor="middle">RECOVERY — REVISED PLAN</text>
  <!-- Warning snapped rope indicator -->
  <text x="88" y="100" font-family="Space Mono,monospace" font-size="6" fill="#c0392b">✕ ROPE SNAPPED</text>
  <line x1="148" y1="100" x2="162" y2="108" stroke="#c0392b" stroke-width="1.5" stroke-dasharray="2,1"/>
</svg>`
};

const OBSTACLE_SETUPS = [
  {
    id: 'classic',
    label: 'Classic Bank Crossing',
    description: 'Standard pillar banks with a central red stump OOB marker.',
    leftPillar: 72,
    rightPillar: 218,
    stumpX: 144,
    plankY: 148,
    platform: false,
  },
  {
    id: 'offset',
    label: 'Offset Pillar Challenge',
    description: 'The pillars are uneven, forcing a longer rope line and smarter tension control.',
    leftPillar: 62,
    rightPillar: 228,
    stumpX: 154,
    plankY: 152,
    platform: false,
  },
  {
    id: 'river',
    label: 'River Gap Scenario',
    description: 'A narrow river crossing with a temporary platform on the far side and a deeper OOB centre.',
    leftPillar: 72,
    rightPillar: 218,
    stumpX: 144,
    plankY: 150,
    platform: true,
  }
];

// ════════════════════════════════════════════════════════
//  GAME STATE
// ════════════════════════════════════════════════════════

const State = {
  phaseIdx: 0,
  questionIdx: 0,
  obstacleIndex: 0,
  balliX: 120,
  dragging: false,
  dragHandlers: null,
  scores: { logic: 0, grit: 0, influence: 0 },
  speedBonus: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  twistsCleared: 0,
  timerInterval: null,
  secondsLeft: 300,
  answered: false,
};

// ════════════════════════════════════════════════════════
//  APP CONTROLLER
// ════════════════════════════════════════════════════════

const App = {
  // ── Show/hide screens ──
  show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${id}`).classList.add('active');
  },

  // ── Kickoff ──
  startGame() {
    Object.assign(State, {
      phaseIdx: 0,
      questionIdx: 0,
      obstacleIndex: Math.floor(Math.random() * OBSTACLE_SETUPS.length),
      balliX: 120,
      dragging: false,
      dragHandlers: null,
      scores: { logic: 0, grit: 0, influence: 0 },
      speedBonus: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      twistsCleared: 0,
      answered: false
    });
    this.show('briefing');
    this.loadPhase();
  },

  loadPhase() {
    State.questionIdx = 0;
    State.secondsLeft = 300;
    clearInterval(State.timerInterval);
    State.timerInterval = setInterval(() => this.tick(), 1000);
    this.renderPhaseUI();
    this.loadQuestion();
  },

  // ── Timer ──
  tick() {
    State.secondsLeft--;
    const m = Math.floor(State.secondsLeft / 60);
    const s = State.secondsLeft % 60;
    const el = document.getElementById('timer-display');
    el.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    el.className = 'timer-value' + (State.secondsLeft < 60 ? ' danger' : State.secondsLeft < 120 ? ' warn' : '');
    if (State.secondsLeft <= 0) {
      clearInterval(State.timerInterval);
      this.timeOut();
    }
  },

  timeOut() {
    document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
    document.getElementById('feedback-area').innerHTML = `
      <div class="feedback-bad">
        <span class="fb-verdict">⏱ Time Expired</span>
        Phase clock ran out. Your team did not complete this phase in time — mission proceeds to debrief.
      </div>`;
    document.getElementById('btn-next').style.display = 'flex';
  },

  // ── Render UI for phase ──
  renderPhaseUI() {
    const phase = PHASES[State.phaseIdx];
    document.getElementById('phase-tag').textContent = phase.title;
    document.getElementById('obstacle-visual').innerHTML = this.getObstacleSceneMarkup(phase.visual);
    // Equipment chips
    const rack = document.getElementById('eq-items');
    rack.innerHTML = phase.equipment.map(e =>
      `<span class="eq-chip${e.id === 'redstump' ? ' oob' : ''}">${e.label}</span>`
    ).join('');
    if (phase.visual !== 'recovery') {
      this.attachDragHandlers();
    }
  },

  getObstacleSceneMarkup(visual) {
    const phase = PHASES[State.phaseIdx];
    if (visual === 'setup' || visual === 'execution') {
      const setup = OBSTACLE_SETUPS[State.obstacleIndex];
      const balliX = State.balliX;
      const loadX = balliX + 60;
      const ropeRightStart = balliX + 120;
      const stumpColor = setup.platform ? '#c0392b' : '#c0392b';
      const platformMarkup = setup.platform ? `<rect x="200" y="150" width="60" height="10" fill="#3d2e10" opacity="0.85"/><text x="230" y="166" font-family="Space Mono,monospace" font-size="5" fill="#7a5520" text-anchor="middle">PLATFORM</text>` : '';

      return `
<div class="interactive-scene">
  <div class="interactive-header">${setup.label}</div>
  <div class="interactive-description">${setup.description}</div>
  <svg viewBox="0 0 300 200" width="300" height="200" xmlns="http://www.w3.org/2000/svg" id="sim-svg">
    <rect width="300" height="200" fill="#0d0f0b"/>
    <text x="30" y="20" font-family="Space Mono,monospace" font-size="7" fill="#4a5424">START</text>
    <text x="235" y="20" font-family="Space Mono,monospace" font-size="7" fill="#4a5424">END</text>
    <rect x="0" y="140" width="80" height="60" fill="#1c2016" stroke="#3a4530" stroke-width="0.5"/>
    <rect x="220" y="140" width="80" height="60" fill="#1c2016" stroke="#3a4530" stroke-width="0.5"/>
    <rect x="80" y="140" width="140" height="60" fill="#2a2510" stroke="#4a4020" stroke-width="0.5"/>
    <text x="150" y="178" font-family="Space Mono,monospace" font-size="6.5" fill="#6a5a20" text-anchor="middle">OUT OF BOUNDS</text>
    <rect x="${setup.leftPillar}" y="120" width="10" height="24" fill="#1a4a70" stroke="#3a8fb5" stroke-width="1"/>
    <rect x="${setup.rightPillar}" y="120" width="10" height="24" fill="#1a4a70" stroke="#3a8fb5" stroke-width="1"/>
    <text x="${setup.leftPillar + 5}" y="116" font-family="Space Mono,monospace" font-size="5.5" fill="#3a8fb5" text-anchor="middle">PILLAR</text>
    <text x="${setup.rightPillar + 5}" y="116" font-family="Space Mono,monospace" font-size="5.5" fill="#3a8fb5" text-anchor="middle">PILLAR</text>
    <rect x="${setup.stumpX}" y="130" width="12" height="14" fill="#3a1010" stroke="${stumpColor}" stroke-width="1"/>
    <rect x="${setup.stumpX}" y="130" width="12" height="4" fill="#c0392b"/>
    <text x="${setup.stumpX + 6}" y="126" font-family="Space Mono,monospace" font-size="5" fill="#c0392b" text-anchor="middle">OOB</text>
    ${platformMarkup}
    <line id="rope-left" x1="10" y1="128" x2="${balliX}" y2="128" stroke="#d4922a" stroke-width="2" stroke-dasharray="4,2"/>
    <line id="rope-right" x1="${ropeRightStart}" y1="128" x2="290" y2="128" stroke="#d4922a" stroke-width="2" stroke-dasharray="4,2"/>
    <g id="balli-group" transform="translate(${balliX},0)">
      <line x1="0" y1="128" x2="120" y2="128" stroke="#a3b85c" stroke-width="5" stroke-linecap="round"/>
      <rect id="drag-handle" x="50" y="116" width="20" height="24" rx="4" fill="#7a8c3e" opacity="0.8" cursor="pointer"/>
      <circle cx="60" cy="128" r="8" fill="#a3b85c"/>
    </g>
    <ellipse id="load-blob" cx="${loadX}" cy="122" rx="12" ry="9" fill="#1c2016" stroke="#a3b85c" stroke-width="1.5"/>
    <text x="${loadX}" y="125" font-family="Space Mono,monospace" font-size="5" fill="#a3b85c" text-anchor="middle">LOAD</text>
  </svg>
  <div id="drag-feedback" class="drag-feedback">Drag the balli handle to test rope tension and keep the load clear of the red stump.</div>
</div>`;
    }

    return VISUALS[visual] || '';
  },

  attachDragHandlers() {
    const svg = document.getElementById('sim-svg');
    const handle = document.getElementById('drag-handle');
    const balliGroup = document.getElementById('balli-group');
    const leftRope = document.getElementById('rope-left');
    const rightRope = document.getElementById('rope-right');
    const loadBlob = document.getElementById('load-blob');
    const feedback = document.getElementById('drag-feedback');
    if (!svg || !handle || !balliGroup || !leftRope || !rightRope || !loadBlob || !feedback) return;

    const clampX = (x) => Math.max(80, Math.min(150, x));
    const updateScene = (x) => {
      const newX = clampX(x);
      State.balliX = newX;
      const ropeRightX = newX + 120;
      balliGroup.setAttribute('transform', `translate(${newX},0)`);
      leftRope.setAttribute('x2', `${newX}`);
      rightRope.setAttribute('x1', `${ropeRightX}`);
      loadBlob.setAttribute('cx', `${newX + 60}`);

      const setup = OBSTACLE_SETUPS[State.obstacleIndex];
      const balliCenter = newX + 60;
      if (balliCenter > setup.stumpX - 22 && balliCenter < setup.stumpX + 22) {
        feedback.textContent = 'Warning: the balli is close to the red stump. Keep the rope clear of the OOB marker.';
        feedback.classList.add('drag-warning');
      } else if (balliCenter < 105) {
        feedback.textContent = 'The balli is too close to the start bank. Stretch the ropes evenly across the gap.';
        feedback.classList.remove('drag-warning');
      } else if (balliCenter > 175) {
        feedback.textContent = 'The balli is too near the end bank. Adjust the rassi to keep the load centred.';
        feedback.classList.remove('drag-warning');
      } else {
        feedback.textContent = 'Great — the balli is moving smoothly. Use the drag handle to feel how tension changes as you adjust position.';
        feedback.classList.remove('drag-warning');
      }
    };

    let pointerId = null;
    const onDown = (event) => {
      event.preventDefault();
      pointerId = event.pointerId;
      State.dragging = true;
      svg.setPointerCapture(pointerId);
    };

    const onMove = (event) => {
      if (!State.dragging || event.pointerId !== pointerId) return;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const local = point.matrixTransform(svg.getScreenCTM().inverse());
      updateScene(local.x - 60);
    };

    const onUp = (event) => {
      if (event.pointerId !== pointerId) return;
      State.dragging = false;
      pointerId = null;
      if (svg.releasePointerCapture) svg.releasePointerCapture(event.pointerId);
      feedback.textContent = 'Drag the balli handle to test rope tension and keep the load clear of the red stump.';
      feedback.classList.remove('drag-warning');
    };

    if (State.dragHandlers?.handleEl) {
      State.dragHandlers.handleEl.removeEventListener('pointerdown', State.dragHandlers.onDown);
    }
    if (State.dragHandlers?.onMove) {
      window.removeEventListener('pointermove', State.dragHandlers.onMove);
      window.removeEventListener('pointerup', State.dragHandlers.onUp);
      window.removeEventListener('pointercancel', State.dragHandlers.onUp);
    }

    handle.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    State.dragHandlers = { handleEl: handle, onDown, onMove, onUp };
  },

  // ── Load question ──
  loadQuestion() {
    const phase = PHASES[State.phaseIdx];
    const q = phase.questions[State.questionIdx];
    State.answered = false;

    // Update counters
    const totalQ = PHASES.reduce((a, p) => a + p.questions.length, 0);
    const doneQ = PHASES.slice(0, State.phaseIdx).reduce((a, p) => a + p.questions.length, 0) + State.questionIdx;
    document.getElementById('q-counter').textContent = `Q ${doneQ + 1}/${totalQ}`;

    // Progress dots
    const dotsEl = document.getElementById('progress-dots');
    dotsEl.innerHTML = '';
    PHASES.forEach((p, pi) => {
      p.questions.forEach((_, qi) => {
        const dot = document.createElement('div');
        dot.className = 'pdot' +
          (pi < State.phaseIdx || (pi === State.phaseIdx && qi < State.questionIdx) ? ' done' :
           pi === State.phaseIdx && qi === State.questionIdx ? ' active' : '');
        dotsEl.appendChild(dot);
      });
    });

    // Scenario
    document.getElementById('scenario-tag').textContent =
      `Phase ${phase.id} · Q${State.questionIdx + 1}`;
    document.getElementById('scenario-text').innerHTML = q.scenario;

    // Twist
    const twistEl = document.getElementById('twist-banner');
    if (q.twist) {
      twistEl.style.display = 'flex';
      document.getElementById('twist-text').textContent = q.twist;
    } else {
      twistEl.style.display = 'none';
    }

    // Question
    document.getElementById('question-text').textContent = q.q;

    // Choices
    const letters = ['A', 'B', 'C', 'D'];
    const choicesEl = document.getElementById('choices-list');
    choicesEl.innerHTML = '';
    q.choices.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = `<span class="choice-letter">${letters[i]}</span><span>${c.text}</span>`;
      btn.onclick = () => this.selectChoice(i);
      choicesEl.appendChild(btn);
    });

    // Clear feedback & next btn
    document.getElementById('feedback-area').innerHTML = '';
    document.getElementById('btn-next').style.display = 'none';
  },

  // ── Answer selection ──
  selectChoice(idx) {
    if (State.answered) return;
    State.answered = true;

    const phase = PHASES[State.phaseIdx];
    const q = phase.questions[State.questionIdx];
    const c = q.choices[idx];
    const buttons = document.querySelectorAll('.choice-btn');
    buttons.forEach(b => b.disabled = true);
    buttons[idx].classList.add(c.correct ? 'correct' : 'wrong');

    State.totalQuestions++;
    if (c.correct) {
      State.totalCorrect++;
      const spd = Math.round(State.secondsLeft / 15);
      State.speedBonus += spd;
      if (q.twist) State.twistsCleared++;
    }

    // Apply OLQ bonuses
    const bonus = c.olq_bonus;
    State.scores.logic     = Math.min(10, State.scores.logic     + bonus.logic / 2);
    State.scores.grit      = Math.min(10, State.scores.grit      + bonus.grit  / 2);
    State.scores.influence = Math.min(10, State.scores.influence + bonus.influence / 2);

    // Update live meters
    this.updateMeters();

    // Feedback
    document.getElementById('feedback-area').innerHTML = `
      <div class="${c.correct ? 'feedback-good' : 'feedback-bad'}">
        <span class="fb-verdict">${c.correct ? '✓ Correct' : '✕ Incorrect'}</span>
        ${c.fb}
      </div>`;

    document.getElementById('btn-next').style.display = 'flex';
  },

  updateMeters() {
    const { logic, grit, influence } = State.scores;
    document.getElementById('m-logic').style.width   = (logic * 10) + '%';
    document.getElementById('m-grit').style.width    = (grit  * 10) + '%';
    document.getElementById('m-inf').style.width     = (influence * 10) + '%';
    document.getElementById('mv-logic').textContent  = Math.round(logic);
    document.getElementById('mv-grit').textContent   = Math.round(grit);
    document.getElementById('mv-inf').textContent    = Math.round(influence);
  },

  // ── Advance ──
  nextQuestion() {
    State.questionIdx++;
    const phase = PHASES[State.phaseIdx];
    if (State.questionIdx >= phase.questions.length) {
      clearInterval(State.timerInterval);
      State.phaseIdx++;
      if (State.phaseIdx >= PHASES.length) {
        this.showResults();
      } else {
        this.loadPhase();
      }
    } else {
      State.answered = false;
      this.loadQuestion();
    }
  },

  // ── Results ──
  showResults() {
    clearInterval(State.timerInterval);
    this.show('results');

    const logic = Math.min(10, Math.round(State.scores.logic * 10) / 10);
    const grit  = Math.min(10, Math.round(State.scores.grit  * 10) / 10);
    const inf   = Math.min(10, Math.round(State.scores.influence * 10) / 10);
    const acc   = State.totalQuestions > 0 ? Math.round((State.totalCorrect / State.totalQuestions) * 100) : 0;
    const total = Math.min(100, Math.round(((logic + grit + inf) / 30) * 70 + Math.min(30, State.speedBonus)));

    // Header
    const ranks = [
      { min: 85, label: 'Outstanding' },
      { min: 70, label: 'Above Average' },
      { min: 55, label: 'Average' },
      { min: 40, label: 'Below Average' },
      { min:  0, label: 'Needs Remediation' },
    ];
    const rank = ranks.find(r => total >= r.min).label;

    document.getElementById('result-rank').textContent = rank;
    document.getElementById('result-score').textContent = total;
    document.getElementById('stat-acc').textContent = acc + '%';
    document.getElementById('stat-speed').textContent = '+' + State.speedBonus;
    document.getElementById('stat-twists').textContent = State.twistsCleared + '/5';

    // OLQ bars (animate after small delay)
    setTimeout(() => {
      document.getElementById('r-logic').textContent = logic + '/10';
      document.getElementById('rb-logic').style.width = (logic * 10) + '%';
      document.getElementById('r-grit').textContent  = grit  + '/10';
      document.getElementById('rb-grit').style.width  = (grit  * 10) + '%';
      document.getElementById('r-inf').textContent   = inf   + '/10';
      document.getElementById('rb-inf').style.width   = (inf   * 10) + '%';
    }, 200);

    // OLQ notes
    document.getElementById('rn-logic').textContent = logic >= 7
      ? 'Strong tactical planning and engineering decisions throughout.'
      : logic >= 4
      ? 'Adequate reasoning — revisit balli fatta rassi structural rules.'
      : 'Significant gaps in obstacle engineering understanding. Review all phase rules.';

    document.getElementById('rn-grit').textContent = grit >= 7
      ? 'Excellent composure under time pressure and twist scenarios.'
      : grit >= 4
      ? 'Timer management needs improvement — practise quick decision loops.'
      : 'Struggled under pressure. Focus on calm rapid-decision drills.';

    document.getElementById('rn-inf').textContent = inf >= 7
      ? 'Command presence and subordinate leadership were strong.'
      : inf >= 4
      ? 'Influence OLQ adequate — focus on crisis calm and team debrief technique.'
      : 'Influence OLQ weak. Study subordinate motivation, command reassertion, and debrief protocols.';

    // Remarks
    let remarks = '';
    if (logic >= 7) remarks += 'Your understanding of the balli fatta rassi structure and equipment deployment was solid. ';
    else remarks += 'Structural engineering decisions need review — particularly pillar lashing and load transfer technique. ';
    if (grit >= 7) remarks += 'You managed time pressure well across all three phases. ';
    else remarks += 'Speed of decision under the timer was the main drag on your score. ';
    if (inf >= 7) remarks += 'Leadership interactions — especially the frozen-member and dual-command scenarios — showed maturity and social adaptability.';
    else remarks += 'Command scenarios (frozen member, dual commands, debrief) revealed gaps in subordinate management. Targeted practice recommended.';
    document.getElementById('remarks-text').textContent = remarks;

    // Tags
    const tags = [];
    if (logic >= 8) tags.push({ label: 'Tactician', color: '#a3b85c', border: '#7a8c3e' });
    if (grit >= 7)  tags.push({ label: 'Resilient',  color: '#f0b044', border: '#d4922a' });
    if (inf >= 8)   tags.push({ label: 'Commander',  color: '#3a9fd0', border: '#2a6f90' });
    if (acc === 100) tags.push({ label: 'Ace',        color: '#2ecc71', border: '#1a9a50' });
    if (State.speedBonus >= 25) tags.push({ label: 'Speed Leader', color: '#e0a0d0', border: '#a060a0' });
    if (State.twistsCleared >= 4) tags.push({ label: 'Twist Buster', color: '#e08040', border: '#a05020' });
    if (tags.length === 0) tags.push({ label: 'In Training', color: '#7a8470', border: '#4a5440' });

    document.getElementById('olq-tags').innerHTML = tags.map(t =>
      `<span class="olq-tag" style="color:${t.color};border-color:${t.border}">${t.label}</span>`
    ).join('');

    // Next steps
    const steps = [];
    if (logic < 7)  steps.push('Re-study balli fatta rassi structural configurations and legal equipment placements.');
    if (grit < 7)   steps.push('Practise timed decision scenarios — aim to answer in under 20 seconds per question.');
    if (inf < 7)    steps.push('Study the 3-step influence model: Personalise → Calm → Redirect. Drill frozen-member and dual-command scenarios.');
    if (acc < 75)   steps.push('Review incorrect answers after each run. Understand why each GTO rule exists before re-attempting.');
    if (steps.length === 0) steps.push('Outstanding performance. Attempt advanced PGT scenarios with additional twists enabled.');

    document.getElementById('next-steps').innerHTML = steps.map(s =>
      `<div class="next-step-item"><div class="ns-dot"></div><span>${s}</span></div>`
    ).join('');
  },

  restart() { this.startGame(); }
};

// Expose to HTML onclick handlers
window.App = App;
