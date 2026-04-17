import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { DevVideo, FPS, TOTAL_FRAMES } from "./DevVideo";
import { LyricsVideo, LYRICS_DURATION, LYRICS_FPS } from "./LyricsVideo";
import { AlbireoVideo, ALBIREO_TOTAL, ALBIREO_FPS } from "./AlbireoVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={60}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="DevVideo"
        component={DevVideo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="LyricsVideo"
        component={LyricsVideo}
        durationInFrames={LYRICS_DURATION}
        fps={LYRICS_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="AlbireoVideo"
        component={AlbireoVideo}
        durationInFrames={ALBIREO_TOTAL}
        fps={ALBIREO_FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
