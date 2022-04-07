import { SmallCard } from "components/SmallCard";
import { ComponentViewer, Stories, Props } from "./index";
export { getStaticProps } from "./index";
const entities: Stories = {
  ShortTitle: {
    entities: [
      {
        "card/content": "Short content",
        "card/title": "Hello world",
      },
    ],
  },
  LongContent: {
    entities: [
      {
        "card/content":
          "This is a much longer piece of content. I should write generators for all this stuff!",
      },
    ],
  },
  LongTitle: {
    entities: [
      {
        "card/title":
          "Too Like the Lightning by Ada Palmer, Terra Ignota: Book One",
      },
    ],
  },
};
const SmallCardStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={entities}>
      <div className="grid gap-2">
        <SmallCard href="" entityID={"1"} id={"1"} />
        <SmallCard href="" entityID={"1"} id={"2"} onDelete={() => {}} />
        <SmallCard href="" entityID={"1"} id={"3"} draggable={true} />
      </div>
    </ComponentViewer>
  );
};

SmallCardStory.metadata = {
  name: "Small Card",
};

export default SmallCardStory;
