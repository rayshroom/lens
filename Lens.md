# Lens — Chrome Extension Spec (MVP v1)

**Doc type:** Product + Engineering spec  
**Audience:** Dev agent (Chrome extension engineer)  
**Goal:** Ship an MVP Chrome extension that delivers a “clarity moment” in <30 seconds using a curated set of neutral principles + prompts.  
**Non-goal:** Provide advice, decisions, therapy, political messaging, or “AI answers”.

---

## 0. Product Definition

**One-liner:**  
A lightweight “thinking lens” extension: open it, get a neutral principle + reflection prompts to help you reframe a situation.

**Core promise:**  
Offer perspectives, not decisions.

**Primary metric (MVP):**  
- Repeat opens (D1 / D7 retention proxy), and session completion rate (open → reflect/new lens → close)

---

## 1. Scope (MVP v1)

### Included
- Popup UI (browser action) with:
  - One neutral principle (random / anti-repeat)
  - “Reflect” toggle to reveal prompts
  - “New Lens” button for another lens
  - Optional one-line user input (not required)
  - Copy/share button (copy current card)
- Local-only content store (bundled JSON)
- Local-only state (chrome.storage.local)
- “Anti-repeat” selection logic (avoid recent N)
- Minimal settings (optional): “Reduce repeats” on/off, “Show input box” on/off
- Soft disclaimer text

### Explicitly Excluded (v1)
- Accounts/login
- Cloud sync
- Analytics backend (no remote tracking in v1)
- LLM/API calls
- Complex categories/filters UI
- Notifications, new tab override, omnibox, context menus

---

## 2. User Experience

### Entry points
- Click extension icon → popup opens
- (Optional, if easy) Keyboard shortcut to open popup (via chrome://extensions/shortcuts)

### Popup layout (wireframe)

[App Title: Lens]                   [Settings icon ⚙︎]

Principle (1–3 lines max)

Optional: Input (1-line)  [text field]
(placeholder: “If you want, write your situation in one sentence.”)

[ Reflect ]   [ New Lens ]   [ Copy ]

(When Reflect expanded)
Prompts:
• Prompt 1
• Prompt 2 (optional)
Counter-question:
• Counter prompt

⸻

Footer (small, grey):
“This tool offers perspectives, not decisions.”

### Interaction rules
- Popup opens instantly with a principle already rendered.
- “Reflect” toggles expanded view. Default: collapsed.
- “New Lens” replaces the current card content.
- Input is optional. If filled, it affects lens selection in a lightweight way (see §4.2).
- Copy copies a clean, shareable text block (see §6.3).
- No scrolling if possible; keep content short. If overflow, allow scroll in expanded view only.

### Accessibility
- Full keyboard navigation (tab order sensible)
- Buttons have aria-label
- Text contrast AA minimum
- Prefers reduced motion respected

---

## 3. Content Model

### Card definition
A “LensCard” is composed of:
- `id` (string, unique)
- `principle` (string; neutral, non-prescriptive)
- `prompts` (array of 1–2 strings)
- `counter` (string)
- `tags` (array of strings; internal only in v1)
- `version` (int; for future migrations)

### Content file
- `data/lenses.en.json` bundled with extension

Example:
```json
[
  {
    "id": "lens_001",
    "principle": "Complex situations are often shaped by one dominant constraint rather than many equal factors.",
    "prompts": [
      "What factor, if changed, would most alter the outcome?",
      "Which constraint is truly binding right now?"
    ],
    "counter": "What might you be missing by focusing too narrowly on a single constraint?",
    "tags": ["decision", "systems"],
    "version": 1
  }
]

Content guidelines (for editor)
	•	Avoid political/ideological markers or group labels
	•	Avoid absolutes: “always”, “must”, “inevitable”
	•	Avoid advice tone: “you should”, “do X”
	•	Prefer: “consider”, “ask”, “notice”, “what if”
	•	Length targets:
	•	principle ≤ 160 chars (soft)
	•	prompts ≤ 120 chars each
	•	counter ≤ 140 chars

⸻

4. Lens Selection Logic

4.1 Base selection (required)
	•	Random selection from all cards
	•	Avoid repeating any of the last N shown cards
	•	Default N = 7 (tunable)
	•	If deck < N+1, fall back to random without strict avoidance

Persisted state:
	•	recentLensIds: string[] (most recent first)
	•	lastLensId: string | null

4.2 Optional “input-aware” selection (nice-to-have; still local, no ML)

If user enters text:
	•	Compute a simple keyword match score vs tags using a small internal keyword map
	•	If no matches, use base random
	•	If matches, biased random among matched tags (e.g., 70% matched pool, 30% global)

Implementation suggestion:
	•	Internal keywordToTags dictionary (small, curated):
	•	e.g., “conflict”, “argument” → interpersonal
	•	“deadline”, “project” → work
	•	“choice”, “quit”, “move” → decision
	•	Avoid heavy NLP; do lowercased token contains checks.

4.3 “New Lens” behavior
	•	Always select a different lens from current if possible.
	•	Update recentLensIds.

⸻

5. Data Storage (chrome.storage.local)

Keys:
	•	recentLensIds: string[]
	•	uiState: { reflectExpanded: boolean } (optional; default false each open is fine)
	•	settings: { antiRepeatN: number, showInput: boolean }
	•	draftInput: string (optional; can clear on popup close if desired)

Privacy:
	•	No network requests in v1.
	•	No user input leaves device.

⸻

6. Features Detail

6.1 Reflect toggle
	•	Collapsed state shows principle only
	•	Expanded state reveals prompts + counter
	•	The principle remains visible at top

6.2 Copy

Copies to clipboard (plain text):
Format:

Lens — Perspective
Principle: <principle>

Reflect:
- <prompt1>
- <prompt2 if present>

Counter:
- <counter>

(This tool offers perspectives, not decisions.)

6.3 Settings (minimal)

Settings panel (simple modal or separate small section):
	•	Toggle: “Show input box” (default ON)
	•	Toggle: “Reduce repeats” (default ON)
	•	If OFF, set antiRepeatN = 0
	•	About text:
	•	“Local-only. No tracking.”

No account, no paywall in v1 spec (we can add later).

⸻

7. Technical Specification

7.1 Chrome extension manifest
	•	Manifest V3
	•	Permissions:
	•	storage
	•	(Optional for copy) clipboardWrite (or use standard clipboard API in popup)
	•	No host permissions required.
	•	No background service worker needed unless implementing alarms/notifications (excluded).

7.2 Project structure (suggested)

/extension
  /src
    /data
      lenses.en.json
      keywordMap.json (optional)
    popup.html
    popup.ts (or js)
    popup.css
    settings.ts (optional)
    storage.ts
    selector.ts
  manifest.json
  icons/
  dist/ (build output)

7.3 Implementation notes
	•	Use vanilla JS/TS or a small framework (React is acceptable but overkill for MVP).
	•	Ensure popup loads in <100ms typical.
	•	Use deterministic randomness seed? Not required. True random acceptable.
	•	Anti-repeat: maintain a queue list, truncate to N.

7.4 Clipboard
	•	Use navigator.clipboard.writeText() from popup context
	•	Provide success toast (non-intrusive) “Copied”

7.5 Internationalization (future-proofing)
	•	v1: English only
	•	Keep content file modular to add lenses.zh.json later

⸻

8. Acceptance Criteria

Functional
	•	Opening popup always shows a principle (never blank)
	•	“New Lens” changes content and respects anti-repeat
	•	“Reflect” toggles prompts visibility
	•	Copy produces expected format
	•	Settings persist across sessions
	•	Input (if provided) does not break selection; optional bias works if implemented

Non-functional
	•	No external network calls
	•	No errors in console on open/close
	•	Works on latest Chrome stable
	•	Popup UI fits within typical popup size (e.g., 360px width) without awkward overflow

⸻

9. QA / Test Plan

Manual test cases
	1.	Fresh install → open popup → see principle
	2.	Click Reflect → prompts appear
	3.	Click New Lens 10 times → minimal repeats (with N=7)
	4.	Toggle reduce repeats OFF → repeats may occur
	5.	Copy → paste into text editor → format correct
	6.	Enter input “I want to quit my job” → lens selection still works (bias optional)
	7.	Reload extension → settings persist

Edge cases
	•	Very small content deck (simulate 5 lenses) → anti-repeat fallback
	•	Clipboard permission blocked → show graceful error toast
	•	Storage unavailable (rare) → fallback to in-memory state without crash

⸻

10. Content & Safety Disclaimers

Include footer line in popup:
	•	“This tool offers perspectives, not decisions.”

Optional about/help (settings):
	•	“Not medical, legal, or financial advice.”
	•	“If you’re in crisis, contact local emergency services.”

⸻

11. Future Roadmap (not in v1, but design should not block)

v1.5
	•	History (local), favorites
	•	Simple streaks (local-only)

v2 (Pro + LLM)
	•	LLM-assisted reframe (STRICTLY no advice; only summarize, map to lenses, generate reflective questions)
	•	Mobile app parity (daily lens, journaling, review)
	•	Monetization: subscription + buyout tier

⸻

12. Deliverables for Dev Agent
	•	Working MV3 Chrome extension folder
	•	Build instructions (if TS/bundler used)
	•	A sample dataset of 30 LensCards in lenses.en.json
	•	README:
	•	install unpacked steps
	•	how to add/edit lenses
	•	how anti-repeat works
	•	privacy statement (“no network calls”)

⸻

13. Open Decisions (default values if not specified)
	•	Anti-repeat N default: 7
	•	Reflect default: collapsed
	•	Show input default: ON
	•	Bias ratio (if input-aware): 70% matched / 30% global
