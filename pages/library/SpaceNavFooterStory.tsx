import { ComponentViewer, Stories, Props } from "./index";
import { SpaceNavFooter } from "components/SpaceNavFooter";
export { getStaticProps } from "./index";

const SpaceNavFooterStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={{}}>
      <SpaceNavFooter currentPage="home" />
    </ComponentViewer>
  );
};

SpaceNavFooterStory.metadata = {
  name: "Space Nav Footer",
};

export default SpaceNavFooterStory;
