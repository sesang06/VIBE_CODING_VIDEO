# DevVideo Project Conventions

Conventions learned while building `DevVideo` / `AlbireoVideo`. Apply to all future compositions in this repo.

## Pepe (캐릭터 오버레이)

- **파일 포맷**: 반드시 RGBA PNG. WebP는 Remotion headless Chrome에서 투명도가 깨짐
- **크기**: `size` (height px) = ~500–570px. 원본 해상도의 3× 정도가 화면에서 적당함
- **등장 타이밍**: `enterFrame` = 씬 `durationInFrames`의 약 40–50% 지점 (나레이션 중반에 등장)
  - 예: dur=110프레임 → enterFrame ≈ 45–55
- **위치**: `top-right` / `top-left` / `bottom-right` / `bottom-left` 중 이미지 주 피사체와 겹치지 않는 쪽

```tsx
pepe: { src: "파일.png", naturalW: 420, naturalH: 416, position: "top-right", enterFrame: 50, size: 540 }
```

## SFX (효과음)

### 볼륨 기준

나레이션 평균 음량은 약 **-18~-22 dB**. SFX는 이 범위에 맞추거나 약간 낮게.

| SFX 실측 mean dB | 권장 sfxVolume | 비고 |
|---|---|---|
| -3 ~ 0 dB | 0.10–0.15 | 매우 큰 소리 (vine-boom 류) |
| -8 ~ -5 dB | 0.18–0.25 | 큰 소리 |
| -12 ~ -9 dB | 0.30–0.40 | 보통 |
| -18 ~ -13 dB | 0.45–0.55 (default) | 나레이션 수준 |
| -25 dB 이하 | 1.5–2.5 | 너무 작음, 부스트 필요 |

볼륨 측정: `ffmpeg -i <file> -filter:a volumedetect -f null /dev/null 2>&1 | grep mean_volume`

### SFX 딜레이 (sfxDelay)

짧은 SFX (< 1.5초)는 씬 시작과 동시에 재생하면 어색함. 나레이션 도중 적절한 타이밍에 삽입:

- **기본 딜레이**: 20–30프레임 (0.7–1초 후)
- **나레이션 긴 씬** (4초+): 45프레임까지 허용
- **제약**: `sfxDelay + sfx길이(프레임) < durationInFrames - TRANSITION_FRAMES`

```tsx
sfxDelay: 30  // 1초 후 재생
```

### 씬 전환 겹침 방지

SFX는 `durationInFrames - TRANSITION_FRAMES` 시점에 무음이 되어야 다음 씬 SFX와 겹치지 않음.  
`SfxPlayer` 컴포넌트 (`DevScene.tsx`)가 이를 자동 처리함.

## 나레이션 오디오

- **씬 길이** = 나레이션 오디오 길이 기준. SFX가 더 길어도 씬을 늘리지 않음
- **파일명 변경 시** 코드의 `audio:` 레퍼런스도 함께 업데이트
- **배속 변환**: `ffmpeg -i input.mp3 -filter:a "atempo=1.5" output.mp3`
- **역변환 (1.5× → 원본)**: atempo=0.6667

## 투명 이미지 (알파 채널)

- **PNG (RGBA)**: 정상 동작
- **WebP**: Remotion headless Chrome에서 투명도 렌더링 불가 → PNG로 변환 필요
- **JPG**: 알파 없음, 배경색 있는 이미지에만 사용
