import { Img, Video, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type MediaDef = {
  src: string;
  type: "image" | "video";
  naturalW: number;
  naturalH: number;
};

export type IconAccent = {
  icon: IconDefinition;
  color: string;
  size: number;
  /** 0–1 relative to zone */
  x: number;
  y: number;
  animate: "spin" | "pulse" | "bounce" | "float" | "none";
  opacity?: number;
};

export type LayoutKind =
  | "split-equal"      // two medias 50/50 side by side
  | "split-35-65"      // portrait left 35%, landscape right 65%
  | "split-65-35"      // landscape left 65%, portrait right 35%
  | "center-icons"     // single media center, icons flanking
  | "bg-float"         // first media fills bg, second floats on top
  | "portrait-burst"   // portrait image with icon burst around it
  | "wide-center"      // wide/landscape image centered, icons fill space
  | "icon-sides";      // image center, large icons dominate left & right

export type LayoutConfig = {
  kind: LayoutKind;
  primary: MediaDef;
  secondary?: MediaDef;
  accents: IconAccent[];
};

function useAnimations(totalFrames: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spin   = interpolate(frame, [0, fps * 4], [0, 360], { extrapolateRight: "wrap" });
  const pulse  = 1 + Math.sin((frame / fps) * Math.PI * 2) * 0.14;
  const float  = Math.sin((frame / fps) * Math.PI * 0.9) * 12;
  const bounce = interpolate(Math.abs(((frame / fps) % 1) - 0.5), [0, 0.5], [0, -18]);
  const kenW   = interpolate(frame, [0, totalFrames], [1.0, 1.1], { extrapolateRight: "clamp" });
  const kenH   = interpolate(frame, [0, totalFrames / 2, totalFrames], [0, -16, 0], { extrapolateRight: "clamp" });
  return { spin, pulse, float, bounce, kenW, kenH, frame, fps };
}

function iconTransform(anim: IconAccent["animate"], a: ReturnType<typeof useAnimations>): string {
  if (anim === "spin")   return `rotate(${a.spin}deg)`;
  if (anim === "pulse")  return `scale(${a.pulse})`;
  if (anim === "bounce") return `translateY(${a.bounce}px)`;
  if (anim === "float")  return `translateY(${a.float}px)`;
  return "none";
}

function renderMedia(media: MediaDef, style: React.CSSProperties) {
  const src = staticFile(
    media.type === "video" ? `gifs/${media.src}` : `images/${media.src}`
  );
  if (media.type === "video") {
    return <Video src={src} loop muted style={style} />;
  }
  return <Img src={src} style={style} />;
}

function AccentIcons({ accents, zoneW, zoneH }: { accents: IconAccent[]; zoneW: number; zoneH: number }) {
  const a = useAnimations(120);
  return (
    <>
      {accents.map((ac, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: ac.x * zoneW - ac.size / 2,
            top: ac.y * zoneH - ac.size / 2,
            width: ac.size,
            height: ac.size,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: ac.opacity ?? 1,
            pointerEvents: "none",
          }}
        >
          <FontAwesomeIcon
            icon={ac.icon}
            style={{
              fontSize: ac.size,
              color: ac.color,
              transform: iconTransform(ac.animate, a),
              filter: `drop-shadow(0 4px 14px ${ac.color}99)`,
            }}
          />
        </div>
      ))}
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Layout renderers
// ──────────────────────────────────────────────────────────────

function SplitEqual({ cfg, zW, zH }: { cfg: LayoutConfig; zW: number; zH: number }) {
  const a = useAnimations(120);
  const sec = cfg.secondary!;
  const half = zW * 0.48;
  const gap = zW * 0.04;

  const leftStyle: React.CSSProperties = {
    width: half, height: zH, objectFit: "contain",
    transform: `scale(${a.kenW}) translateY(${a.kenH}px)`,
    filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.5))",
  };
  const rightStyle: React.CSSProperties = {
    width: half, height: zH, objectFit: "contain",
    transform: `scale(${a.kenW}) translateY(${a.kenH * -1}px)`,
    filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.5))",
  };

  return (
    <div style={{ position: "relative", width: zW, height: zH, display: "flex", alignItems: "center" }}>
      <div style={{ width: half, height: zH, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {renderMedia(cfg.primary, leftStyle)}
      </div>
      <div style={{ width: gap }} />
      <div style={{ width: half, height: zH, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {renderMedia(sec, rightStyle)}
      </div>
      <AccentIcons accents={cfg.accents} zoneW={zW} zoneH={zH} />
    </div>
  );
}

function Split3565({ cfg, zW, zH, smallLeft }: { cfg: LayoutConfig; zW: number; zH: number; smallLeft: boolean }) {
  const a = useAnimations(120);
  const sec = cfg.secondary!;
  const smallW = zW * 0.36;
  const largeW = zW * 0.60;
  const gap = zW * 0.04;

  const smallMedia = smallLeft ? cfg.primary : sec;
  const largeMedia = smallLeft ? sec : cfg.primary;

  const smallStyle: React.CSSProperties = {
    width: smallW, height: zH * 0.88, objectFit: "contain",
    transform: `scale(${a.kenW}) translateY(${a.float}px)`,
    filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.55))",
  };
  const largeStyle: React.CSSProperties = {
    width: largeW, height: zH * 0.88, objectFit: "contain",
    transform: `scale(${a.kenW}) translateY(${a.kenH}px)`,
    filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.55))",
  };

  const leftEl = smallLeft
    ? <div style={{ width: smallW, height: zH, display: "flex", alignItems: "center", justifyContent: "center" }}>{renderMedia(smallMedia, smallStyle)}</div>
    : <div style={{ width: largeW, height: zH, display: "flex", alignItems: "center", justifyContent: "center" }}>{renderMedia(largeMedia, largeStyle)}</div>;
  const rightEl = smallLeft
    ? <div style={{ width: largeW, height: zH, display: "flex", alignItems: "center", justifyContent: "center" }}>{renderMedia(largeMedia, largeStyle)}</div>
    : <div style={{ width: smallW, height: zH, display: "flex", alignItems: "center", justifyContent: "center" }}>{renderMedia(smallMedia, smallStyle)}</div>;

  return (
    <div style={{ position: "relative", width: zW, height: zH, display: "flex", alignItems: "center" }}>
      {leftEl}
      <div style={{ width: gap }} />
      {rightEl}
      <AccentIcons accents={cfg.accents} zoneW={zW} zoneH={zH} />
    </div>
  );
}

function CenterIcons({ cfg, zW, zH }: { cfg: LayoutConfig; zW: number; zH: number }) {
  const a = useAnimations(120);
  const p = cfg.primary;
  const ar = p.naturalW / p.naturalH;
  const maxH = zH * 0.82;
  const maxW = zW * 0.55;
  const fitW = Math.min(maxW, maxH * ar);
  const fitH = fitW / ar;

  return (
    <div style={{ position: "relative", width: zW, height: zH, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {renderMedia(p, {
        width: fitW,
        height: fitH,
        objectFit: "contain",
        transform: `scale(${a.kenW}) translateY(${a.kenH}px)`,
        filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.6))",
      })}
      <AccentIcons accents={cfg.accents} zoneW={zW} zoneH={zH} />
    </div>
  );
}

function BgFloat({ cfg, zW, zH }: { cfg: LayoutConfig; zW: number; zH: number }) {
  const a = useAnimations(120);
  const sec = cfg.secondary!;
  const fgAr = sec.naturalW / sec.naturalH;
  const fgH = zH * 0.62;
  const fgW = fgH * fgAr;

  return (
    <div style={{ position: "relative", width: zW, height: zH, overflow: "hidden" }}>
      {/* Background media fills zone */}
      {renderMedia(cfg.primary, {
        position: "absolute", inset: 0,
        width: "100%", height: "100%", objectFit: "cover",
        opacity: 0.82,
      })}
      {/* Dark tint over bg */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.38)" }} />
      {/* Floating foreground media */}
      <div style={{
        position: "absolute",
        right: zW * 0.1,
        top: "50%",
        transform: `translateY(-50%) translateY(${a.float}px)`,
        filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.8))",
      }}>
        {renderMedia(sec, { width: fgW, height: fgH, objectFit: "contain" })}
      </div>
      <AccentIcons accents={cfg.accents} zoneW={zW} zoneH={zH} />
    </div>
  );
}

function PortraitBurst({ cfg, zW, zH }: { cfg: LayoutConfig; zW: number; zH: number }) {
  const a = useAnimations(120);
  const p = cfg.primary;
  const ar = p.naturalW / p.naturalH;
  const fitH = Math.min(zH * 0.85, (zW * 0.4) / ar) * (1 / Math.max(ar, 0.5));
  const fitW = fitH * ar;

  return (
    <div style={{ position: "relative", width: zW, height: zH, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {renderMedia(p, {
        width: Math.min(fitW, zW * 0.45),
        height: Math.min(fitH, zH * 0.85),
        objectFit: "contain",
        transform: `scale(${a.kenW}) translateY(${a.float}px)`,
        filter: "drop-shadow(0 28px 56px rgba(0,0,0,0.65))",
      })}
      <AccentIcons accents={cfg.accents} zoneW={zW} zoneH={zH} />
    </div>
  );
}

function IconSides({ cfg, zW, zH }: { cfg: LayoutConfig; zW: number; zH: number }) {
  const a = useAnimations(120);
  const p = cfg.primary;
  const ar = p.naturalW / p.naturalH;
  const mediaW = zW * 0.5;
  const mediaH = Math.min(zH * 0.85, mediaW / ar);

  return (
    <div style={{ position: "relative", width: zW, height: zH, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {renderMedia(p, {
        width: mediaW,
        height: mediaH,
        objectFit: "contain",
        transform: `scale(${a.kenW}) translateY(${a.kenH}px)`,
        filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.6))",
        zIndex: 2,
        position: "relative",
      })}
      <AccentIcons accents={cfg.accents} zoneW={zW} zoneH={zH} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main exported component
// ──────────────────────────────────────────────────────────────

export function SceneVisuals({ layout, zoneH }: { layout: LayoutConfig; zoneH: number }) {
  const { width: zW } = useVideoConfig();
  const zH = zoneH;

  switch (layout.kind) {
    case "split-equal":    return <SplitEqual cfg={layout} zW={zW} zH={zH} />;
    case "split-35-65":    return <Split3565  cfg={layout} zW={zW} zH={zH} smallLeft />;
    case "split-65-35":    return <Split3565  cfg={layout} zW={zW} zH={zH} smallLeft={false} />;
    case "bg-float":       return <BgFloat    cfg={layout} zW={zW} zH={zH} />;
    case "portrait-burst": return <PortraitBurst cfg={layout} zW={zW} zH={zH} />;
    case "icon-sides":     return <IconSides  cfg={layout} zW={zW} zH={zH} />;
    case "wide-center":
    case "center-icons":
    default:               return <CenterIcons cfg={layout} zW={zW} zH={zH} />;
  }
}
