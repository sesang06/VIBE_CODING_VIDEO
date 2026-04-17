---
name: irasutoya
description: Search irasutoya.com for free Japanese illustrations and download them to public/images/ for use as Remotion assets
allowed-tools: Bash, Write
---

이라스토야(irasutoya.com)에서 **"$ARGUMENTS"** 일러스트를 검색하고 `public/images/` 에 다운로드합니다.

## 인수 파싱

`$ARGUMENTS` 형식:
- `ねこ` → query="ねこ", post_pick=없음, img_pick=없음 (1단계: 포스트 목록 표시)
- `ねこ 2` → query="ねこ", post_pick=2, img_pick=없음 (2단계: 포스트 2번 이미지 표시)
- `ねこ 2 0` → query="ねこ", post_pick=2, img_pick=0 (3단계: 바로 다운로드)

마지막 1개 또는 2개의 숫자 토큰을 post_pick / img_pick으로 파싱하고, 나머지를 query로 사용.

> **팁**: 일본어 검색어가 훨씬 많은 결과를 반환합니다.  
> 한국어/영어 단어를 일본어로 변환해서 검색하는 걸 권장합니다.  
> 예: cat → ねこ, dog → いぬ, person → ひと

---

## 1단계 — 검색 (post_pick 없을 때)

```bash
QUERY="<query>"
ENCODED=$(node -e "process.stdout.write(encodeURIComponent('${QUERY}'))")
TMPDIR="${TEMP:-/tmp}"

curl -s -L \
  -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  "https://www.irasutoya.com/search?q=${ENCODED}&max-results=20" \
  -o "${TMPDIR}/irasutoya_search.html"
```

그런 다음 Node.js로 검색 결과 파싱:

```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync(process.env.TEMP || '/tmp', 'utf8');  // <-- use full path with filename
// 실제 경로: process.env.TEMP + '/irasutoya_search.html'

// bp_thumbnail_resize(\"URL\", \"TITLE\") 패턴 + 인접한 href 추출
const re = /href='(https:\/\/www\.irasutoya\.com\/\d{4}\/\d{2}\/[^']+)'[^>]*>[\s\S]*?bp_thumbnail_resize\(\"([^\"]+)\",\"([^\"]+)\"\)/g;
const results = [];
const seen = new Set();
let m;
while ((m = re.exec(html)) !== null) {
  const url = m[1], thumb = m[2], title = m[3];
  if (!seen.has(url)) {
    seen.add(url);
    results.push({ url, thumb, title });
  }
}
if (results.length === 0) {
  console.log('NO_RESULTS');
} else {
  results.forEach((r, i) => console.log(i + '|' + r.title + '|' + r.url));
}
"
```

**실제 실행 명령:**
```bash
TMPDIR="${TEMP:-/tmp}"
node << 'JSEOF'
const fs = require('fs');
const tmpdir = process.env.TEMP || '/tmp';
const html = fs.readFileSync(tmpdir + '/irasutoya_search.html', 'utf8');
const re = /href='(https:\/\/www\.irasutoya\.com\/\d{4}\/\d{2}\/[^']+)'[^>]*>[\s\S]*?bp_thumbnail_resize\("([^"]+)","([^"]+)"\)/g;
const results = [];
const seen = new Set();
let m;
while ((m = re.exec(html)) !== null) {
  const url = m[1], thumb = m[2], title = m[3];
  if (!seen.has(url)) { seen.add(url); results.push({ url, thumb, title }); }
}
if (results.length === 0) { console.log('NO_RESULTS'); }
else { results.forEach((r, i) => console.log(i + '|' + r.title + '|' + r.url)); }
JSEOF
```

결과가 `NO_RESULTS`이면 사용자에게 알리고 일본어 검색어로 다시 시도하도록 안내:
```
검색 결과가 없습니다. 일본어 키워드로 검색해 보세요.
예: cat → ねこ, business → ビジネス, food → たべもの
```

표시 형식:
```
🔍 이라스토야 검색: "<query>"
───────────────────────────────────────
[0] 猫のキャラクター
[1] ねこのいらすと
[2] 黒猫のイラスト
...

다운로드할 포스트 번호를 입력하세요:
   /irasutoya <query> <번호>
```

---

## 2단계 — 포스트 이미지 목록 (post_pick 있고 img_pick 없을 때)

선택한 포스트 URL 가져오기:

```bash
TMPDIR="${TEMP:-/tmp}"
POST_URL=$(node << 'JSEOF'
const fs = require('fs');
const html = fs.readFileSync((process.env.TEMP || '/tmp') + '/irasutoya_search.html', 'utf8');
const re = /href='(https:\/\/www\.irasutoya\.com\/\d{4}\/\d{2}\/[^']+)'[^>]*>[\s\S]*?bp_thumbnail_resize\("([^"]+)","([^"]+)"\)/g;
const results = [];
const seen = new Set();
let m;
while ((m = re.exec(html)) !== null) {
  if (!seen.has(m[1])) { seen.add(m[1]); results.push(m[1]); }
}
const pick = parseInt(process.env.POST_PICK || '0', 10);
console.log(results[pick] || '');
JSEOF
)
```

> 주의: 위 명령에서 `POST_PICK` 환경 변수로 선택 번호를 전달.

```bash
POST_PICK=<post_pick> POST_URL=$(node << 'JSEOF'
...
JSEOF
)

curl -s -L \
  -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  "$POST_URL" -o "${TMPDIR}/irasutoya_post.html"
```

포스트에서 일러스트 이미지 추출:

```bash
node << 'JSEOF'
const fs = require('fs');
const html = fs.readFileSync((process.env.TEMP || '/tmp') + '/irasutoya_post.html', 'utf8');

// UI 요소 제외 패턴 (로고, 버튼, 배너 등)
const UI = /logo|banner|button|search|menu|premium|twitter|pyoko|nengaya|random|apple-touch|searchbtn|side_background|twitterbtn|navibtn|background|onepiece/i;

// s800 또는 s400 크기의 PNG 추출 (실제 일러스트)
const pngs = [...new Set(
  (html.match(/https:\/\/[^"'\s)]+\/s(?:800|400|600|1600|0)\/[^"'\s)]+\.png/g) || [])
    .filter(u => !UI.test(u.split('/').pop()))
)];

if (pngs.length === 0) { console.log('NO_IMAGES'); process.exit(); }

// 파일명 기준으로 중복 제거 (s800과 s150 같은 파일)
const seen = new Set();
const unique = pngs.filter(u => {
  const name = u.split('/').pop();
  if (seen.has(name)) return false;
  seen.add(name);
  return true;
});

unique.forEach((u, i) => {
  const name = u.split('/').pop().replace('.png', '');
  const fullUrl = u.replace(/\/s\d+(-c)?\//, '/s0/');
  console.log(i + '|' + name + '|' + fullUrl);
});
JSEOF
```

이미지가 1개면 바로 3단계로 진행 (img_pick=0).  
이미지가 여러 개면 표시:

```
🖼️  포스트 내 일러스트 목록:
───────────────────────────────────────
[0] neko_character_black
[1] neko_character_white
[2] neko_walking

다운로드할 이미지 번호를 입력하세요:
   /irasutoya <query> <post_pick> <img_pick>
```

---

## 3단계 — 다운로드 (img_pick 있거나 이미지 1개일 때)

```bash
TMPDIR="${TEMP:-/tmp}"
mkdir -p public/images

# 포스트 페이지에서 이미지 URL 추출
IMG_URL=$(POST_PICK=<post_pick> node << 'JSEOF'
const fs = require('fs');
const html = fs.readFileSync((process.env.TEMP || '/tmp') + '/irasutoya_post.html', 'utf8');
const UI = /logo|banner|button|search|menu|premium|twitter|pyoko|nengaya|random|apple-touch|searchbtn|side_background|twitterbtn|navibtn|background|onepiece/i;
const pngs = [...new Set(
  (html.match(/https:\/\/[^"'\s)]+\/s(?:800|400|600|1600|0)\/[^"'\s)]+\.png/g) || [])
    .filter(u => !UI.test(u.split('/').pop()))
)];
const seenN = new Set();
const unique = pngs.filter(u => {
  const n = u.split('/').pop();
  if (seenN.has(n)) return false;
  seenN.add(n);
  return true;
});
const pick = parseInt(process.env.IMG_PICK || '0', 10);
const url = unique[pick] || '';
console.log(url.replace(/\/s\d+(-c)?\//, '/s0/'));
JSEOF
)

IMG_NAME=$(node -e "
const u = '${IMG_URL}';
const name = u.split('/').pop().replace('.png', '');
const safe = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,50);
console.log(safe);
")

DEST="public/images/${IMG_NAME}.png"

echo "⬇️  다운로드 중: ${IMG_NAME}.png"
curl -L --progress-bar \
  -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  -o "${DEST}" \
  "${IMG_URL}"

echo ""
ls -lh "${DEST}"
```

---

## 4단계 — 사용법 출력

다운로드 완료 후 표시:

```
✅ 다운로드 완료!

📁 저장 위치:
   public/images/<safe-name>.png

출처: いらすとや (https://www.irasutoya.com/)
라이선스: 무료 (상업/비상업 모두 사용 가능, 20개 이하 이미지 무제한)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Remotion 사용 코드:

import { Img } from "remotion";
import { staticFile } from "remotion";

export const MyComp = () => (
  <Img src={staticFile("images/<safe-name>.png")} />
);
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 PNG라서 배경이 투명합니다. 애니메이션 오버레이로 바로 사용 가능!
   배경 위에 배치하거나 다른 레이어와 합성하세요.
```

## 주의사항

- `public/` 안의 파일은 반드시 `staticFile()` 로 참조 (직접 경로 사용 금지)
- 이라스토야 PNG는 투명 배경 → `<Img>` 컴포넌트로 레이어링에 최적
- `.gitignore`에 `public/images/` 추가 권장 (바이너리 에셋)
- 한 프로젝트에서 20개 이하 사용 시 무료. 상세 약관: https://www.irasutoya.com/p/terms.html
