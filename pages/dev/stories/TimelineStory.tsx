import { Timeline } from "components/Timeline";
import { ComponentViewer, Props, Stories } from "./index";
export { getStaticProps } from "./index";

const entities: Stories = {
  //   FewEvents: {
  //     entities: [{}],
  //   },
  //   ManyEvents: {
  //     entities: [{}],
  //   },
};

const TimelineStory = (props: Props) => (
  <ComponentViewer components={props.components} stories={entities}>
    <Timeline />
  </ComponentViewer>
);

TimelineStory.metadata = {
  name: "Timeline",
};

export default TimelineStory;
