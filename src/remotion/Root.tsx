import React from "react";
import { Composition, Folder } from "remotion";
import { DynamicComp } from "./DynamicComp";
import { KeepTripMG } from "./compositions/KeepTrip";
import { KeepTripAdVideo } from "./compositions/KeepTripAd";
import { KeepTripKinetic } from "./compositions/KeepTripKinetic";
import { SmartTravelSteps } from "./compositions/SmartTravelSteps";
import { KeepTripSplit } from "./compositions/KeepTripSplit";
import { JastipLaunch } from "./compositions/JastipLaunch";
import { SplitBillLaunch } from "./compositions/SplitBillLaunch";

const defaultCode = `import { AbsoluteFill } from "remotion";
export const MyAnimation = () => <AbsoluteFill style={{ backgroundColor: "#000" }} />;`;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DynamicComp"
        component={DynamicComp}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ code: defaultCode }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.durationInFrames as number,
          fps: props.fps as number,
        })}
      />
      <Folder name="KeepTrip">
        <Composition
          id="KeepTripMG"
          component={KeepTripMG}
          durationInFrames={1440}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="KeepTripAd"
          component={KeepTripAdVideo}
          durationInFrames={1350}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="KeepTripKinetic"
          component={KeepTripKinetic}
          durationInFrames={1065}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="SmartTravelSteps"
          component={SmartTravelSteps}
          durationInFrames={1170}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="KeepTripSplit"
          component={KeepTripSplit}
          durationInFrames={1260}
          fps={30}
          width={1080}
          height={1920}
        />
      </Folder>
      <Folder name="TravTrack">
        <Composition
          id="JastipLaunch"
          component={JastipLaunch}
          durationInFrames={900}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="SplitBillLaunch"
          component={SplitBillLaunch}
          durationInFrames={1110}
          fps={30}
          width={1080}
          height={1920}
        />
      </Folder>
    </>
  );
};
