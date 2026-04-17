import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import lyricsData from "../public/captions/lyrics.json";

loadFont({ family: "Jalnan2", url: staticFile("Jalnan2TTF.ttf") });

const FPS = 30;

type LyricLine = { ja: string; ko: string; startMs: number; endMs: number };
const LYRICS: LyricLine[] = lyricsData;
const msToF = (ms: number) => Math.round((ms / 1000) * FPS);

// ── 별 배경 ──────────────────────────────────────────────────────────
const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: (i * 137.508 + 19) % 100,
  y: (i * 93.71 + 37) % 100,
  r: ((i * 7 + 2) % 3) + 0.8,
  phase: i * 0.43,
}));

const Starfield: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill>
    {STARS.map((s, i) => {
      const twinkle = Math.sin((frame / FPS) * Math.PI * 1.1 + s.phase) * 0.35 + 0.65;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.r * 2,
            height: s.r * 2,
            borderRadius: "50%",
            background: "#fff",
            opacity: twinkle * 0.75,
          }}
        />
      );
    })}
  </AbsoluteFill>
);

// ── 알비레오 이중성 (황금 + 청색) ────────────────────────────────────
const AlbireoStar: React.FC<{ frame: number }> = ({ frame }) => {
  const angle = (frame / FPS) * Math.PI * 2 * 0.06;
  const dist = 38;
  const ax = Math.cos(angle) * dist;
  const ay = Math.sin(angle) * dist * 0.35;
  const bx = -ax;
  const by = -ay;
  const glow = Math.sin((frame / FPS) * Math.PI * 2 * 0.25) * 0.12 + 1;

  return (
    <div
      style={{
        position: "absolute",
        top: "18%",
        left: "50%",
        width: 0,
        height: 0,
      }}
    >
      {/* A — 황금색 */}
      <div
        style={{
          position: "absolute",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "radial-gradient(circle, #ffe87c 0%, #ff9900 55%, transparent 100%)",
          boxShadow: "0 0 28px 12px rgba(255,200,0,0.45)",
          transform: `translate(calc(-50% + ${ax}px), calc(-50% + ${ay}px)) scale(${glow})`,
        }}
      />
      {/* B — 청색 */}
      <div
        style={{
          position: "absolute",
          width: 11,
          height: 11,
          borderRadius: "50%",
          background: "radial-gradient(circle, #cceeff 0%, #3399ff 55%, transparent 100%)",
          boxShadow: "0 0 18px 7px rgba(80,170,255,0.45)",
          transform: `translate(calc(-50% + ${bx}px), calc(-50% + ${by}px)) scale(${glow * 0.85})`,
        }}
      />
      {/* 연결 희미한 빛 */}
      <div
        style={{
          position: "absolute",
          width: dist * 2 + 20,
          height: 1,
          background:
            "linear-gradient(to right, rgba(80,170,255,0.15), rgba(255,200,0,0.15))",
          transform: `translate(calc(-50% + ${bx / 2}px), calc(-50% + ${by / 2}px)) rotate(${(angle * 180) / Math.PI}deg)`,
        }}
      />
    </div>
  );
};

// ── 일본어 문자별 등장 ────────────────────────────────────────────────
const JapaneseChars: React.FC<{
  text: string;
  localFrame: number;
  exitOpacity: number;
}> = ({ text, localFrame, exitOpacity }) => {
  const chars = Array.from(text);
  const CHAR_DELAY = 3;

  return (
    <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap" }}>
      {chars.map((ch, i) => {
        const cs = i * CHAR_DELAY;
        const opacity =
          interpolate(localFrame, [cs, cs + 7], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }) * exitOpacity;
        const y = interpolate(localFrame, [cs, cs + 7], [28, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const scale = interpolate(localFrame, [cs, cs + 7], [1.4, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.back(1.2)),
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity,
              transform: `translateY(${y}px) scale(${scale})`,
            }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        );
      })}
    </div>
  );
};

// ── 메인 가사 렌더러 ──────────────────────────────────────────────────
const LyricBlock: React.FC<{ lyric: LyricLine; frame: number; capFrame: number }> = ({
  lyric,
  frame,
  capFrame,
}) => {
  const segStart = msToF(lyric.startMs);
  const segEnd = Math.min(msToF(lyric.endMs), capFrame);

  if (frame < segStart || frame > segEnd) return null;

  const localFrame = frame - segStart;
  const segDur = segEnd - segStart;

  const exitStart = Math.max(segDur - 14, segDur * 0.75);
  const exitOpacity = interpolate(localFrame, [exitStart, segDur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const koOpacity =
    interpolate(localFrame, [8, 20], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) * exitOpacity;
  const koY = interpolate(localFrame, [8, 20], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{ textAlign: "center" }}>
      {/* 일본어 */}
      <div
        style={{
          fontSize: 86,
          fontWeight: 700,
          fontFamily: '"Noto Serif JP", serif',
          color: "#eef4ff",
          letterSpacing: "0.06em",
          lineHeight: 1.25,
          textShadow: "0 0 50px rgba(120,180,255,0.55), 0 2px 10px rgba(0,0,0,0.9)",
        }}
      >
        <JapaneseChars text={lyric.ja} localFrame={localFrame} exitOpacity={exitOpacity} />
      </div>

      {/* 구분선 */}
      <div
        style={{
          width: 60,
          height: 1,
          background: "rgba(150,200,255,0.35)",
          margin: "14px auto 14px",
          opacity: koOpacity,
        }}
      />

      {/* 한국어 */}
      <div
        style={{
          fontSize: 34,
          fontWeight: 400,
          fontFamily: "Jalnan2, sans-serif",
          color: "rgba(180,215,255,0.88)",
          letterSpacing: "0.04em",
          opacity: koOpacity,
          transform: `translateY(${koY}px)`,
          textShadow: "0 2px 14px rgba(0,0,0,0.95)",
        }}
      >
        {lyric.ko}
      </div>
    </div>
  );
};

// ── 악기 구간 (가사 없는 시간) 파동 효과 ─────────────────────────────
const InstrumentalPulse: React.FC<{ frame: number; visible: boolean }> = ({ frame, visible }) => {
  const rings = [0, 1, 2];
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        opacity: visible ? 0.22 : 0,
      }}
    >
      {rings.map((r) => {
        const phase = (frame / FPS) * 0.5 + r * 0.33;
        const scale = (Math.sin(phase * Math.PI * 2) * 0.15 + 1) * (1 + r * 0.6);
        return (
          <div
            key={r}
            style={{
              position: "absolute",
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: "1px solid rgba(120,180,255,0.6)",
              transform: `translate(-50%, -50%) scale(${scale})`,
              transformOrigin: "0 0",
            }}
          />
        );
      })}
    </div>
  );
};

// ── 컴포지션 ─────────────────────────────────────────────────────────
export const LyricsVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const currentMs = (frame / FPS) * 1000;

  const hasLyric = LYRICS.some(
    (l) => currentMs >= l.startMs && currentMs < l.endMs
  );

  // 전체 페이드인
  const introOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(170deg, #010b1f 0%, #040e2a 35%, #0b1535 65%, #030b1c 100%)",
        opacity: introOpacity,
      }}
    >
      <Audio src={staticFile("audio/lyrics-30s.mp3")} />

      <Starfield frame={frame} />
      <AlbireoStar frame={frame} />

      {/* 악기 구간 펄스 */}
      <InstrumentalPulse frame={frame} visible={!hasLyric} />

      {/* 가사 */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 120px",
        }}
      >
        {LYRICS.map((lyric, i) => (
          <LyricBlock
            key={i}
            lyric={lyric}
            frame={frame}
            capFrame={durationInFrames}
          />
        ))}
      </AbsoluteFill>

      {/* 비네트 */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 45%, rgba(0,0,0,0.75) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

export const LYRICS_DURATION = 30 * FPS;
export { FPS as LYRICS_FPS };
