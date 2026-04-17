import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY가 설정되지 않았습니다");

const INPUT = path.join(ROOT, "public/audio/lyrics-30s.mp3");
const OUTPUT = path.join(ROOT, "public/captions/lyrics.json");

// ── 1. Whisper 필사 (일본어) ──────────────────────────────────────────
console.log("Whisper 필사 중...");

const form = new FormData();
form.append("file", new Blob([fs.readFileSync(INPUT)], { type: "audio/mpeg" }), "lyrics-30s.mp3");
form.append("model", "whisper-1");
form.append("response_format", "verbose_json");
form.append("timestamp_granularities[]", "segment");
form.append("language", "ja");

const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
  method: "POST",
  headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
  body: form,
});
if (!whisperRes.ok) throw new Error(`Whisper 오류: ${await whisperRes.text()}`);
const whisperData = await whisperRes.json();

const segments = whisperData.segments ?? [];
console.log(`  → ${segments.length}개 세그먼트 감지`);

// ── 2. GPT로 한국어 번역 ─────────────────────────────────────────────
console.log("한국어 번역 중...");

const jaLines = segments.map((s) => s.text.trim()).join("\n");

const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "당신은 일본어 노래 가사 번역 전문가입니다. 각 줄을 자연스러운 한국어로 번역하되 노래 감성을 살려주세요. 입력은 줄바꿈으로 구분된 가사이며 같은 수의 줄로 번역하세요. 번호나 설명 없이 번역된 줄만 출력하세요.",
      },
      { role: "user", content: jaLines },
    ],
    temperature: 0.3,
  }),
});
if (!gptRes.ok) throw new Error(`GPT 오류: ${await gptRes.text()}`);
const gptData = await gptRes.json();
const koLines = gptData.choices[0].message.content.trim().split("\n");

// ── 3. 결합 ──────────────────────────────────────────────────────────
const captions = segments.map((seg, i) => ({
  ja: seg.text.trim(),
  ko: (koLines[i] ?? "").trim(),
  startMs: Math.round(seg.start * 1000),
  endMs: Math.round(seg.end * 1000),
}));

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(captions, null, 2));

console.log(`\n완료: ${OUTPUT}`);
console.log("─────────────────────────────────");
captions.forEach((c, i) => {
  const ts = `${(c.startMs / 1000).toFixed(1)}s–${(c.endMs / 1000).toFixed(1)}s`;
  console.log(`[${i + 1}] ${ts}`);
  console.log(`  JA: ${c.ja}`);
  console.log(`  KO: ${c.ko}`);
});
