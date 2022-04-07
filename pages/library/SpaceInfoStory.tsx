import { ComponentViewer, Props } from "./index";
export { getStaticProps } from "./index";

const SpaceInfoStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={{}}>
      <p>hi</p>
    </ComponentViewer>
  );
};

SpaceInfoStory.metadata = {
  name: "Space Info",
};

export default SpaceInfoStory;
