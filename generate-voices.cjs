/* =========================================================================
   generate-voices.cjs — turn every fixed line in voice-lines.js into an mp3.
   Run once, commit the mp3s, and Benjamin never waits on an API call again.

     export OPENAI_API_KEY=sk-...        (or ELEVENLABS_API_KEY=...)
     npm run voices

   Re-run any time you edit voice-lines.js. Existing files are skipped unless
   you pass --force.
   ========================================================================= */

const fs = require("fs");
const path = require("path");

/* The lines live inside index.html so that file stays standalone.
   Pull them out of the marked block and run them against a fake window. */
const INDEX = path.join(__dirname, "..", "index.html");
const src = fs.readFileSync(INDEX, "utf8");
const block = src.split("/* ===== VOICE-LINES START ===== */")[1];
if (!block || !block.includes("/* ===== VOICE-LINES END ===== */")) {
  console.error("\n  Could not find the VOICE-LINES block in index.html.\n");
  process.exit(1);
}
const win = {};
new Function("window", block.split("/* ===== VOICE-LINES END ===== */")[0])(win);
const LINES = win.VOICE_LINES;

const OUT = path.join(__dirname, "..", "audio");
const FORCE = process.argv.includes("--force");

const ELEVEN = process.env.ELEVENLABS_API_KEY;
const OPENAI = process.env.OPENAI_API_KEY;

if (!ELEVEN && !OPENAI) {
  console.error("\n  No API key found.\n");
  console.error("  Set one of these, then run again:\n");
  console.error("    export OPENAI_API_KEY=sk-...           # cheapest, very natural");
  console.error("    export ELEVENLABS_API_KEY=...          # most human, costs more\n");
  process.exit(1);
}

const READING_STYLE =
  "Read slowly, warmly and clearly, as if reading aloud to a seven-year-old " +
  "who finds reading hard. Pause fully at every period. Never rush.";

async function synth(text) {
  if (ELEVEN) {
    const voice = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: "POST",
      headers: { "xi-api-key": ELEVEN, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.55, similarity_boost: 0.75, speed: 0.9 }
      })
    });
    if (!r.ok) throw new Error("ElevenLabs " + r.status + " " + (await r.text()).slice(0, 160));
    return Buffer.from(await r.arrayBuffer());
  }

  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: process.env.OPENAI_TTS_VOICE || "nova",
      input: text,
      speed: 0.9,
      instructions: READING_STYLE
    })
  });
  if (!r.ok) throw new Error("OpenAI " + r.status + " " + (await r.text()).slice(0, 160));
  return Buffer.from(await r.arrayBuffer());
}

(async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const todo = LINES.filter(l => FORCE || !fs.existsSync(path.join(OUT, l.id + ".mp3")));
  const chars = todo.reduce((n, l) => n + l.text.length, 0);

  console.log(`\n  ${LINES.length} lines total, ${todo.length} to generate (${chars} characters).`);
  console.log(`  Provider: ${ELEVEN ? "ElevenLabs" : "OpenAI"}\n`);

  if (!todo.length) { console.log("  Everything is already generated. Use --force to redo.\n"); return; }

  let ok = 0, failed = [];
  for (const line of todo) {
    const file = path.join(OUT, line.id + ".mp3");
    process.stdout.write(`  ${String(ok + failed.length + 1).padStart(3)}/${todo.length}  ${line.id} … `);
    try {
      fs.writeFileSync(file, await synth(line.text));
      ok++;
      console.log("ok");
    } catch (e) {
      failed.push(line.id);
      console.log("FAILED — " + e.message);
    }
    await new Promise(r => setTimeout(r, 250)); // stay under rate limits
  }

  console.log(`\n  Done. ${ok} written to audio/.`);
  if (failed.length) console.log(`  ${failed.length} failed: ${failed.join(", ")}\n  Re-run to retry just those.`);
  console.log("\n  Next: git add audio && git commit -m 'voice clips' && git push\n");
})();
