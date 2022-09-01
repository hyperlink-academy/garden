import { CardPreview } from "components/CardPreview";
import { flag } from "data/Facts";
import { ComponentViewer, Props } from "./index";
export { getStaticProps } from "./index";

const stories = {
  default: {
    entities: [
      { "card/title": "A deck!", deck: flag() },
      { "card/title": "A card!", "card/content": "https://www.google.com" },
      { "member/name": "A member!" },
      {
        "card/title": "A card with sections",
        "card/section": ["section/idk", "section/another"],
      },
      {
        "card/title": "A card with an image",
        "card/image": {
          type: "file",
          filetype: "external_image",
          url: "https://m.media-amazon.com/images/M/MV5BMTgyOTQ4NjEzNF5BMl5BanBnXkFtZTgwODY1MTMyMDE@._V1_.jpg",
        } as const,
      },
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
              <CardPreview
                entityID={index.toString()}
                size="small"
                href=""
                onResize={() => {}}
                onRotateDrag={() => {}}
                dragHandleProps={{}}
              />
              <CardPreview entityID={index.toString()} size="big" href="" />

              <CardPreview
                entityID={index.toString()}
                size="big"
                href=""
                onResize={() => {}}
                onRotateDrag={() => {}}
                dragHandleProps={{}}
              />
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
