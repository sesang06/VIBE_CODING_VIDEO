import React from "react";
import { loadFont } from "@remotion/fonts";
import { LightLeak } from "@remotion/light-leaks";
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { flip } from "@remotion/transitions/flip";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import {
  faBan,
  faBolt,
  faBrain,
  faBuilding,
  faCode,
  faDrumstickBite,
  faFaceFrown,
  faFire,
  faGift,
  faLaptopCode,
  faLightbulb,
  faMicrophone,
  faMoneyBillWave,
  faPeopleGroup,
  faRightLeft,
  faRobot,
  faSeedling,
  faStar,
  faStarOfLife,
  faTriangleExclamation,
  faUserMinus,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { staticFile } from "remotion";
import { DevScene, TRANSITION_FRAMES } from "./DevScene";
import type { SceneData } from "./DevScene";

loadFont({ family: "Jalnan2", url: staticFile("Jalnan2TTF.ttf") });

const FPS = 30;
const dur = (seconds: number) => Math.ceil(seconds * FPS) + TRANSITION_FRAMES;

const G = [
  "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  "linear-gradient(135deg, #2d1b69 0%, #11998e 100%)",
  "linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)",
  "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",
  "linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)",
  "linear-gradient(135deg, #642b73 0%, #c6426e 100%)",
  "linear-gradient(135deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%)",
];

const SCENES: SceneData[] = [
  // 0 — 멘탈 붕괴
  {
    text: "옛날 개발자들은 완전히 멘탈이 나가버렸습니다.",
    audio: "audio_0_옛날_개발자들은_완전히_멘탈이_나가버렸습니다_.mp3",
    sfx: "sfx-00-haang.mp3",
    durationInFrames: dur(3.892245),
    gradient: G[0],
    layout: {
      kind: "bg-float",
      primary:   { src: "scene-00-stress.mp4", type: "video", naturalW: 480, naturalH: 480 },
      secondary: { src: "scene-00-stress.png", type: "image", naturalW: 897, naturalH: 800 },
      accents: [
        { icon: faBrain,     color: "#ff6b6b", size: 72, x: 0.88, y: 0.12, animate: "spin" },
        { icon: faFaceFrown, color: "#ff6b6b", size: 52, x: 0.12, y: 0.88, animate: "float", opacity: 0.85 },
      ],
    },
    pepe: { src: "우는 페페.webp", naturalW: 728, naturalH: 508, position: "top-right", size: 180 },
  },
  // 1 — 돈에 속아
  {
    text: "개발자 돈 잘번다고 속아 직업 골랐는데",
    audio: "audio_1_개발자_돈_잘번다고_속아_직업_골랐는데.mp3",
    sfx: "sfx-01-ddung.mp3",
    durationInFrames: dur(4.937143),
    gradient: G[1],
    layout: {
      kind: "wide-center",
      primary: { src: "scene-01-money-dream.png", type: "image", naturalW: 670, naturalH: 333 },
      accents: [
        { icon: faMoneyBillWave, color: "#ffd60a", size: 68, x: 0.06, y: 0.2,  animate: "bounce" },
        { icon: faBolt,          color: "#ffd60a", size: 52, x: 0.94, y: 0.8,  animate: "pulse" },
        { icon: faMoneyBillWave, color: "#ffee54", size: 44, x: 0.5,  y: 0.06, animate: "float", opacity: 0.6 },
      ],
    },
    pepe: { src: "페페 부자.jpg", naturalW: 800, naturalH: 800, position: "bottom-right", enterFrame: 20, size: 200 },
  },
  // 2 — AI 코딩
  {
    text: "AI가 코딩을 너무 잘해서",
    audio: "audio_2_AI가_코딩을_너무_잘해서.mp3",
    sfx: "sfx-02-anime-wow.mp3",
    durationInFrames: dur(3.082449),
    gradient: G[2],
    layout: {
      kind: "split-equal",
      primary:   { src: "scene-02-ai-robot.mp4", type: "video", naturalW: 480, naturalH: 480 },
      secondary: { src: "scene-02-ai-robot.png", type: "image", naturalW: 886, naturalH: 801 },
      accents: [
        { icon: faRobot, color: "#74b9ff", size: 64, x: 0.88, y: 0.12, animate: "spin" },
        { icon: faCode,  color: "#74b9ff", size: 50, x: 0.12, y: 0.88, animate: "float", opacity: 0.8 },
      ],
    },
  },
  // 3 — 해고
  {
    text: "개발자들을 고용할 필요가 없었거든요",
    audio: "audio_3_개발자들을_고용할_필요가_없었거든요.mp3",
    sfx: "sfx-03-ggeojyeo.mp3",
    durationInFrames: dur(2.899592),
    gradient: G[3],
    layout: {
      kind: "center-icons",
      primary: { src: "scene-03-fired.png", type: "image", naturalW: 816, naturalH: 816 },
      accents: [
        { icon: faUserMinus, color: "#ff7675", size: 72, x: 0.88, y: 0.12, animate: "bounce" },
        { icon: faBan,       color: "#ff7675", size: 56, x: 0.12, y: 0.88, animate: "spin",  opacity: 0.85 },
        { icon: faFire,      color: "#ff4757", size: 44, x: 0.5,  y: 0.92, animate: "float", opacity: 0.7 },
      ],
    },
    pepe: { src: "물음표 페페.jpg", naturalW: 850, naturalH: 532, position: "bottom-left", enterFrame: 10, size: 180 },
  },
  // 4 — 기발한 생각
  {
    text: "그래서 똑똑한 개발자가 기발한 생각을 했는데요.",
    audio: "audio_4_그래서_똑똑한_개발자가_기발한_생각을_했는데요_.mp3",
    sfx: "sfx-04-1billion-iq.mp3",
    sfxVolume: 0.5,
    durationInFrames: dur(4.440816),
    gradient: G[4],
    layout: {
      kind: "split-65-35",
      primary:   { src: "scene-04-idea.mp4", type: "video", naturalW: 480, naturalH: 320 },
      secondary: { src: "scene-04-idea.png", type: "image", naturalW: 629, naturalH: 815 },
      accents: [
        { icon: faLightbulb, color: "#ffd32a", size: 68, x: 0.88, y: 0.1,  animate: "pulse" },
        { icon: faStar,      color: "#ffd32a", size: 52, x: 0.12, y: 0.88, animate: "spin",  opacity: 0.8 },
      ],
    },
  },
  // 5 — 치킨
  {
    text: "바로 닭집에서 치킨을 튀기는 거였죠.",
    audio: "audio_5_바로_닭집에서_치킨을_튀기는_거였죠_.mp3",
    sfx: "sfx-05-vine-boom.mp3",
    durationInFrames: dur(2.951837),
    gradient: G[5],
    layout: {
      kind: "split-equal",
      primary:   { src: "scene-05-chicken.mp4", type: "video", naturalW: 480, naturalH: 352 },
      secondary: { src: "scene-05-chicken.png", type: "image", naturalW: 797, naturalH: 833 },
      accents: [
        { icon: faDrumstickBite, color: "#fdcb6e", size: 68, x: 0.88, y: 0.12, animate: "bounce" },
        { icon: faFire,          color: "#e17055", size: 52, x: 0.5,  y: 0.88, animate: "float",  opacity: 0.8 },
      ],
    },
    pepe: { src: "페페 따봉.png", naturalW: 396, naturalH: 373, position: "top-right", enterFrame: 12, size: 170 },
  },
  // 6 — 심각한 문제
  {
    text: "그런데 심각한 문제가 터졌습니다",
    audio: "audio_6_그런데_심각한_문제가_터졌습니다.mp3",
    sfx: "sfx-06-vineboom-bass.mp3",
    durationInFrames: dur(3.578776),
    gradient: G[6],
    layout: {
      kind: "bg-float",
      primary:   { src: "scene-06-problem.mp4", type: "video", naturalW: 480, naturalH: 480 },
      secondary: { src: "scene-06-problem.png", type: "image", naturalW: 497, naturalH: 672 },
      accents: [
        { icon: faTriangleExclamation, color: "#ff4757", size: 72, x: 0.88, y: 0.12, animate: "bounce" },
        { icon: faFire,                color: "#ff6348", size: 54, x: 0.12, y: 0.85, animate: "float",  opacity: 0.85 },
      ],
    },
  },
  // 7 — 개발만 할줄 알아
  {
    text: "개발자들은 개발 외에 할 줄 아는 게 없어서",
    audio: "audio_7_개발자들은_개발_외에_할_줄_아는_게_없어서.mp3",
    sfx: "sfx-07-sad-bgm.mp3",
    sfxVolume: 0.4,
    durationInFrames: dur(3.395918),
    gradient: G[7],
    layout: {
      kind: "wide-center",
      primary: { src: "scene-07-programmer.png", type: "image", naturalW: 952, naturalH: 765 },
      accents: [
        { icon: faCode,       color: "#a29bfe", size: 64, x: 0.07, y: 0.15, animate: "float" },
        { icon: faLaptopCode, color: "#a29bfe", size: 52, x: 0.93, y: 0.85, animate: "pulse", opacity: 0.85 },
      ],
    },
    pepe: { src: "궁금한 페페.jpg", naturalW: 610, naturalH: 591, position: "top-right", enterFrame: 18, size: 190 },
  },
  // 8 — 닭집도 거부
  {
    text: "닭집에서도 원하지 않았거든요.",
    audio: "audio_8_닭집에서도_원하지_않았거든요_.mp3",
    sfx: "sfx-08-ggeojyeo2.mp3",
    durationInFrames: dur(2.298776),
    gradient: G[0],
    layout: {
      kind: "portrait-burst",
      primary: { src: "scene-08-rejected.png", type: "image", naturalW: 833, naturalH: 1012 },
      accents: [
        { icon: faBan,       color: "#ff7675", size: 72, x: 0.85, y: 0.1,  animate: "spin" },
        { icon: faFaceFrown, color: "#ff7675", size: 52, x: 0.15, y: 0.88, animate: "bounce", opacity: 0.85 },
      ],
    },
    pepe: { src: "우는 페페.webp", naturalW: 728, naturalH: 508, position: "bottom-left", enterFrame: 8, size: 175 },
  },
  // 9 — 천재 아이디어
  {
    text: "그때 한 사람이 천재적인 아이디어를 냈습니다",
    audio: "audio_9_그때_한_사람이_천재적인_아이디어를_냈습니다.mp3",
    sfx: "sfx-09-genius.mp3",
    sfxVolume: 0.5,
    durationInFrames: dur(3.683265),
    gradient: G[1],
    layout: {
      kind: "center-icons",
      primary: { src: "scene-09-genius.png", type: "image", naturalW: 976, naturalH: 912 },
      accents: [
        { icon: faStarOfLife, color: "#ffd60a", size: 68, x: 0.88, y: 0.12, animate: "spin" },
        { icon: faLightbulb,  color: "#ffd60a", size: 54, x: 0.12, y: 0.85, animate: "pulse", opacity: 0.9 },
      ],
    },
    pepe: { src: "페페 물음표 고화질.png", naturalW: 612, naturalH: 491, position: "top-left", enterFrame: 15, size: 185 },
  },
  // 10 — 목소리 변조
  {
    text: "바이브 코딩으로 목소리 변조 툴을 만들어서",
    audio: "audio_10_바이브_코딩으로_목소리_변조_툴을_만들어서.mp3",
    sfx: "sfx-10-yeoja.mp3",
    durationInFrames: dur(4.649796),
    gradient: G[2],
    layout: {
      kind: "split-65-35",
      primary:   { src: "scene-10-mic.mp4", type: "video", naturalW: 480, naturalH: 362 },
      secondary: { src: "scene-10-mic.png", type: "image", naturalW: 673, naturalH: 878 },
      accents: [
        { icon: faMicrophone, color: "#55efc4", size: 68, x: 0.88, y: 0.12, animate: "pulse" },
        { icon: faCode,       color: "#55efc4", size: 52, x: 0.12, y: 0.88, animate: "float", opacity: 0.8 },
      ],
    },
  },
  // 11 — 넷카마 방송
  {
    text: "넷카마로 인터넷 방송을 데뷔하는 거였죠",
    audio: "audio_11_넷카마로_인터넷_방송을_데뷔하는_거였죠.mp3",
    sfx: "sfx-11-haang2.mp3",
    durationInFrames: dur(3.631020),
    gradient: G[3],
    layout: {
      kind: "split-35-65",
      primary:   { src: "scene-11-streamer.mp4", type: "video", naturalW: 270, naturalH: 480 },
      secondary: { src: "scene-11-streamer.png", type: "image", naturalW: 852, naturalH: 769 },
      accents: [
        { icon: faVideo, color: "#fd79a8", size: 68, x: 0.88, y: 0.12, animate: "bounce" },
        { icon: faStar,  color: "#fd79a8", size: 52, x: 0.12, y: 0.88, animate: "spin",  opacity: 0.85 },
      ],
    },
    pepe: { src: "737d3895a65de58b24ad1cd99434d91e.png", naturalW: 952, naturalH: 949, position: "bottom-right", enterFrame: 18, size: 190 },
  },
  // 12 — 많은 개발자들
  {
    text: "그 결과 많은 개발자들이",
    audio: "audio_12_그_결과_많은_개발자들이_.mp3",
    sfx: "sfx-12-applause.mp3",
    sfxVolume: 0.45,
    durationInFrames: dur(2.977959),
    gradient: G[4],
    layout: {
      kind: "portrait-burst",
      primary: { src: "scene-12-crowd.png", type: "image", naturalW: 1146, naturalH: 1504 },
      accents: [
        { icon: faPeopleGroup, color: "#81ecec", size: 68, x: 0.88, y: 0.1,  animate: "bounce" },
        { icon: faStar,        color: "#81ecec", size: 52, x: 0.12, y: 0.88, animate: "float", opacity: 0.8 },
      ],
    },
  },
  // 13 — 직무 전환
  {
    text: "넷카마로 직무를 전환하여",
    audio: "audio_13_넷카마로_직무를_전환하여.mp3",
    sfx: "sfx-13-jabassjyo.mp3",
    durationInFrames: dur(2.899592),
    gradient: G[5],
    layout: {
      kind: "center-icons",
      primary: { src: "scene-13-career-change.png", type: "image", naturalW: 834, naturalH: 834 },
      accents: [
        { icon: faRightLeft, color: "#74b9ff", size: 68, x: 0.88, y: 0.12, animate: "bounce" },
        { icon: faBolt,      color: "#74b9ff", size: 52, x: 0.12, y: 0.88, animate: "pulse",  opacity: 0.85 },
      ],
    },
    pepe: { src: "페페 따봉.png", naturalW: 396, naturalH: 373, position: "top-right", enterFrame: 12, size: 175 },
  },
  // 14 — 하이닉스 재직자
  {
    text: "하이닉스 재직자들이 베풀어 주는",
    audio: "audio_14_하이닉스_재직자들이_베풀어_주는.mp3",
    sfx: "sfx-14-giga.mp3",
    durationInFrames: dur(3.343673),
    gradient: G[6],
    layout: {
      kind: "portrait-burst",
      primary: { src: "scene-14-office-worker.png", type: "image", naturalW: 841, naturalH: 941 },
      accents: [
        { icon: faBuilding, color: "#00b894", size: 68, x: 0.88, y: 0.1,  animate: "pulse" },
        { icon: faStar,     color: "#00b894", size: 52, x: 0.12, y: 0.88, animate: "float", opacity: 0.8 },
      ],
    },
  },
  // 15 — 도네이션
  {
    text: "도네이션을 받아 근근히",
    audio: "audio_15_도네이션을_받아_근근히.mp3",
    sfx: "sfx-15-katog.mp3",
    durationInFrames: dur(2.638367),
    gradient: G[7],
    layout: {
      kind: "bg-float",
      primary:   { src: "scene-15-donation.mp4", type: "video", naturalW: 480, naturalH: 480 },
      secondary: { src: "scene-15-donation.png", type: "image", naturalW: 637, naturalH: 791 },
      accents: [
        { icon: faGift, color: "#fd79a8", size: 68, x: 0.88, y: 0.12, animate: "bounce" },
        { icon: faStar, color: "#fd79a8", size: 52, x: 0.12, y: 0.88, animate: "spin",  opacity: 0.8 },
      ],
    },
    pepe: { src: "페페 부자.jpg", naturalW: 800, naturalH: 800, position: "top-left", enterFrame: 15, size: 185 },
  },
  // 16 — 생계 유지 (엔딩)
  {
    text: "생계를 유지할 수 있게 되었습니다.",
    audio: "audio_16_생계를_유지할_수_있게_되었습니다_.mp3",
    sfx: "sfx-16-ending.mp3",
    sfxVolume: 0.5,
    durationInFrames: dur(2.586122),
    gradient: G[0],
    layout: {
      kind: "center-icons",
      primary: { src: "scene-16-life.png", type: "image", naturalW: 823, naturalH: 823 },
      accents: [
        { icon: faSeedling, color: "#55efc4", size: 68, x: 0.88, y: 0.12, animate: "float" },
        { icon: faStar,     color: "#55efc4", size: 52, x: 0.12, y: 0.88, animate: "pulse", opacity: 0.8 },
      ],
    },
    isLast: true,
  },
];

// Overlay junctions (i % 3 === 2) don't create overlap — only Transition junctions do
const TRANSITION_JUNCTION_COUNT = Array.from({ length: SCENES.length - 1 }, (_, i) => i).filter(
  (i) => i % 3 !== 2
).length;

const TOTAL_FRAMES =
  SCENES.reduce((s, sc) => s + sc.durationInFrames, 0) -
  TRANSITION_JUNCTION_COUNT * TRANSITION_FRAMES;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTransition = { presentation: any; timing: any };

const TRANSITION_DEFS: AnyTransition[] = [
  { presentation: slide({ direction: "from-right" }),      timing: springTiming({ config: { damping: 200 } }) },
  { presentation: fade(),                                   timing: linearTiming({ durationInFrames: 18 }) },
  { presentation: wipe({ direction: "from-top-left" }),    timing: springTiming({ config: { damping: 150 } }) },
  { presentation: flip({ direction: "from-right" }),       timing: springTiming({ config: { damping: 200 } }) },
  { presentation: slide({ direction: "from-bottom" }),     timing: springTiming({ config: { damping: 180 } }) },
  { presentation: wipe({ direction: "from-bottom-left" }), timing: springTiming({ config: { damping: 160 } }) },
];

export const DevVideo: React.FC = () => {
  return (
    <TransitionSeries>
      {SCENES.map((scene, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={scene.durationInFrames}>
            <DevScene {...scene} />
          </TransitionSeries.Sequence>

          {i < SCENES.length - 1 &&
            (i % 3 === 2 ? (
              <TransitionSeries.Overlay durationInFrames={28}>
                <LightLeak seed={i} hueShift={(i * 55) % 360} />
              </TransitionSeries.Overlay>
            ) : (
              <TransitionSeries.Transition
                presentation={TRANSITION_DEFS[i % TRANSITION_DEFS.length].presentation}
                timing={TRANSITION_DEFS[i % TRANSITION_DEFS.length].timing}
              />
            ))}
        </React.Fragment>
      ))}
    </TransitionSeries>
  );
};

export { TOTAL_FRAMES, FPS };
