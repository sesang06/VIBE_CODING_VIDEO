import React from "react";
import {
  AbsoluteFill, Audio, Easing, interpolate,
  staticFile, useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import { TransitionSeries, springTiming, linearTiming } from "@remotion/transitions";
import { fade }  from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe }  from "@remotion/transitions/wipe";
import { flip }  from "@remotion/transitions/flip";
import lyricsData from "../public/captions/albireo-full.json";

loadFont({ family: "Jalnan2", url: staticFile("Jalnan2TTF.ttf") });

// ── 상수 ───────────────────────────────────────────────────────────────
const FPS = 30;
const T   = 45; // 전환 겹침 프레임 (1.5초)

type Lyric = { ja: string; ko: string; startMs: number; endMs: number };
const ALL: Lyric[] = lyricsData;

// 씬 경계 (ms / frames)
const B_MS = [0, 48800, 91800, 128800, 168800, 207840] as const;
const B_F  = B_MS.map(ms => Math.round(ms * FPS / 1000)); // [0,1464,2754,3864,5064,6235]

// 씬별 콘텐츠 길이
const S = B_F.slice(1).map((f, i) => f - B_F[i]); // [1464,1290,1110,1200,1171]

// TransitionSeries.Sequence 길이 (마지막 씬 제외 +T)
const Q = S.map((d, i) => i < 4 ? d + T : d);

export const ALBIREO_TOTAL = B_F[5]; // 6235
export const ALBIREO_FPS   = FPS;

// ── 공통 헬퍼 ─────────────────────────────────────────────────────────

function lyricState(lf: number, gs: number, bMs: readonly [number, number]) {
  const ms = ((lf + gs) / FPS) * 1000;
  const l  = ALL.find(x => ms >= x.startMs && ms < x.endMs
                       && x.startMs >= bMs[0] && x.startMs < bMs[1]) ?? null;
  if (!l) return { l: null, f: 0, dur: 0, exit: 0 };
  const f    = lf - (Math.round(l.startMs * FPS / 1000) - gs);
  const dur  = Math.round((l.endMs - l.startMs) * FPS / 1000);
  const eLen = Math.min(14, Math.floor(dur * 0.3));
  const exit = interpolate(f, [dur - eLen, dur], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { l, f, dur, exit };
}

// 문자별 위-아래 등장
function CharUp({ text, frame, delay = 0, cd = 3, exit = 1, style }: {
  text: string; frame: number; delay?: number; cd?: number;
  exit?: number; style?: React.CSSProperties;
}) {
  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", justifyContent: "center", ...style }}>
      {Array.from(text).map((ch, i) => {
        const cs = delay + i * cd;
        const op  = interpolate(frame, [cs, cs + 8], [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * exit;
        const y   = interpolate(frame, [cs, cs + 8], [22, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
        const sc  = interpolate(frame, [cs, cs + 8], [1.35, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.2)) });
        return (
          <span key={i} style={{ display: "inline-block", opacity: op,
            transform: `translateY(${y}px) scale(${sc})` }}>
            {ch === " " ? "\u00A0" : ch}
          </span>
        );
      })}
    </span>
  );
}

// 왼쪽에서 슬라이드 인
function SlideLeft({ text, frame, exit = 1, style }: {
  text: string; frame: number; exit?: number; style?: React.CSSProperties;
}) {
  const op = interpolate(frame, [0, 14], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * exit;
  const x  = interpolate(frame, [0, 14], [-60, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <span style={{ display: "inline-block", opacity: op,
      transform: `translateX(${x}px)`, ...style }}>{text}</span>
  );
}

// 위에서 바운스 낙하 (문자별)
function CharBounce({ text, frame, cd = 4, exit = 1, style }: {
  text: string; frame: number; cd?: number; exit?: number; style?: React.CSSProperties;
}) {
  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", justifyContent: "center", ...style }}>
      {Array.from(text).map((ch, i) => {
        const cs = i * cd;
        const op  = interpolate(frame, [cs, cs + 6], [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * exit;
        const y   = interpolate(frame, [cs, cs + 16], [-50, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp",
            easing: Easing.out(Easing.bounce) });
        return (
          <span key={i} style={{ display: "inline-block", opacity: op,
            transform: `translateY(${y}px)` }}>
            {ch === " " ? "\u00A0" : ch}
          </span>
        );
      })}
    </span>
  );
}

// 타이프라이터
function Typewriter({ text, frame, cps = 2, exit = 1, style }: {
  text: string; frame: number; cps?: number; exit?: number; style?: React.CSSProperties;
}) {
  const visible = Math.floor(frame / cps);
  return (
    <span style={{ opacity: exit, ...style }}>
      {text.slice(0, visible)}
      {visible < text.length && (
        <span style={{ opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0 }}>|</span>
      )}
    </span>
  );
}

// ── 비네트 ─────────────────────────────────────────────────────────────
const Vignette: React.FC = () => (
  <AbsoluteFill style={{
    background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 45%, rgba(0,0,0,0.72) 100%)",
    pointerEvents: "none",
  }} />
);

// ══════════════════════════════════════════════════════════════════════
// 씬 1 — 宇宙 (우주) · 딥 스페이스 + 알비레오 이중성
// ══════════════════════════════════════════════════════════════════════

const STARS = Array.from({ length: 85 }, (_, i) => ({
  x: (i * 137.508 + 19) % 100,
  y: (i * 93.71  + 37) % 100,
  r: ((i * 7 + 2) % 3) + 0.8,
  ph: i * 0.43,
}));

const SceneCosmos: React.FC<{ gs: number; seqDur: number }> = ({ gs }) => {
  const frame = useCurrentFrame();
  const { l, f, exit } = lyricState(frame, gs, [B_MS[0], B_MS[1]]);

  const angle = (frame / FPS) * Math.PI * 2 * 0.06;
  const d = 42;
  const glow = Math.sin((frame / FPS) * Math.PI * 2 * 0.25) * 0.12 + 1;

  const ko  = l ? interpolate(f, [10, 22], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * exit : 0;
  const koY = l ? interpolate(f, [10, 22], [20, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 0;

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(170deg, #010812 0%, #030f2a 55%, #05111e 100%)",
    }}>
      {/* 별 */}
      {STARS.map((s, i) => {
        const tw = Math.sin((frame / FPS) * Math.PI * 1.1 + s.ph) * 0.35 + 0.65;
        return <div key={i} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: s.r * 2, height: s.r * 2,
          borderRadius: "50%", background: "#fff", opacity: tw * 0.72,
        }} />;
      })}

      {/* 알비레오 */}
      <div style={{ position: "absolute", top: "14%", left: "50%", width: 0, height: 0 }}>
        <div style={{
          position: "absolute", width: 20, height: 20, borderRadius: "50%",
          background: "radial-gradient(circle, #ffe87c 0%, #ff9900 55%, transparent 100%)",
          boxShadow: "0 0 30px 12px rgba(255,200,0,0.42)",
          transform: `translate(calc(-50% + ${Math.cos(angle)*d}px), calc(-50% + ${Math.sin(angle)*d*0.3}px)) scale(${glow})`,
        }} />
        <div style={{
          position: "absolute", width: 11, height: 11, borderRadius: "50%",
          background: "radial-gradient(circle, #d4f0ff 0%, #3399ff 55%, transparent 100%)",
          boxShadow: "0 0 18px 7px rgba(80,170,255,0.42)",
          transform: `translate(calc(-50% + ${-Math.cos(angle)*d}px), calc(-50% + ${-Math.sin(angle)*d*0.3}px)) scale(${glow*0.85})`,
        }} />
      </div>

      {/* 가사 */}
      {l && (
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 82, fontWeight: 700,
              fontFamily: '"Noto Serif JP", serif',
              color: "#edf4ff", letterSpacing: "0.07em", lineHeight: 1.25,
              textShadow: "0 0 55px rgba(120,180,255,0.5), 0 2px 10px rgba(0,0,0,0.95)",
            }}>
              <CharUp text={l.ja} frame={f} exit={exit} />
            </div>
            <div style={{
              width: 56, height: 1,
              background: "rgba(150,200,255,0.35)",
              margin: "14px auto",
              opacity: ko,
            }} />
            <div style={{
              fontSize: 32, fontFamily: "Jalnan2, sans-serif",
              color: "rgba(180,215,255,0.88)", letterSpacing: "0.04em",
              opacity: ko, transform: `translateY(${koY}px)`,
              textShadow: "0 2px 14px rgba(0,0,0,0.95)",
            }}>
              {l.ko}
            </div>
          </div>
        </AbsoluteFill>
      )}
      <Vignette />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════
// 씬 2 — 夜雨 (밤비) · 어두운 빗속, 좌측 정렬 텍스트
// ══════════════════════════════════════════════════════════════════════

const RAIN = Array.from({ length: 55 }, (_, i) => ({
  x:     (i * 137.5 + 23) % 100,
  speed: ((i * 7 + 13) % 5) + 1.2,
  len:   ((i * 11 + 3) % 45) + 18,
  op:    ((i * 13 + 7) % 5) * 0.08 + 0.12,
  start: (i * 57.3) % 100,
}));

const SceneRain: React.FC<{ gs: number; seqDur: number }> = ({ gs }) => {
  const frame = useCurrentFrame();
  const { l, f, exit } = lyricState(frame, gs, [B_MS[1], B_MS[2]]);

  const koOp = l ? interpolate(f, [12, 24], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * exit : 0;
  const koX  = l ? interpolate(f, [12, 24], [30, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 0;

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(175deg, #04050c 0%, #080c18 50%, #030509 100%)",
    }}>
      {/* 빗줄기 */}
      {RAIN.map((r, i) => {
        const y = ((frame * r.speed * 0.4 + r.start) % 115) - 10;
        return (
          <div key={i} style={{
            position: "absolute",
            left: `${r.x}%`,
            top: `${y}%`,
            width: 1,
            height: r.len,
            background: `linear-gradient(to bottom, transparent, rgba(120,160,220,${r.op}) 30%, rgba(150,190,255,${r.op*0.8}) 70%, transparent)`,
            transform: "rotate(12deg)",
          }} />
        );
      })}

      {/* 하단 안개 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "18%",
        background: "linear-gradient(to top, rgba(15,25,50,0.6), transparent)",
        pointerEvents: "none",
      }} />

      {/* 가사 — 좌측 정렬 */}
      {l && (
        <AbsoluteFill style={{
          display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-start",
          paddingLeft: "10%",
        }}>
          <div>
            {/* 좌측 강조 바 */}
            <div style={{
              width: 4, height: "100%",
              position: "absolute", left: "calc(10% - 20px)",
              background: "linear-gradient(to bottom, transparent, rgba(100,160,255,0.6), transparent)",
              opacity: exit,
            }} />
            <div style={{
              fontSize: 76, fontWeight: 700,
              fontFamily: '"Noto Serif JP", serif',
              color: "#ccdeff", letterSpacing: "0.04em", lineHeight: 1.3,
              textShadow: "0 0 40px rgba(80,130,220,0.55), 0 2px 12px rgba(0,0,0,0.95)",
            }}>
              <SlideLeft text={l.ja} frame={f} exit={exit} />
            </div>
            <div style={{
              fontSize: 30, fontFamily: "Jalnan2, sans-serif",
              color: "rgba(140,180,240,0.82)", letterSpacing: "0.05em",
              marginTop: 12,
              opacity: koOp, transform: `translateX(${koX}px)`,
              textShadow: "0 2px 14px rgba(0,0,0,0.95)",
            }}>
              {l.ko}
            </div>
          </div>
        </AbsoluteFill>
      )}
      <Vignette />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════
// 씬 3 — 光年 (광년) · 따뜻한 황금빛, 확장하는 빛 링
// ══════════════════════════════════════════════════════════════════════

const SceneLight: React.FC<{ gs: number; seqDur: number }> = ({ gs }) => {
  const frame = useCurrentFrame();
  const { l, f, exit } = lyricState(frame, gs, [B_MS[2], B_MS[3]]);

  const RING_PERIOD = 90;
  const rings = [0, 1, 2];

  const jaOp = l ? interpolate(f, [0, 18], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * exit : 0;
  const jaScale = l ? interpolate(f, [0, 18], [1.22, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 1;
  const koOp = l ? interpolate(f, [14, 28], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * exit : 0;
  const koSpacing = l ? interpolate(f, [14, 30], [0.35, 0.05],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 0.05;

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(170deg, #120800 0%, #1e0e00 35%, #2a1400 65%, #100700 100%)",
    }}>
      {/* 중심 빛 빛남 */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: 300, height: 300,
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(circle, rgba(255,170,40,0.18) 0%, rgba(255,120,20,0.06) 50%, transparent 100%)",
        borderRadius: "50%",
      }} />

      {/* 확장 링 */}
      {rings.map((r) => {
        const ph  = (frame + r * (RING_PERIOD / 3)) % RING_PERIOD;
        const sc  = interpolate(ph, [0, RING_PERIOD], [0.15, 1.8], { extrapolateRight: "clamp" });
        const op  = interpolate(ph, [0, RING_PERIOD * 0.25, RING_PERIOD],
          [0.6, 0.35, 0], { extrapolateRight: "clamp" });
        return (
          <div key={r} style={{
            position: "absolute", top: "50%", left: "50%",
            width: 240, height: 240,
            borderRadius: "50%",
            border: "1px solid rgba(255,160,40,0.55)",
            transform: `translate(-50%, -50%) scale(${sc})`,
            opacity: op,
          }} />
        );
      })}

      {/* 황금 파티클 */}
      {Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2 + frame * 0.008;
        const radius = ((frame * 0.3 + i * 17) % 260) + 30;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius * 0.55;
        const sz = ((i * 3 + 1) % 3) + 1;
        const op = interpolate(radius, [30, 200, 290], [0.1, 0.6, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={i} style={{
            position: "absolute", top: "50%", left: "50%",
            width: sz, height: sz, borderRadius: "50%",
            background: `hsl(${30 + i*5 % 20}, 100%, 70%)`,
            transform: `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`,
            opacity: op,
          }} />
        );
      })}

      {/* 가사 — 중앙, 줌인 */}
      {l && (
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 80, fontWeight: 700,
              fontFamily: '"Noto Serif JP", serif',
              color: "#fff7e8", letterSpacing: "0.07em", lineHeight: 1.25,
              textShadow: "0 0 50px rgba(255,160,50,0.65), 0 2px 10px rgba(0,0,0,0.95)",
              opacity: jaOp, transform: `scale(${jaScale})`,
              display: "block",
            }}>
              {l.ja}
            </div>
            <div style={{
              fontSize: 31, fontFamily: "Jalnan2, sans-serif",
              color: "rgba(255,210,130,0.88)", letterSpacing: `${koSpacing}em`,
              marginTop: 16, opacity: koOp,
              textShadow: "0 2px 14px rgba(0,0,0,0.95)",
            }}>
              {l.ko}
            </div>
          </div>
        </AbsoluteFill>
      )}
      <Vignette />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════
// 씬 4 — 燃焼 (연소) · 불씨 파티클, 우측 정렬, 강렬한 붉은 빛
// ══════════════════════════════════════════════════════════════════════

const EMBERS = Array.from({ length: 65 }, (_, i) => ({
  x:     (i * 137.5 + 40) % 100,
  speed: ((i * 7 + 3)  % 4) + 0.8,
  drift: ((i * 11 + 5) % 5) - 2.2,
  size:  ((i * 5  + 2)  % 3) + 1.5,
  hue:   (i * 23) % 40,
  op:    ((i * 17 + 9)  % 5) * 0.1 + 0.3,
  sy:    (i * 57.3) % 100,
}));

const SceneFire: React.FC<{ gs: number; seqDur: number }> = ({ gs }) => {
  const frame = useCurrentFrame();
  const { l, f, exit } = lyricState(frame, gs, [B_MS[3], B_MS[4]]);

  const koOp = l ? interpolate(f, [8, 20], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * exit : 0;

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(170deg, #0c0000 0%, #180300 35%, #240600 65%, #0a0000 100%)",
    }}>
      {/* 불씨 파티클 */}
      {EMBERS.map((e, i) => {
        const y = 100 - ((frame * e.speed * 0.35 + e.sy) % 115);
        const x = e.x + Math.sin(frame * 0.04 + i) * e.drift * 0.6;
        const opacity = y > 85 || y < 5
          ? e.op * interpolate(y, [5, 15, 80, 95], [0, 1, 1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          : e.op;
        return (
          <div key={i} style={{
            position: "absolute",
            left: `${x}%`, top: `${y}%`,
            width: e.size, height: e.size,
            borderRadius: "50%",
            background: `hsl(${e.hue}, 100%, 65%)`,
            boxShadow: `0 0 ${e.size * 3}px ${e.size}px hsl(${e.hue}, 100%, 55%, 0.3)`,
            opacity,
          }} />
        );
      })}

      {/* 하단 열기 효과 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "20%",
        background: "linear-gradient(to top, rgba(80,10,0,0.6) 0%, rgba(60,5,0,0.2) 60%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* 가사 — 우측 정렬 */}
      {l && (
        <AbsoluteFill style={{
          display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-end",
          paddingRight: "10%",
        }}>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: 78, fontWeight: 700,
              fontFamily: '"Noto Serif JP", serif',
              color: "#fff0e8", letterSpacing: "0.05em", lineHeight: 1.3,
              textShadow: "0 0 50px rgba(255,80,20,0.65), 0 2px 10px rgba(0,0,0,0.95)",
            }}>
              <CharBounce text={l.ja} frame={f} exit={exit} />
            </div>
            <div style={{
              fontSize: 30, fontFamily: "Jalnan2, sans-serif",
              color: "rgba(255,180,120,0.88)", letterSpacing: "0.04em",
              marginTop: 12, opacity: koOp,
              textShadow: "0 2px 14px rgba(0,0,0,0.95)",
            }}>
              <Typewriter text={l.ko} frame={f} exit={exit} cps={2} />
            </div>
          </div>
        </AbsoluteFill>
      )}
      <Vignette />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════
// 씬 5 — 余韻 (여운) · 보라빛 여백, 서서히 퍼지는 원, 엔딩 클라이맥스
// ══════════════════════════════════════════════════════════════════════

const ECHO_CIRCLES = Array.from({ length: 8 }, (_, i) => ({
  x:    (i * 137.5 + 20) % 100,
  y:    (i * 93.7  + 30) % 80 + 10,
  sz:   ((i * 37 + 50)   % 150) + 100,
  v:    ((i * 7  + 2)    % 3   - 1) * 0.018,
  op:   ((i * 13 + 5)    % 4)  * 0.018 + 0.025,
}));

const SceneEcho: React.FC<{ gs: number; seqDur: number }> = ({ gs, seqDur }) => {
  const frame = useCurrentFrame();
  const { l, f, exit } = lyricState(frame, gs, [B_MS[4], B_MS[5]]);

  // 마지막 곡 — 페이드 아웃
  const fadeOut = interpolate(frame, [seqDur - 40, seqDur], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 마지막 가사 (아웃트로 アルヴィレオ) 판정
  const isLast = l ? ALL.indexOf(l) === ALL.length - 1 : false;
  const jaSz = isLast ? 130 : 78;

  const jaOp = l ? interpolate(f, [0, 18], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * exit * fadeOut : 0;
  const jaScale = l ? interpolate(f, [0, 18], [0.88, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 1;
  const koOp = l && !isLast ? interpolate(f, [14, 28], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * exit * fadeOut : 0;
  const koY  = l ? interpolate(f, [14, 28], [18, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 0;

  const jaGlow = isLast
    ? `0 0 80px rgba(180,130,255,0.7), 0 0 30px rgba(200,160,255,0.5), 0 2px 12px rgba(0,0,0,0.95)`
    : `0 0 50px rgba(160,100,255,0.5), 0 2px 10px rgba(0,0,0,0.95)`;

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(170deg, #06010f 0%, #0d0320 50%, #080118 100%)",
      opacity: fadeOut,
    }}>
      {/* 떠다니는 반투명 원 */}
      {ECHO_CIRCLES.map((c, i) => {
        const cx = (c.x + frame * c.v) % 110;
        return (
          <div key={i} style={{
            position: "absolute",
            left: `${cx}%`, top: `${c.y}%`,
            width: c.sz, height: c.sz,
            borderRadius: "50%",
            border: "1px solid rgba(150,100,255,0.18)",
            background: "radial-gradient(circle, rgba(120,70,210,0.04) 0%, transparent 70%)",
            transform: "translate(-50%, -50%)",
          }} />
        );
      })}

      {/* 은하 느낌 중심 빛 */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: 500, height: 500,
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(circle, rgba(100,50,180,0.12) 0%, rgba(60,20,120,0.04) 50%, transparent 100%)",
        borderRadius: "50%",
      }} />

      {/* 가사 */}
      {l && (
        <AbsoluteFill style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 120px",
        }}>
          <div style={{ textAlign: "center", width: "100%" }}>
            <div style={{
              fontSize: jaSz, fontWeight: 700,
              fontFamily: '"Noto Serif JP", serif',
              color: isLast ? "#f0e8ff" : "#e8e0ff",
              letterSpacing: isLast ? "0.18em" : "0.07em",
              lineHeight: 1.25,
              textShadow: jaGlow,
              opacity: jaOp,
              transform: `scale(${jaScale})`,
              display: "block",
            }}>
              {l.ja}
            </div>
            {!isLast && (
              <div style={{
                fontSize: 31, fontFamily: "Jalnan2, sans-serif",
                color: "rgba(200,170,255,0.85)", letterSpacing: "0.05em",
                marginTop: 16, opacity: koOp,
                transform: `translateY(${koY}px)`,
                textShadow: "0 2px 14px rgba(0,0,0,0.95)",
              }}>
                {l.ko}
              </div>
            )}
          </div>
        </AbsoluteFill>
      )}
      <Vignette />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════
// 메인 컴포지션
// ══════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTr = { p: any; ti: any };
const TRANSITIONS: AnyTr[] = [
  { p: fade(),                              ti: linearTiming({ durationInFrames: T }) },
  { p: slide({ direction: "from-bottom" }), ti: springTiming({ config: { damping: 180 } }) },
  { p: wipe({ direction: "from-left" }),    ti: springTiming({ config: { damping: 160 } }) },
  { p: flip({ direction: "from-right" }),   ti: springTiming({ config: { damping: 200 } }) },
];

const SCENES = [
  { C: SceneCosmos, gs: B_F[0] },
  { C: SceneRain,   gs: B_F[1] },
  { C: SceneLight,  gs: B_F[2] },
  { C: SceneFire,   gs: B_F[3] },
  { C: SceneEcho,   gs: B_F[4] },
] as const;

export const AlbireoVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/albireo-full.mp3")} />
      <TransitionSeries>
        {SCENES.map(({ C, gs }, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Sequence durationInFrames={Q[i]}>
              <C gs={gs} seqDur={Q[i]} />
            </TransitionSeries.Sequence>
            {i < SCENES.length - 1 && (
              <TransitionSeries.Transition
                presentation={TRANSITIONS[i].p}
                timing={TRANSITIONS[i].ti}
              />
            )}
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
