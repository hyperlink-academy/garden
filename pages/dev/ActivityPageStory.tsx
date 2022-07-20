import { ref } from "data/Facts";
import { Activity } from "pages/s/[studio]/s/[space]/activity/[activity]";
import { getRandomTitleBook } from "src/corporeal";
import { ComponentViewer, Props, Stories } from "./index";
export { getStaticProps } from "./index";

const stories: Stories = {
  Default: {
    entities: [
      {
        "activity/name": "Drafting",
        "activity/hand-contains": [...Array(8).keys()].map((_a, id) =>
          ref((id + 1).toString())
        ),
      },
      ...[...Array(8).keys()].map(() => {
        return {
          "card/title": getRandomTitleBook(),
        };
      }),
    ],
  },
};
const ActivityPageStory = (props: Props) => {
  return (
    <ComponentViewer {...props} stories={stories}>
      <Activity entity={"0"} />
    </ComponentViewer>
  );
};

ActivityPageStory.metadata = { name: "Activity Page" };

export default ActivityPageStory;
