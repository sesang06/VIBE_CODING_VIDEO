# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Remotion Best Practices

@.claude/skills/remotion/SKILL.md

## Commands

```bash
npm run dev          # Start Remotion Studio (live preview at localhost:3000)
npm run build        # Bundle the video for deployment
npm run lint         # Run ESLint + TypeScript type check
npm run upgrade      # Upgrade all Remotion packages to latest

# Render
npx remotion render MyComp out/video.mp4          # Render full video
npx remotion still MyComp --scale=0.25 --frame=30 # Render single frame (sanity check)
```

## Architecture

**Entry points:**
- `src/index.ts` — calls `registerRoot(RemotionRoot)`, the webpack entry point
- `src/Root.tsx` — registers all `<Composition>` components; add new compositions here
- `src/Composition.tsx` — the main composition component (currently blank canvas)
- `remotion.config.ts` — Remotion/webpack config (Tailwind v4 enabled, JPEG output, overwrite on)

**Key patterns:**
- All animations must use `useCurrentFrame()` + `interpolate()` — never CSS transitions or `setTimeout`
- `useVideoConfig()` gives `fps`, `width`, `height`, `durationInFrames` — always derive timing from `fps`
- Assets go in `public/` and are referenced with `staticFile('filename')` from `remotion`
- New compositions: add a `<Composition>` in `Root.tsx`, create the component in `src/`

**Styling:** TailwindCSS v4 is active via `@remotion/tailwind-v4`. `src/index.css` imports it. Tailwind utility classes work but Tailwind animation classes do NOT work in Remotion (use `interpolate` instead).

## Docs Reference

- https://www.remotion.dev/docs/
- https://www.remotion.dev/docs/config

---

## Font Awesome

Font Awesome is installed (`@fortawesome/react-fontawesome`, `@fortawesome/fontawesome-svg-core`, free-solid / free-regular / free-brands icon sets). Use it freely for decorative icons in any composition.

```tsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faStar, faBolt, faFire } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faTwitter } from "@fortawesome/free-brands-svg-icons";

// Basic usage
<FontAwesomeIcon icon={faHeart} style={{ fontSize: 80, color: "#ff4d6d" }} />

// Animated icon — pulse scale via interpolate
const pulse = interpolate(
  frame % 30, [0, 15, 30], [1, 1.3, 1],
  { extrapolateRight: "clamp" }
);
<FontAwesomeIcon icon={faStar} style={{ fontSize: 60, transform: `scale(${pulse})`, color: "#ffd60a" }} />
```

Browse icons at https://fontawesome.com/icons (filter: "Free"). Import from:
- `@fortawesome/free-solid-svg-icons` — filled icons (most common)
- `@fortawesome/free-regular-svg-icons` — outline icons
- `@fortawesome/free-brands-svg-icons` — brand logos (GitHub, YouTube, etc.)

---

## Video Creation Principles

When the user provides text to turn into a video, follow these rules exactly. **Make it visually spectacular** — dull, static compositions are unacceptable.

### 1. Text → Scene Segmentation

Split input text into individual **phrases or sentences** (split on `.` `?` `!` `。` `，` or newlines). Each segment = one scene. Trim whitespace; skip empty segments.

### 2. Asset Preparation — do this BEFORE writing any code

For **every scene**, download a relevant visual first. Use multiple asset sources for variety:

| Source | When to use | Command |
|---|---|---|
| irasutoya | Illustration, clean PNG with transparent BG | `/irasutoya` |
| Giphy | Humor, energy, motion emphasis | `/gifpy` |

- Search irasutoya **in Japanese**: `ねこ` (cat), `ビジネス` (work), `たべもの` (food), `はな` (flower), `うれしい` (happy), `かなしい` (sad), etc.
- Name files descriptively by scene: `scene-01-neko.png`, `scene-02-food.gif`
- Save PNGs → `public/images/`, GIFs/MP4s → `public/gifs/`

### 3. Font — Jalnan2 (MANDATORY for all subtitles)

Load Jalnan2 from `public/Jalnan2TTF.ttf` at module level. Never use system fonts for subtitles.

```tsx
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

loadFont({ family: "Jalnan2", url: staticFile("Jalnan2TTF.ttf") });
```

Install `@remotion/fonts` if not present: `npx remotion add @remotion/fonts`

### 4. Per-Scene Layout

Default canvas: **1080×1920** (portrait) — always inherit from `useVideoConfig()`.

```
┌──────────────────────────┐
│  [colored bg gradient]   │  ← full canvas background (changes per scene)
│                          │
│   [FA icon top-right]    │  ← Font Awesome accent (animated)
│                          │
│   [illustration/GIF]     │  ← center ~60% — Ken Burns zoom + float
│                          │
├──────────────────────────┤
│  자막 텍스트              │  ← bottom 28% — Jalnan2, slide-up entrance
│  (Jalnan2, white, bold)  │     gradient backdrop
└──────────────────────────┘
```

**Background**: Each scene gets a unique gradient. Cycle through a palette:
```tsx
const BG_GRADIENTS = [
  "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  "linear-gradient(135deg, #2d1b69 0%, #11998e 100%)",
  "linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)",
  "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",
  "linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)",
];
```

**Image zone** — Ken Burns zoom + gentle float:
```tsx
const scale = interpolate(frame, [0, durationInFrames], [1, 1.1], { extrapolateRight: "clamp" });
const floatY = interpolate(frame, [0, durationInFrames / 2, durationInFrames], [0, -18, 0], { extrapolateRight: "clamp" });
// style={{ transform: `scale(${scale}) translateY(${floatY}px)`, transformOrigin: "center center" }}
```

Use `<Img>` for PNGs, `<Video>` for MP4s, `<Gif>` for GIFs (install: `npx remotion add @remotion/gif`).

**Subtitle bar**:
```tsx
<div style={{
  position: "absolute", bottom: 0, width: "100%", height: "28%",
  background: "linear-gradient(to top, rgba(0,0,0,0.92) 55%, transparent)",
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "0 64px", boxSizing: "border-box",
}}>
  <p style={{
    fontFamily: "Jalnan2", fontSize: 68, color: "#ffffff",
    textAlign: "center", textShadow: "0 4px 16px rgba(0,0,0,0.9)",
    lineHeight: 1.45, margin: 0,
    opacity: subtitleOpacity, transform: `translateY(${subtitleY}px)`,
  }}>
    {text}
  </p>
</div>
```

### 5. Font Awesome Icon Accents

Every scene should include **1–2 Font Awesome icons** as decorative elements:

- **Top-right corner**: a small thematic icon, spinning or pulsing
- **Behind subtitle**: a large ghosted icon (opacity ~0.08) for texture

```tsx
// Spinning icon
const spin = interpolate(frame, [0, fps * 2], [0, 360], { extrapolateRight: "wrap" });
// style={{ transform: `rotate(${spin}deg)` }}

// Pulsing icon
const pulse = Math.sin((frame / fps) * Math.PI * 2) * 0.15 + 1;
// style={{ transform: `scale(${pulse})` }}

// Ghost texture behind subtitle
<FontAwesomeIcon icon={faHeart} style={{
  position: "absolute", fontSize: 400, opacity: 0.06, color: "#ffffff",
  bottom: "5%", right: "-10%",
}} />
```

Choose icons that match scene content:
- Happy/celebration → `faPartyPopper`, `faStar`, `faHeart`
- Food → `faUtensils`, `faPizzaSlice`, `faCoffee`
- Work/study → `faLaptop`, `faBriefcase`, `faBook`
- Nature → `faLeaf`, `faSun`, `faSnowflake`
- Movement/energy → `faBolt`, `faFire`, `faRocket`

### 6. Transitions — vary every scene, use light leaks

Install both packages if not present:
```bash
npx remotion add @remotion/transitions
npx remotion add @remotion/light-leaks
```

Use `TransitionSeries` with a **rotating mix** of transitions AND light leak overlays:

```tsx
import { TransitionSeries, springTiming, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { LightLeak } from "@remotion/light-leaks";

const TRANSITIONS = [
  { presentation: slide({ direction: "from-right" }),     timing: springTiming({ config: { damping: 200 } }) },
  { presentation: fade(),                                  timing: linearTiming({ durationInFrames: 18 }) },
  { presentation: wipe({ direction: "from-top-left" }),   timing: springTiming({ config: { damping: 150 } }) },
  { presentation: flip({ direction: "from-right" }),      timing: springTiming({ config: { damping: 200 } }) },
  { presentation: slide({ direction: "from-bottom" }),    timing: springTiming({ config: { damping: 180 } }) },
  { presentation: wipe({ direction: "from-bottom-left" }), timing: springTiming({ config: { damping: 160 } }) },
];

// Every 3rd transition → also add a LightLeak overlay
<TransitionSeries>
  {scenes.map((scene, i) => (
    <React.Fragment key={i}>
      <TransitionSeries.Sequence durationInFrames={scene.duration}>
        <Scene {...scene} />
      </TransitionSeries.Sequence>
      {i < scenes.length - 1 && (
        <>
          <TransitionSeries.Transition
            presentation={TRANSITIONS[i % TRANSITIONS.length].presentation}
            timing={TRANSITIONS[i % TRANSITIONS.length].timing}
          />
          {i % 3 === 2 && (
            <TransitionSeries.Overlay durationInFrames={24}>
              <LightLeak seed={i} hueShift={(i * 60) % 360} />
            </TransitionSeries.Overlay>
          )}
        </>
      )}
    </React.Fragment>
  ))}
</TransitionSeries>
```

### 7. Subtitle & Icon Entrance Animations

```tsx
const frame = useCurrentFrame();
const { fps } = useVideoConfig();

// Subtitle: slide up + fade in
const SUB_ENTER = 14;
const subtitleOpacity = interpolate(frame, [0, SUB_ENTER], [0, 1], { extrapolateRight: "clamp" });
const subtitleY = interpolate(frame, [0, SUB_ENTER], [40, 0], { extrapolateRight: "clamp" });

// Icon: drop in from top + bounce
const ICON_ENTER = 20;
const iconY = interpolate(frame, [0, ICON_ENTER], [-80, 0], {
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.bounce),
});
const iconOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

// Subtitle exit: fade out before scene ends
const subtitleExit = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
```

Import `Easing` from `"remotion"`.

### 8. Composition Registration

In `src/Root.tsx`:
- `fps`: 30
- `width` × `height`: 1080 × 1920 (portrait) or 1920 × 1080 (landscape)
- `durationInFrames`: `scenes.reduce((sum, s) => sum + s.duration, 0) - (scenes.length - 1) * TRANSITION_FRAMES`

### 9. Scene Duration

Default **120 frames (4s)** per scene. Scale with text: `Math.max(90, text.length * 6)` frames.  
Transition overlap: **20 frames** (subtract from total duration calculation).
