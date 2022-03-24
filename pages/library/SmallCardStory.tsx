import { SmallCard } from "components/SmallCard";
import { ComponentViewer, Stories, Props } from "./index";
export { getStaticProps } from "./index";
const entities: Stories = {
  ShortContent: {
    entities: [
      {
        id: "1",
        facts: [
          {
            attribute: "textContent",
            value: "Short content",
          },
          {
            attribute: "card/title",
            value: "Hello world",
          },
        ],
      },
    ],
  },
  LongContent: {
    entities: [
      {
        id: "1",
        facts: [
          {
            attribute: "textContent",
            value:
              "This is a much longer piece of content. I should write generators for all this stuff!",
          },
          {
            attribute: "card/title",
            value: "Hello world",
          },
        ],
      },
    ],
  },
};
const SmallCardStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={entities}>
      <SmallCard href="" entityID={"1"} />
    </ComponentViewer>
  );
};

SmallCardStory.metadata = {
  name: "Small Card",
};

export default SmallCardStory;
