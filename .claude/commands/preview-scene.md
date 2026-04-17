---
name: preview-scene
description: Remotion 컴포지션의 특정 프레임을 렌더링해서 스크린샷으로 확인한다
allowed-tools: Bash, Read
---

Remotion 컴포지션의 지정된 프레임을 PNG로 렌더링하고 바로 표시한다.

## 인수 형식

```
<composition-id> <frame>
<composition-id> <frame> --scale=<0.1~1.0>
```

예시:
- `AlbireoVideo 0` → AlbireoVideo의 0번 프레임
- `AlbireoVideo 1464 --scale=0.5` → 1464번 프레임, 50% 크기
- `DevVideo 300` → DevVideo 300번 프레임

## Step 1 — 인수 파싱

`$ARGUMENTS` 파싱:
- 첫 번째 토큰 = composition id
- 두 번째 숫자 토큰 = frame number (없으면 0)
- `--scale=N` = 출력 스케일 (없으면 0.4)

## Step 2 — 렌더링

```bash
mkdir -p out/preview

COMP="<composition-id>"
FRAME="<frame>"
SCALE="<scale>"
OUTPUT="out/preview/${COMP}-f${FRAME}.png"

npx remotion still "$COMP" "$OUTPUT" \
  --frame="$FRAME" \
  --scale="$SCALE" \
  2>&1
```

렌더 실패 시: 오류 내용을 그대로 출력하고 중단.

## Step 3 — 이미지 표시

렌더 성공 후 Read 도구로 출력 파일을 읽어 이미지를 표시한다:

```
Read: out/preview/<composition-id>-f<frame>.png
```

## Step 4 — 메타 정보 출력

```
📸 렌더 완료
  컴포지션: <composition-id>
  프레임:   <frame> (= <frame/fps>초, fps=30 기준)
  파일:     out/preview/<composition-id>-f<frame>.png
  크기:     <실제 파일 크기>
```

## 참고: AlbireoVideo 씬별 대표 프레임

| 씬 | 테마 | 첫 프레임 | 가사 등장 프레임 |
|---|---|---|---|
| 1 宇宙 | 우주/알비레오 | 0 | 672 |
| 2 夜雨 | 밤비 | 1464 | 1464 |
| 3 光年 | 황금 광년 | 2754 | 2904 |
| 4 燃焼 | 연소/불꽃 | 3864 | 3864 |
| 5 余韻 | 보랏빛 여운 | 5064 | 5064 |
