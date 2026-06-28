# BioBridge OS — Live Demo Script (~8 minutes)

Use **`demo_07_live_demo_dirty.csv`** from the Demo Gallery (badge: **Live demo**).  
Run the app: `cd ~/Projects/biobridge-os && npm run dev`

---

## Part 1 — Elena (bench scientist) · ~4 min

**Story:** Elena just finished a 96-well viability run and wants to send clean data *before* Marcus finds problems on Slack.

### Step 1 — Upload (30 sec)
1. Open BioBridge OS (no file loaded).
2. In **Demo datasets**, click **Live demo (dirty handoff)**.
3. Point out: *"This is exactly what I'd export after a run — metadata typed by hand, instrument codes, notes column."*

### Step 2 — Pre-flight check (45 sec)
1. Read the **Pre-flight check** banner aloud in plain language:
   - Same label, different spelling
   - Hidden spaces
   - Number expected, text found
   - Missing replicate
2. Say: *"Nobody told me 'casing divergence' was wrong — but I can see 'Control' and 'control' are the same thing."*
3. Note the line: **"N fixes can be applied automatically."**

### Step 3 — One-click cleanup (60 sec)
1. Click **Apply all safe fixes (N)** in **Suggested fixes**.
2. Watch flags drop — whitespace, obvious merges, some numeric codes handled.
3. Say: *"I didn't write code. I didn't wait on Marcus."*

### Step 4 — One judgment call (60 sec)
1. Find a remaining card (e.g. **Drug X** not in protocol, or a numeric **N/A**).
2. Use **Apply suggested fix** or pick *Exclude* / *Flag for QC*.
3. If **Drug X** or **ctrl_rep3** schema flag appears: resolve it, then show the **promote-to-protocol** toast:
   - Click **Yes, add it** → *"Next week's upload auto-fixes this."*

### Step 5 — Export before send (45 sec)
1. Confirm **Dataset is clean ✓** (or only acknowledged items left).
2. Click **Export cleaned CSV** — mention **Notes** column is still there.
3. Optional: open **Handoff report** — *"Marcus gets plain English, not a lecture about dtypes."*

**Elena punchline:** *"I audited my own data before I hit send."*

---

## Part 2 — Marcus (computational biologist) · ~4 min

**Story:** Marcus receives Elena's file (or loads the same demo) and wants deterministic validation + reusable protocol logic.

### Step 1 — Protocol + regex (90 sec)
1. Click **Manage Protocols** → **Edit** `96-well viability screen v1` (or create copy).
2. Open **Treatment_Group** rule → expand **Advanced: regex variant rules (comp bio)**.
3. Show existing rules OR click preset **Any ctrl\* → Control**.
4. Add regex: pattern `^drug[\\s_-]?a` → maps to **Drug A**; use **Test against sample values** with `drug_a`, `Drug-A`.
5. Save template.

**Marcus framing:** *"Regex lives in the protocol — not in Elena's UI. Known variants are still preferred; regex catches families of typos once."*

### Step 2 — Reload & compare (60 sec)
1. Re-load **demo_07** (refresh page or re-click demo tile).
2. Select protocol **96-well viability screen v1**.
3. Compare flag count vs **None (heuristic only)** in the protocol dropdown.
4. Point out silent auto-normalizations in **Audit trail** (protocol regex / known variants).

### Step 3 — Script + audit (60 sec)
1. Open **Generated Python** — show comments:
   - `# Auto-normalized via Protocol "96-well viability screen v1"`
2. Open **Audit trail** — action, actor (Elena vs auto), time/effort.
3. **Cost of Cleaning** — *"This is the 50% of my week that's usually invisible."*

### Step 4 — Handoff back to Elena (30 sec)
1. Download **Handoff report** + **audit_trail.json** + **.py** script.
2. Say: *"When results look weird, Elena can see what changed — not reconstruct from memory."*

**Marcus punchline:** *"Schema-first where we have ground truth; fuzzy where we don't — and everything is reproducible."*

---

## Quick reference — what demo_07 contains

| Issue | Example in file | Who fixes it |
|--------|-----------------|--------------|
| Casing / synonyms | control, vehicle, ctrl_r2 | Auto + protocol |
| Regex families | drug_a, Drug-A | Marcus protocol regex |
| Whitespace | ` CONTROL_REP1` | Auto |
| Gene symbols | gapdh, actb | Auto (uppercase) |
| Instrument codes | ERROR, ND, N/A, <LOD | Suggested → one click |
| Missing replicate | ACTB × Drug B (no Rep 2) | Acknowledge |
| Novel value | ctrl_rep3, Drug X | Elena + promote |
| Bench notes | Notes column | Preserved in export |
| Multi-batch | Run_A / Run_B | Batch context in suggestions |

---

## FAQ for presenters

**Should Elena see regex?**  
No — regex is in **Manage Protocols** only. Elena gets cluster cards and suggested fixes.

**Why both knownVariants and regex?**  
Exact variants are auditable and promoted from Elena's merges. Regex is Marcus's escape hatch for *families* of labels (`ctrl_*`, `drug_a` variants).

**What if regex is wrong?**  
Invalid patterns are rejected in the builder. Test panel shows matches before save. Clone protocol before experimenting.

---

*BioBridge OS v4.0 — internal live demo script*
