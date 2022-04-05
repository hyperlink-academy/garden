import { ButtonPrimary, ButtonSecondary, ButtonTertiary, ButtonLink } from "components/Buttons";
import { Deck } from "components/Icons";
import { ComponentViewer, Stories, Props } from "./index";
export { getStaticProps } from "./index";

const ButtonsStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={{}}>
      primary:
      <div className="flex gap-4 mb-8">
        <ButtonPrimary content='Create Deck' />
        <ButtonPrimary content='Create Deck' icon={<Deck/>} />
      </div>
      
      secondary:
      <div className="flex gap-4 mb-8">
        <ButtonSecondary content='Create Deck' />
        <ButtonSecondary content='Create Deck' icon={<Deck/>} />
      </div>
      
      tertiary:
      <div className="flex gap-4 mb-8">
        <ButtonTertiary content='Create Deck' />
        <ButtonTertiary content='Create Deck' icon={<Deck/>} />
      </div>
      
      link button:
      <div className="flex gap-4 mb-8">
        <ButtonLink content='Create Deck' />
        <ButtonLink content='Create Deck' icon={<Deck/>} />
      </div>
    </ComponentViewer>
  );
};

ButtonsStory.metadata = {
  name: "Buttons",
};

export default ButtonsStory;
