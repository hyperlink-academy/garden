import { ComponentViewer, Stories, Props } from "./index";
import { SpaceNavFooter } from "components/SpaceNavFooter";
export { getStaticProps } from "./index";

const SpaceNavFooterStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={{}}>
      <div className="h-[2000px] bg-gradient-to-bl from-test-blue to-test-pink ">
        <SpaceNavFooter currentPage="home" />
      </div>
    </ComponentViewer>
  );
};

SpaceNavFooterStory.metadata = {
  name: "Space Nav Footer",
};

export default SpaceNavFooterStory;
