import { Card } from "components/Card";
import { ComponentViewer, Props } from "./index";
export { getStaticProps } from "./index";

const CardStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={{}}>
      <Card />
    </ComponentViewer>
  );
};

CardStory.metadata = {
  name: "Card",
};

export default CardStory;
