import {
  ButtonPrimary,
  ButtonSecondary,
  ButtonTertiary,
  ButtonLink,
} from "components/Buttons";

import { DeckSmall } from "components/Icons";
import { ComponentViewer, Props } from "./index";
export { getStaticProps } from "./index";

const ButtonsStory = (props: Props) => {
  const onClick = (e: React.MouseEvent) => {
    console.log(e);
  };
  return (
    <ComponentViewer components={props.components} stories={{}}>
      primary:
      <div className="flex gap-4 mb-8">
        <ButtonPrimary onClick={onClick} content="Create Deck" />
        <ButtonPrimary
          onClick={onClick}
          content="Create Deck"
          icon={<DeckSmall />}
        />
      </div>
      secondary:
      <div className="flex gap-4 mb-8">
        <ButtonSecondary onClick={onClick} content="Create Deck" />
        <ButtonSecondary
          onClick={onClick}
          content="Create Deck"
          icon={<DeckSmall />}
        />
      </div>
      tertiary:
      <div className="flex gap-4 mb-8">
        <ButtonTertiary onClick={onClick} content="Create Deck" />
        <ButtonTertiary
          onClick={onClick}
          content="Create Deck"
          icon={<DeckSmall />}
        />
      </div>
      link button:
      <div className="flex gap-4 mb-8">
        <ButtonLink onClick={onClick} content="Create Deck" />
        <ButtonLink
          onClick={onClick}
          content="Create Deck"
          icon={<DeckSmall />}
        />
      </div>
    </ComponentViewer>
  );
};

ButtonsStory.metadata = {
  name: "Buttons",
};

export default ButtonsStory;
