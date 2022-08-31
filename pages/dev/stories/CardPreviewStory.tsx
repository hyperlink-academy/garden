import { CardPreview } from "components/CardPreview";
import { flag } from "data/Facts";
import { ComponentViewer, Props } from "./index";
export { getStaticProps } from "./index";

const stories = {
  default: {
    entities: [
      { "card/title": "A deck!", deck: flag() },
      { "card/title": "A card!", "card/content": "I am a card woo" },
      { "member/name": "A member!" },
    ],
  },
};

const CardPreviewStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={stories}>
      <div className="flex gap-2 flex-col">
        {stories.default.entities.map((_c, index) => {
          return (
            <>
              <CardPreview entityID={index.toString()} size="small" href="" />
              <CardPreview entityID={index.toString()} size="big" href="" />
            </>
          );
        })}
      </div>
    </ComponentViewer>
  );
};

CardPreviewStory.metadata = {
  name: "Card Preview",
};

export default CardPreviewStory;
