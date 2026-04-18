# Video Creation Principles

## 1. Text → Scene Segmentation

Split input text on `.` `?` `!` `。` `，` or newlines. Each segment = one scene. Trim whitespace; skip empty.

## 2. Asset Preparation — before writing code

For every scene, download a relevant visual first:

| Source | When | Command |
|---|---|---|
| irasutoya | Clean illustration, transparent PNG | `/irasutoya` |
| Giphy | Motion, humor, energy | `/gifpy` |

- Search irasutoya in Japanese: `ねこ` `ビジネス` `たべもの` `うれしい` `かなしい`
- Save PNGs → `public/images/`, GIFs/MP4s → `public/gifs/`

## 3. Font — Jalnan2 (MANDATORY for subtitles)

```tsx
import { loadFont } from "@remotion/fonts";
loadFont({ family: "Jalnan2", url: staticFile("Jalnan2TTF.ttf") });
```

Install if missing: `npx remotion add @remotion/fonts`

## 4. Per-Scene Layout

Canvas: **1080×1920** portrait. Subtitle bar at bottom 26–28%, image zone fills the rest.

**Subtitle bar:**
```tsx
<div style={{
  position: "absolute", bottom: 0, width: "100%", height: "28%",
  background: "linear-gradient(to top, rgba(0,0,0,0.92) 55%, transparent)",
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "0 64px", boxSizing: "border-box",
}}>
  <p style={{
    fontFamily: "Jalnan2", fontSize: 60, color: "#fff",
    textAlign: "center", lineHeight: 1.5, margin: 0,
    opacity: subtitleOpacity, transform: `translateY(${subtitleY}px)`,
  }}>{text}</p>
</div>
```

**Background**: Choose colors that match scene mood — dark + vivid gradient as base, each scene distinct. No fixed palette; use creative judgment.

**Image animation** — Ken Burns zoom + gentle float:
```tsx
const scale = interpolate(frame, [0, durationInFrames], [1, 1.1], { extrapolateRight: "clamp" });
const floatY = interpolate(frame, [0, durationInFrames/2, durationInFrames], [0, -18, 0], { extrapolateRight: "clamp" });
```

## 5. Font Awesome Icon Accents

1–2 FA icons per scene as decorative elements (spinning, pulsing, bouncing). Match icon to scene theme.

```tsx
const spin = interpolate(frame, [0, fps * 2], [0, 360], { extrapolateRight: "wrap" });
const pulse = Math.sin((frame / fps) * Math.PI * 2) * 0.15 + 1;
// Ghost texture: <FontAwesomeIcon style={{ fontSize: 400, opacity: 0.06 }} />
```

## 6. Transitions

Use `TransitionSeries` from `@remotion/transitions`. Choose transitions that match scene mood — no fixed rotation required. Mix slide, fade, wipe, flip, zoom freely. Light leaks from `@remotion/light-leaks` are optional accent effects; use them when they enhance the visual, not on a fixed schedule.

Install: `npx remotion add @remotion/transitions && npx remotion add @remotion/light-leaks`

## 7. Subtitle & Icon Entrance Animations

```tsx
const SUB_ENTER = 14;
const subtitleOpacity = interpolate(frame, [0, SUB_ENTER], [0, 1], { extrapolateRight: "clamp" });
const subtitleY = interpolate(frame, [0, SUB_ENTER], [40, 0], { extrapolateRight: "clamp" });

// Exit before transition
const subtitleOut = interpolate(frame, [durationInFrames - TRANSITION_FRAMES, durationInFrames - 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
```

Import `Easing` from `"remotion"`.

## 8. Composition Registration

In `src/Root.tsx`: `fps: 30`, canvas `1080×1920` (portrait) or `1920×1080` (landscape).

```
durationInFrames = sum(scene.durationInFrames) - transitionCount * TRANSITION_FRAMES
```

## 9. Scene Duration

Base on narration audio: `dur = Math.ceil(audioDurationSec * fps) + TRANSITION_FRAMES`  
Measure exact duration with: `ffprobe -v error -show_entries format=duration -of csv=p=0 <file>`

## 10. Design Iteration

Use `/preview-scene <CompositionId> <frame>` to render a PNG and visually verify before full render.

**AbsoluteFill flex gotcha**: defaults to `flexDirection: "column"`. For horizontal alignment, always set `flexDirection: "row"` explicitly.
