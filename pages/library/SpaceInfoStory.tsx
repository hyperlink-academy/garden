import { SpaceInfo } from "components/SpaceInfo";
import { ComponentViewer, Props } from "./index";
export { getStaticProps } from "./index";

const SpaceInfoStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={{}}>
      <SpaceInfo />
    </ComponentViewer>
  );
};

SpaceInfoStory.metadata = {
  name: "Space Info",
};

export default SpaceInfoStory;
