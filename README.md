# Benjamin's Climb to 8th Grade Math

A daily tracker for one 2nd grader at Alpha School East Bay working toward 8th grade math by **May 30, 2027**.

Static site. No build step, no framework, no database.

---

## The goal math, stated plainly

- **Aug 20, 2026 → May 30, 2027** is 283 days, which is exactly **five 8-week sessions**.
- The ladder runs **grade 2 through grade 7** — six tests. Passing the grade 7 test is what puts him *into* 8th grade math, so there is no grade 8 test to pass.
- So "at least one test per session" is a **floor that only gets him working in grade 7.** One session has to carry a double.

The Pace Check panel says this out loud and recalculates as tests get marked, so it stays a visible problem instead of an April surprise. Bank the double early, while 3rd and 4th grade content is still fast.

---

## Daily target

Default is **1 hour of math per day**, shown as four 15-minute blocks. Change it in **Guide to Settings to Daily math target** — the grid resizes itself, so 240 gives you sixteen blocks in four labelled rows. Past entries are stored as a count of 15-minute units, so changing the target never rewrites history.

## What's in each tab

| Tab | What it does |
|---|---|
| **Today** | Tap-scale for the day's math time (default target **1 hour** = four 15-minute blocks), plus a month calendar. Tap any past date to fill it in. |
| **Climb** | Six-rung ladder (grades 2-7), pace check, and the five session windows. The masthead shows the grade he is *working in* — one above his highest passed test. |
| **Words** | Problem reader with read-aloud and signal-word coloring, the five moves, a tappable word bank, and the daily word-problem count. |

Three tabs, all kid-facing. Anything guide-facing lives behind the gear in the top-right of the masthead.
| **⚙ (masthead)** | Guide settings, tucked behind the gear rather than a tab: daily target, goal date, session windows, voice picker, CSV export, erase, storage status. |

---

## The voice

**No recording required.** A script generates every spoken line as a neural MP3, once, and you commit the files.

### Generate the clips

```bash
export OPENAI_API_KEY=sk-...     # or ELEVENLABS_API_KEY=...
npm run voices
```

That writes 57 MP3s into `audio/`. Then:

```bash
git add audio && git commit -m "voice clips" && git push
```

**Cost to generate all 57 lines:** about **$0.001** with OpenAI, or **$0.20** with ElevenLabs. It is 1,357 characters total. This is one-time, not per-play — once the MP3s are committed they are static files. Re-run only when you edit the `VOICE-LINES` block in `index.html`; existing files are skipped unless you pass `--force`.

| Provider | Sounds like | Set |
|---|---|---|
| OpenAI `gpt-4o-mini-tts` | Very natural, warm. Fine for a 7-year-old. | `OPENAI_API_KEY`, optionally `OPENAI_TTS_VOICE` (default `nova`) |
| ElevenLabs | The most human available. Noticeably better, ~200x the cost, still under a quarter. | `ELEVENLABS_API_KEY`, optionally `ELEVENLABS_VOICE_ID` |

Both are instructed to read slowly and warmly, pausing fully at every period, as if reading to a child who finds reading hard.

### Three layers, best available wins

1. **`audio/*.mp3`** — the pre-generated clips. Instant, free at play time, works with no connection.
2. **`/api/speak`** — live neural TTS for the one thing clips cannot cover: a word problem Benjamin just typed in. Optional. Add the same API key in **Vercel to Settings to Environment Variables**; the key stays server-side and never reaches the browser.
3. **Device voice** — the built-in `speechSynthesis`. Used only if neither of the above is set up.

The device layer is no longer the default robot. The app ranks every installed English voice and picks the best one — on a Mac that is usually Ava or Samantha, on Windows a Microsoft *Natural* voice, on Chrome a Google voice. All of those sound close to human. The Guide tab shows which layer is active and lets you override the pick.

---

## Deploy

```bash
cd benjamin-math-climb
git init && git add . && git commit -m "Benjamin's math climb tracker"
git branch -M main
git remote add origin https://github.com/<you>/benjamin-math-climb.git
git push -u origin main
```

Then vercel.com to **Add New** to **Project** to import the repo. Framework preset **Other**, build command empty, output directory empty. Deploy.

Or `npx vercel --prod`. Local preview: `npm run dev`.

---

## Where the data lives

Browser `localStorage`, keyed to one device. **Nothing syncs.** If Benjamin taps blocks on a classroom Chromebook and you open the Guide tab on your laptop, those are two unconnected sets of numbers.

Pick one device and make it his. Open the gear and use **Copy all data** at each session close — that CSV is the real backup, and it is the artifact for parent updates and the L1 check chart.

---

## Files

```
index.html                  the whole app — standalone, no sibling files needed
                            (spoken lines are inlined in the VOICE-LINES block)
scripts/generate-voices.cjs one-time neural clip generator, reads that block
audio/                      generated mp3s land here
api/speak.js                optional live TTS proxy for typed-in problems
vercel.json                 caching + headers
```
