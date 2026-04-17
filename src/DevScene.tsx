import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SceneVisuals, type LayoutConfig } from "./DevLayout";

export const TRANSITION_FRAMES = 20;

export type PepeDef = {
  src: string;
  naturalW: number;
  naturalH: number;
  position: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  enterFrame?: number;
  size?: number;
};

export type SceneData = {
  text: string;
  layout: LayoutConfig;
  audio: string;
  sfx: string;
  sfxVolume?: number;
  durationInFrames: number;
  gradient: string;
  pepe?: PepeDef;
  isLast?: boolean;
};

function PepeOverlay({ pepe }: { pepe: PepeDef }) {
  const frame = useCurrentFrame();
  const enter = pepe.enterFrame ?? 15;
  const targetH = pepe.size ?? 200;
  const ar = pepe.naturalW / pepe.naturalH;
  const w = targetH * ar;

  const opacity = interpolate(frame, [enter, enter + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const floatY = Math.sin((frame / 30) * Math.PI * 0.7) * 8;

  const margin = 32;
  const pos: React.CSSProperties = {};
  if (pepe.position === "top-right")    { pos.top    = margin; pos.right  = margin; }
  if (pepe.position === "top-left")     { pos.top    = margin; pos.left   = margin; }
  if (pepe.position === "bottom-right") { pos.bottom = margin; pos.right  = margin; }
  if (pepe.position === "bottom-left")  { pos.bottom = margin; pos.left   = margin; }

  return (
    <div
      style={{
        position: "absolute",
        ...pos,
        opacity,
        transform: `translateY(${floatY}px)`,
        filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.6))",
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      <Img
        src={staticFile(`페페더프로그/${pepe.src}`)}
        style={{ width: w, height: targetH, objectFit: "contain" }}
      />
    </div>
  );
}

export const DevScene: React.FC<SceneData> = ({
  text,
  layout,
  audio,
  sfx,
  sfxVolume = 0.55,
  durationInFrames,
  gradient,
  pepe,
  isLast = false,
}) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();

  const SUB_ENTER = 14;
  const subtitleIn = interpolate(frame, [0, SUB_ENTER], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const subtitleY = interpolate(frame, [0, SUB_ENTER], [50, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  // Last scene: subtitle stays visible until the very end (no outgoing transition)
  const subtitleFadeStart = isLast ? durationInFrames - 6 : durationInFrames - TRANSITION_FRAMES;
  const subtitleOut = interpolate(
    frame,
    [subtitleFadeStart, durationInFrames - 2],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Last scene: narration plays to its natural end without early fade
  const narrationVol = isLast
    ? 1
    : interpolate(
        frame,
        [durationInFrames - TRANSITION_FRAMES, durationInFrames - 3],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );

  const sfxVol = interpolate(
    frame,
    [0, 4, durationInFrames - 18, durationInFrames - 5],
    [0, sfxVolume, sfxVolume, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const subtitleH = Math.round(height * 0.22);
  const imgZoneH = height - subtitleH;

  return (
    <AbsoluteFill style={{ background: gradient, overflow: "hidden" }}>
      <Audio src={staticFile(`audio/${audio}`)} volume={narrationVol} />
      <Audio src={staticFile(`sfx/${sfx}`)} volume={sfxVol} />

      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: imgZoneH,
          overflow: "hidden",
        }}
      >
        <SceneVisuals layout={layout} zoneH={imgZoneH} />
        {pepe && <PepeOverlay pepe={pepe} />}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: subtitleH,
          background: "linear-gradient(to top, rgba(0,0,0,0.96) 65%, transparent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          boxSizing: "border-box",
        }}
      >
        <p
          style={{
            fontFamily: "Jalnan2",
            fontSize: 52,
            color: "#ffffff",
            textAlign: "center",
            textShadow: "0 4px 20px rgba(0,0,0,0.95), 0 0 60px rgba(255,255,255,0.08)",
            lineHeight: 1.5,
            margin: 0,
            opacity: subtitleIn * subtitleOut,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          {text}
        </p>
      </div>
    </AbsoluteFill>
  );
};
