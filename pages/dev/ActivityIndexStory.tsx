import { ComponentViewer, Props, Stories } from "./index";
import ActivityIndex from "pages/s/[studio]/s/[space]/activity";
import { flag } from "data/Facts";
export { getStaticProps } from "./index";
const stories: Stories = {
  Default: {
    entities: [
      {
        "activity/name": "Drafting",
        "activity/active": flag(),
      },
      {
        "activity/name": "Publishing",
        "activity/active": flag(),
      },
      {
        "activity/name": "Publishing 2022-03-04",
      },
    ],
  },
};
const ActivityIndexStory = (props: Props) => {
  return (
    <ComponentViewer {...props} stories={stories}>
      <ActivityIndex />
    </ComponentViewer>
  );
};

ActivityIndexStory.metadata = { name: "Activity Index" };
export default ActivityIndexStory;
