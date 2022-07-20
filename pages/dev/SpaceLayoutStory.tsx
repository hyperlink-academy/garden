import { SpaceLayout } from "components/SpaceLayout";
import { ComponentViewer, Props } from "./index";
export { getStaticProps } from "./index";

const SpaceNavFooterStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={{}}>
      <div style={{ height: "80vh" }}>
        <SpaceLayout>
          <div className="h-[2000px] bg-gradient-to-bl from-test-blue to-test-pink " />
        </SpaceLayout>
      </div>
    </ComponentViewer>
  );
};

SpaceNavFooterStory.metadata = {
  name: "Space Nav Footer",
};

export default SpaceNavFooterStory;
