import { Desktop } from "components/Desktop";
import { flag, ref } from "data/Facts";
import { getRandomTitleBook } from "src/corporeal";
import { ComponentViewer, Stories, Props } from "./index";
export { getStaticProps } from "./index";

const stories: Stories = {
  Story1: {
    entities: [
      {
        home: flag(),
        "deck/contains": [...Array(8).keys()].map((_a, id) =>
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

const DesktopStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={stories}>
      <Desktop />
    </ComponentViewer>
  );
};
DesktopStory.metadata = {
  name: "Desktop",
};

export default DesktopStory;
