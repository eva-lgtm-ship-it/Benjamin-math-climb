/* Vercel Serverless Function — neural text-to-speech proxy.
 *
 * Handles the ONE thing pre-recorded clips cannot: reading a word problem
 * that Benjamin just typed in, which nobody could have recorded in advance.
 *
 * Setup (optional — the app works without it, falling back to the device voice):
 *   1. Vercel dashboard -> Project -> Settings -> Environment Variables
 *   2. Add OPENAI_API_KEY  (or ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID)
 *   3. Redeploy.
 *
 * The key stays on the server. It is never sent to the browser.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  const { text, speed } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Send { text: '...' }." });
  }
  if (text.length > 1200) {
    return res.status(413).json({ error: "That problem is too long to read aloud. Break it into pieces." });
  }

  const eleven = process.env.ELEVENLABS_API_KEY;
  const openai = process.env.OPENAI_API_KEY;

  try {
    if (eleven) {
      const voice = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
        method: "POST",
        headers: { "xi-api-key": eleven, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: { stability: 0.55, similarity_boost: 0.75, speed: speed || 0.9 }
        })
      });
      if (!r.ok) throw new Error("ElevenLabs " + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.status(200).send(buf);
    }

    if (openai) {
      const r = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { Authorization: `Bearer ${openai}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini-tts",
          voice: process.env.OPENAI_TTS_VOICE || "nova",
          input: text,
          speed: speed || 0.9,
          instructions: "Read slowly and warmly, as if reading a math word problem aloud to a seven-year-old. Pause at every period."
        })
      });
      if (!r.ok) throw new Error("OpenAI " + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.status(200).send(buf);
    }

    return res.status(501).json({ error: "No TTS key configured. The app will use the device voice." });
  } catch (err) {
    return res.status(502).json({ error: "Voice service unavailable." });
  }
}
