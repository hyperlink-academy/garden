import { SmallCard } from "components/SmallCard";
import { ComponentViewer, Stories, Props } from "./index";
export { getStaticProps } from "./index";
const entities: Stories = {
  ShortTitle: {
    entities: [
      {
        id: "1",
        facts: [
          {
            attribute: "card/content",
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
            attribute: "card/content",
            value:
              "This is a much longer piece of content. I should write generators for all this stuff!",
          },
        ],
      },
    ],
  },
  LongTitle: {
    entities: [
      {
        id: "1",
        facts: [
          {
            attribute: "card/title",
            value:
              "Too Like the Lightning by Ada Palmer, Terra Ignota: Book One",
          },
        ],
      },
    ],
  },
};
const SmallCardStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={entities}>
      <div className="grid gap-2">
        <SmallCard href="" entityID={"1"} />
        <SmallCard href="" entityID={"1"} onDelete={() => {}} />
      </div>
    </ComponentViewer>
  );
};

SmallCardStory.metadata = {
  name: "Small Card",
};

export default SmallCardStory;
