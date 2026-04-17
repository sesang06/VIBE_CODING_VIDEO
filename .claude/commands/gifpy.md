---
name: gifpy
description: Search Giphy for GIFs/memes and download them to public/gifs/ for use as Remotion assets
allowed-tools: Bash, Read, Write
---

Search Giphy for **"$ARGUMENTS"** and download a GIF to `public/gifs/` for use in this Remotion project.

## Step 1 — Check API key

```bash
echo "${GIPHY_API_KEY:-NOT_SET}"
```

If `NOT_SET`, stop and show this message to the user:

```
🔑 GIPHY_API_KEY가 필요합니다.

1. https://developers.giphy.com/ 에서 무료 계정 생성
2. "Create an App" → SDK 선택 → API 키 발급
3. 아래 명령으로 키를 설정한 뒤 다시 실행하세요:

   export GIPHY_API_KEY=your_key_here

또는 프로젝트 루트에 .env 파일 생성 (커밋하지 마세요):
   echo 'GIPHY_API_KEY=your_key_here' >> .env
```

Do NOT proceed without a valid API key.

## Step 2 — Parse arguments

`$ARGUMENTS` 형식 예시:
- `pepe meme` → query="pepe meme", pick=없음 (목록 표시 후 선택 대기)
- `pepe meme 2` → query="pepe meme", pick=2 (바로 다운로드)
- `dancing cat --pick 0` → query="dancing cat", pick=0

마지막 숫자 토큰 또는 `--pick N` 이 있으면 pick으로 파싱하고 나머지를 query로 사용.

## Step 3 — Search Giphy

```bash
API_KEY="$GIPHY_API_KEY"
QUERY=$(echo "<query>" | python3 -c "import sys,urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip()))" 2>/dev/null || echo "<query>" | sed 's/ /%20/g')

RESPONSE=$(curl -s "https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${QUERY}&limit=8&rating=g&lang=en")

# Check for API error
STATUS=$(echo "$RESPONSE" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).meta?.status||200))")
```

If status is 403 or 401: tell the user the API key is invalid and re-show Step 1 instructions.

Parse and display results:

```bash
echo "$RESPONSE" | node -e "
  let d='';
  process.stdin.on('data', c => d += c);
  process.stdin.on('end', () => {
    const json = JSON.parse(d);
    if (!json.data || json.data.length === 0) { console.log('NO_RESULTS'); return; }
    json.data.forEach((g, i) => {
      const orig = g.images.original;
      const sizeMB = (parseInt(orig.size||'0') / 1024 / 1024).toFixed(1);
      console.log(i + '|' + g.id + '|' + g.title + '|' + orig.url + '|' + orig.mp4 + '|' + orig.width + 'x' + orig.height + '|' + sizeMB + 'MB');
    });
  });
"
```

Display to user:
```
🔍 검색 결과: "<query>"
───────────────────────────────────────
[0] Pepe The Frog Reaction (480x360, 2.3MB)
[1] Sad Pepe               (320x240, 1.1MB)
[2] Pepe Clapping          (498x280, 3.4MB)
...

다운로드할 번호를 선택하세요 (0-7):
```

If `pick` was already specified in Step 2, skip the prompt and go directly to Step 4.

## Step 4 — Download

```bash
mkdir -p public/gifs

GIF_ID="<selected id>"
RAW_TITLE="<selected title>"
SAFE_NAME=$(echo "$RAW_TITLE" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-//;s/-$//' | cut -c1-40)
DEST="public/gifs/${SAFE_NAME}"

echo "⬇️  다운로드 중..."

# MP4 download (preferred for Remotion)
curl -L --progress-bar -o "${DEST}.mp4" "<mp4_url>"

# GIF download
curl -L --progress-bar -o "${DEST}.gif" "<gif_url>"

echo ""
ls -lh "${DEST}.mp4" "${DEST}.gif"
```

## Step 5 — Output usage instructions

```
✅ 다운로드 완료!

📁 저장 위치:
   public/gifs/<safe-name>.mp4  ← Remotion 권장 (빠름)
   public/gifs/<safe-name>.gif  ← GIF 원본

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Remotion 사용 코드:

// ✅ MP4로 사용 (권장 — 성능 최적)
import { Video } from "remotion";
import { staticFile } from "remotion";

export const MyComp = () => (
  <Video src={staticFile("gifs/<safe-name>.mp4")} />
);

// 🎞️ GIF 타임라인 동기화가 필요한 경우
// 먼저 설치: npx remotion add @remotion/gif
import { Gif } from "@remotion/gif";
import { staticFile } from "remotion";

export const MyComp = () => (
  <Gif
    src={staticFile("gifs/<safe-name>.gif")}
    width={480}
    height={360}
    fit="contain"
  />
);
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 <Gif> 컴포넌트는 Remotion 타임라인과 자동 동기화됩니다.
   자세한 내용: .claude/skills/remotion/rules/gifs.md
```

## Notes
- `public/` 안의 파일은 항상 `staticFile()` 로 참조 (직접 경로 사용 금지)
- MP4 우선 — GIF보다 파일 크기가 작고 렌더링 속도가 빠름
- 파일이 너무 크면 (`images.downsized_large` URL 사용 고려)
- `.gitignore`에 `public/gifs/` 추가를 권장 (바이너리 에셋은 Git에 올리지 않는 것이 일반적)
