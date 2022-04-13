import { Card } from "components/Card";
import { ComponentViewer, Props, Stories } from "./index";
export { getStaticProps } from "./index";

const Stories: Stories = {
  default: {
    entities: [{ "card/content": "hi I am descripshun" }],
  },
};

const CardStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={Stories}>
      <Card />
    </ComponentViewer>
  );
};

CardStory.metadata = {
  name: "Card",
};

export default CardStory;
