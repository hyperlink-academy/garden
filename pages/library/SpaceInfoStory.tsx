import { SpaceInfo } from "components/SpaceInfo";
import { spaceID } from "src/lorem";
import { ComponentViewer, Props } from "./index";
export { getStaticProps } from "./index";

const stories = {
  default: {
    entities: [
      {
        "this/name": "Space Name",
        "this/description": ` A description for the space that we agreed can be up to 240 chacters long? Did we agree that? Where do I edit this?`,
      },
      { "space/member": spaceID(), "member/name": "Celine" },
      { "space/member": spaceID(), "member/name": "Jared" },
    ],
  },
};

const SpaceInfoStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={stories}>
      <SpaceInfo />
    </ComponentViewer>
  );
};

SpaceInfoStory.metadata = {
  name: "Space Info",
};

export default SpaceInfoStory;
