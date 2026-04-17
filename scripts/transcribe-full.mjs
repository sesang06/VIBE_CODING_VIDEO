import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY 필요");

const INPUT  = path.join(ROOT, "public/audio/albireo-16k.mp3");
const OUTPUT = path.join(ROOT, "public/captions/albireo-full.json");

// ── 1. Whisper 필사 ───────────────────────────────────────────────────
console.log("Whisper 필사 중 (전체 곡)...");
const form = new FormData();
form.append("file", new Blob([fs.readFileSync(INPUT)], { type: "audio/mpeg" }), "albireo.mp3");
form.append("model", "whisper-1");
form.append("response_format", "verbose_json");
form.append("timestamp_granularities[]", "segment");
form.append("language", "ja");

const wRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
  method: "POST",
  headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
  body: form,
});
if (!wRes.ok) throw new Error(`Whisper: ${await wRes.text()}`);
const wData = await wRes.json();
const segments = (wData.segments ?? []).filter(s => s.text.trim().length > 0);
console.log(`  → ${segments.length}개 세그먼트`);

// ── 2. GPT 번역 ───────────────────────────────────────────────────────
console.log("GPT 한국어 번역 중...");
const jaLines = segments.map(s => s.text.trim()).join("\n");

const gRes = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "당신은 일본어 노래 가사 번역 전문가입니다. 각 줄을 자연스러운 한국어로 번역하되 노래 감성을 살려주세요. 입력과 동일한 줄 수로 번역하고, 번호나 설명 없이 번역된 줄만 출력하세요."
      },
      { role: "user", content: jaLines }
    ],
    temperature: 0.3,
  }),
});
if (!gRes.ok) throw new Error(`GPT: ${await gRes.text()}`);
const gData = await gRes.json();
const koLines = gData.choices[0].message.content.trim().split("\n");

// ── 3. 결합 및 저장 ───────────────────────────────────────────────────
const captions = segments.map((seg, i) => ({
  ja: seg.text.trim(),
  ko: (koLines[i] ?? "").trim(),
  startMs: Math.round(seg.start * 1000),
  endMs:   Math.round(seg.end   * 1000),
}));

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(captions, null, 2));

console.log(`\n저장: ${OUTPUT}`);
console.log("─".repeat(60));
captions.forEach((c, i) => {
  const ts = `${(c.startMs/1000).toFixed(1)}s–${(c.endMs/1000).toFixed(1)}s`;
  console.log(`[${String(i+1).padStart(2)}] ${ts.padEnd(14)} ${c.ja}`);
  console.log(`      ${"".padEnd(14)} ${c.ko}`);
});
console.log(`\n총 길이: ${(captions[captions.length-1]?.endMs/1000).toFixed(1)}s`);
