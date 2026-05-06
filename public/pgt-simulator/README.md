# OliveWings — PGT Simulator: Balli Fatta Rassi

A browser-based Progressive Group Task (PGT) training simulator for GTO preparation.

---

## Project Structure

```
pgt-simulator/
├── index.html          ← Main game entry point
├── src/
│   ├── style.css       ← Military-tactical dark theme
│   └── game.js         ← All game logic, content, scoring
└── README.md
```

---

## Integration into OliveWings (VS Code)

### Option A — Drop-in folder
Copy the `pgt-simulator/` folder into your OliveWings project root or `public/` folder:
```
olivewings/public/
├── pgt-simulator/      ← games here
├── ... (your existing files)
```
Then link from your main app:
```html
<a href="/pgt-simulator/index.html">PGT Simulator</a>
```

### Option B — iframe embed
Embed inside any existing OliveWings page:
```html
<iframe
  src="/pgt-simulator/index.html"
  width="100%"
  height="100vh"
  style="border:none;"
></iframe>
```

### Option C — React / Next.js
If OliveWings uses React, convert `game.js` into a module and import it into a component:
```js
import { App } from '../pgt-simulator/src/game.js';
```

---

## Game Overview

| Property       | Value                           |
|----------------|---------------------------------|
| Phases         | 3 (Setup · Execution · Recovery)|
| Questions      | 4 per phase = 12 total          |
| Timer          | 5 minutes per phase (300s)      |
| OLQs scored   | Logic · Grit · Influence        |
| Twist events   | 5 mid-question twists           |
| Scoring        | OLQ × accuracy + speed bonus   |

---

## OLQ Scoring Logic

Each question awards `olq_bonus` points on correct answer:
- **Logic & Reasoning** — Engineering decisions, rule knowledge
- **Grit & Stamina** — Time-pressure, crisis recovery decisions
- **Influence** — Subordinate management, command, debrief

**Speed Bonus** = `Math.round(secondsLeft / 15)` per correct answer

**Final Score** = `((logic + grit + influence) / 30) × 70 + min(speedBonus, 30)`

---

## Extending the Game

To add new questions, edit `PHASES` array in `src/game.js`:
```js
{
  scenario: 'Your scenario text with <strong>highlights</strong>...',
  twist: '⚡ Twist: Something unexpected...',  // or null
  q: 'What do you do?',
  choices: [
    {
      text: 'Choice text',
      correct: true,           // only one per question
      fb: 'Feedback explanation for the assessor.',
      olq_bonus: { logic: 2, grit: 1, influence: 1 }
    },
    // ... 3 more choices
  ]
}
```

To add new SVG obstacle visuals, add a key to the `VISUALS` object.

---

## Requirements
- Any modern browser (Chrome, Firefox, Edge, Safari)
- No build tools, no npm, no dependencies
- Google Fonts CDN (or remove font link for offline use)

---

## Offline Use
Remove the Google Fonts `<link>` in `index.html` and the fonts will fall back to system monospace/sans-serif. The game is fully functional offline.

---

*Built for OliveWings · GTO Training Suite*
