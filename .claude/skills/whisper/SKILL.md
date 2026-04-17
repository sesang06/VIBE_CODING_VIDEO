---
name: whisper-transcribe
description: OpenAI Whisper API로 오디오 파일을 필사(transcription)하여 Remotion Caption 형식의 JSON을 생성한다
metadata:
  tags: whisper, openai, transcription, captions, speech-to-text, subtitles
---

## When to use

오디오/영상 파일을 텍스트로 변환(필사)해야 할 때 사용한다.
Remotion의 `Caption` 타입 JSON을 생성하여 자막 컴포넌트에 바로 사용할 수 있다.

## Rules

- [rules/transcribe.md](rules/transcribe.md) — OpenAI Whisper API 필사 스크립트 작성 규칙

## Quick reference

### 환경 변수

```bash
export OPENAI_API_KEY=sk-...
```

### 지원 포맷

입력: `mp3`, `mp4`, `m4a`, `wav`, `webm`, `ogg`, `flac` (최대 25MB)

### 출력

`Caption[]` JSON — Remotion `@remotion/captions` 타입과 호환:

```ts
type Caption = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number | null;
};
```
