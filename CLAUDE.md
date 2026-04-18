# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Remotion Best Practices

@.claude/skills/remotion/SKILL.md

## Whisper 필사 (OpenAI API)

@.claude/skills/whisper/SKILL.md

## Video Creation Principles

@.claude/rules/video-creation.md

## DevVideo Project Conventions (페페, SFX, 오디오)

@.claude/rules/dev-video-conventions.md

---

## Commands

```bash
npm run dev          # Start Remotion Studio (localhost:3000)
npm run build        # Bundle for deployment
npm run lint         # ESLint + TypeScript type check

npx remotion render MyComp out/video.mp4           # Full render
npx remotion still MyComp out/preview.png --frame=30 --scale=0.4  # Single frame
```

## Architecture

- `src/index.ts` — `registerRoot(RemotionRoot)`, webpack entry
- `src/Root.tsx` — registers all `<Composition>` components
- `remotion.config.ts` — Remotion/webpack config (Tailwind v4, JPEG output)

**Key patterns:**
- All animations: `useCurrentFrame()` + `interpolate()` — no CSS transitions or `setTimeout`
- `useVideoConfig()` → `fps`, `width`, `height`, `durationInFrames`
- Assets: `public/` + `staticFile('path')` from `remotion`
- New composition: add `<Composition>` in `Root.tsx`, create component in `src/`

**Styling:** TailwindCSS v4 via `@remotion/tailwind-v4`. Tailwind *animation* classes don't work — use `interpolate`.

## Font Awesome

Installed: `@fortawesome/react-fontawesome` + free-solid / free-regular / free-brands sets.

```tsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

<FontAwesomeIcon icon={faStar} style={{ fontSize: 60, color: "#ffd60a" }} />
```

Browse free icons: https://fontawesome.com/icons

## Docs

- https://www.remotion.dev/docs/
- https://www.remotion.dev/docs/config
