---
name: whisper-transcribe-rules
description: OpenAI Whisper API를 사용해 오디오를 필사하고 Remotion Caption JSON을 생성하는 규칙
metadata:
  tags: whisper, openai, transcription, captions, script
---

# OpenAI Whisper API 필사 규칙

## 전제 조건

### API 키 확인

```bash
echo "${OPENAI_API_KEY:-NOT_SET}"
```

`NOT_SET`이면 사용자에게 알린다:

```
OPENAI_API_KEY가 설정되어 있지 않습니다.

export OPENAI_API_KEY=sk-...

또는 프로젝트 루트 .env 파일에 추가하세요 (커밋 금지):
  echo 'OPENAI_API_KEY=sk-...' >> .env
```

### 의존성

Node.js 내장 `fetch` 사용 (Node 18+). 추가 패키지 불필요.

## 스크립트 패턴

아래 패턴으로 `scripts/transcribe.mjs` 파일을 생성한다.

### 단일 파일 필사

```js
// scripts/transcribe.mjs
import fs from "fs";
import path from "path";
import FormData from "form-data"; // Node 18+에서는 전역 FormData 사용 가능

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY가 설정되지 않았습니다");

/**
 * OpenAI Whisper API로 오디오 파일을 필사한다.
 * @param {string} audioPath - 오디오 파일 절대/상대 경로
 * @param {string} language - 언어 코드 (예: "ko", "en", "ja"). 생략하면 자동 감지.
 * @returns {Promise<Caption[]>}
 */
async function transcribeAudio(audioPath, language = undefined) {
  const formData = new FormData();
  formData.append("file", fs.createReadStream(audioPath), path.basename(audioPath));
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json"); // 타임스탬프 포함
  formData.append("timestamp_granularities[]", "word");  // 단어 단위 타임스탬프
  if (language) formData.append("language", language);

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      ...formData.getHeaders?.() ?? {},
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Whisper API 오류 (${response.status}): ${err}`);
  }

  const data = await response.json();
  return toRemotionCaptions(data);
}

/**
 * Whisper verbose_json 응답을 Remotion Caption[] 형식으로 변환한다.
 * segment 단위(문장)로 변환한다. 단어 단위가 필요하면 data.words 배열을 사용.
 */
function toRemotionCaptions(data) {
  // 세그먼트(문장) 단위 캡션
  if (data.segments && data.segments.length > 0) {
    return data.segments.map((seg) => ({
      text: seg.text.trim(),
      startMs: Math.round(seg.start * 1000),
      endMs: Math.round(seg.end * 1000),
      timestampMs: Math.round(seg.start * 1000),
      confidence: seg.avg_logprob != null ? Math.exp(seg.avg_logprob) : null,
    }));
  }

  // fallback: 전체 텍스트를 하나의 캡션으로
  return [
    {
      text: data.text.trim(),
      startMs: 0,
      endMs: Math.round((data.duration ?? 0) * 1000),
      timestampMs: 0,
      confidence: null,
    },
  ];
}

// --- 실행 ---
const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath) {
  console.error("사용법: node scripts/transcribe.mjs <입력파일> [출력JSON경로]");
  process.exit(1);
}

console.log(`필사 중: ${inputPath}`);
const captions = await transcribeAudio(inputPath, "ko"); // 한국어: "ko"

const dest = outputPath ?? inputPath.replace(/\.[^.]+$/, ".captions.json");
fs.writeFileSync(dest, JSON.stringify(captions, null, 2));
console.log(`저장 완료: ${dest} (${captions.length}개 세그먼트)`);
```

실행:
```bash
node scripts/transcribe.mjs public/audio/narration.mp3 public/captions/narration.json
```

### 여러 파일 일괄 필사

```js
// scripts/transcribe-all.mjs
import fs from "fs";
import path from "path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY가 설정되지 않았습니다");

const AUDIO_DIR = "public/audio";
const OUT_DIR = "public/captions";

fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs.readdirSync(AUDIO_DIR).filter((f) =>
  /\.(mp3|mp4|m4a|wav|webm|ogg|flac)$/i.test(f)
);

console.log(`총 ${files.length}개 파일 필사 시작`);

for (const file of files) {
  const inputPath = path.join(AUDIO_DIR, file);
  const outputPath = path.join(OUT_DIR, file.replace(/\.[^.]+$/, ".json"));

  if (fs.existsSync(outputPath)) {
    console.log(`건너뜀 (이미 존재): ${outputPath}`);
    continue;
  }

  console.log(`[${files.indexOf(file) + 1}/${files.length}] ${file}`);

  try {
    const formData = new FormData();
    formData.append("file", new Blob([fs.readFileSync(inputPath)]), file);
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    formData.append("timestamp_granularities[]", "word");
    formData.append("language", "ko");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    const data = await res.json();

    const captions = (data.segments ?? []).map((seg) => ({
      text: seg.text.trim(),
      startMs: Math.round(seg.start * 1000),
      endMs: Math.round(seg.end * 1000),
      timestampMs: Math.round(seg.start * 1000),
      confidence: seg.avg_logprob != null ? Math.exp(seg.avg_logprob) : null,
    }));

    fs.writeFileSync(outputPath, JSON.stringify(captions, null, 2));
    console.log(`  → 저장: ${outputPath} (${captions.length}개 세그먼트)`);
  } catch (err) {
    console.error(`  ✗ 실패: ${err.message}`);
  }
}

console.log("완료");
```

실행:
```bash
node scripts/transcribe-all.mjs
```

## 주요 옵션

| 파라미터 | 값 | 설명 |
|---|---|---|
| `model` | `"whisper-1"` | 현재 유일한 Whisper 모델 |
| `response_format` | `"verbose_json"` | 타임스탬프 포함 JSON (권장) |
| `timestamp_granularities[]` | `"word"` or `"segment"` | 타임스탬프 단위 |
| `language` | `"ko"`, `"en"`, `"ja"` 등 | 명시하면 정확도↑, 생략하면 자동 감지 |
| `prompt` | 문자열 | 이전 문맥이나 고유명사 힌트 제공 |

## 파일 크기 제한 (25MB) 초과 시

FFmpeg로 분할 후 필사:

```bash
# 10분 단위로 분할
ffmpeg -i input.mp3 -f segment -segment_time 600 -c copy parts/part%03d.mp3
```

각 파트를 필사 후 타임스탬프를 누적 오프셋으로 보정한다:

```js
let offsetMs = 0;
for (const part of parts) {
  const captions = await transcribe(part.path);
  const adjusted = captions.map((c) => ({
    ...c,
    startMs: c.startMs + offsetMs,
    endMs: c.endMs + offsetMs,
    timestampMs: (c.timestampMs ?? c.startMs) + offsetMs,
  }));
  allCaptions.push(...adjusted);
  offsetMs += part.durationMs;
}
```

## Remotion에서 사용

```tsx
import captionsData from "../public/captions/narration.json";
import type { Caption } from "@remotion/captions";
import { useCurrentFrame } from "remotion";

const captions = captionsData as Caption[];

export const SubtitleBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  const current = captions.find(
    (c) => currentMs >= c.startMs && currentMs < c.endMs
  );

  return (
    <div style={{ position: "absolute", bottom: 80, width: "100%" }}>
      <p style={{ textAlign: "center", color: "#fff", fontSize: 48 }}>
        {current?.text ?? ""}
      </p>
    </div>
  );
};
```

자세한 자막 표시 방법은 `.claude/skills/remotion/rules/display-captions.md` 참고.
