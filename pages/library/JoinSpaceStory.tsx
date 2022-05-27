import { JoinSpace } from "pages/s/[studio]/s/[space]/join";
import { ComponentViewer, Props } from "./index";
export { getStaticProps } from "./index";
import { SpaceInfo } from "components/SpaceInfo";
import { spaceID } from "src/lorem";

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

const JoinSpaceStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={stories}>
      <JoinSpace />
    </ComponentViewer>
  );
};

JoinSpaceStory.metadata = {
  name: "Join Space",
};

export default JoinSpaceStory;
