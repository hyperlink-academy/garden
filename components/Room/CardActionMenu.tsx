import {
  CardSmall,
  ReactionAdd,
  CloseLinedTiny,
  PopoverArrow,
} from "components/Icons";
import * as Popover from "@radix-ui/react-popover";
import { useSelectedCards } from "hooks/useUIState";
import { CardBackgroundColors } from "src/constants";
import { scanIndex, useMutations } from "hooks/useReplicache";
import { AddReaction } from "components/CardView/Reactions";
import { useSubscribe } from "hooks/useSubscribe";
import { Divider } from "components/Layout";

export const CardActionMenu = () => {
  let [selectedCards, setSelectedCards] = useSelectedCards();
  return (
    <div className="flex  flex-row  items-center gap-1">
      <div className="cardActionMenu bg-accent-blue  flex items-center gap-2 rounded-full border px-2  text-white">
        <div className="relative pt-[6px]">
          <ReactionPicker selectedCards={selectedCards} />
        </div>
        <div className="relative pt-[2px]">
          <CardBackgroundColorPicker selectedCards={selectedCards} />
        </div>
        <div className="h-6">
          <Divider vertical />
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-accent-blue  cardActionCounter relative flex h-6 place-items-center gap-1  rounded-full  font-bold text-white">
            <CardSmall /> {selectedCards.length}
          </div>
          <button
            className="rounded-full  p-[3px] text-sm  hover:underline"
            onClick={() => {
              setSelectedCards([]);
            }}
          >
            clear
            {/* <CloseLinedTiny width={16} height={16} className="text-grey-55" /> */}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReactionPicker = (props: { selectedCards: string[] }) => {
  let { memberEntity } = useMutations();
  let existingReactions = useSubscribe(
    async (tx) => {
      let allAuthorsReactions = [] as Array<Array<string>>;
      console.log(memberEntity);
      if (!memberEntity) return [];
      for (let i = 0; i < props.selectedCards.length; i++) {
        let card = props.selectedCards[i];
        let reactions = await scanIndex(tx).eav(card, "card/reaction");
        let authorReactions = [] as Array<string>;
        for (let reaction of reactions) {
          let author = await scanIndex(tx).eav(reaction.id, "reaction/author");
          if (author?.value.value === memberEntity)
            authorReactions.push(reaction.value);
        }
        allAuthorsReactions.push(authorReactions);
      }
      console.log(allAuthorsReactions);
      return allAuthorsReactions.reduce(
        (acc, array) => acc.filter((item) => array.includes(item)),
        allAuthorsReactions[0] || []
      );
    },
    [],
    [props.selectedCards, memberEntity],
    ""
  );
  return (
    <ActionItem button={<ReactionAdd />}>
      <AddReaction
        entityID={props.selectedCards}
        existingReactions={existingReactions}
      />
    </ActionItem>
  );
};

const CardBackgroundColorPicker = (props: { selectedCards: string[] }) => {
  let { mutate, action } = useMutations();
  let colors = useSubscribe(
    async (tx) => {
      let colors = [] as string[];
      for (let card of props.selectedCards) {
        let color =
          (await scanIndex(tx).eav(card, "card/background-color"))?.value ||
          "#FFFFFF";
        if (!colors.includes(color)) colors.push(color);
      }
      return colors;
    },
    [],
    [props.selectedCards],
    ""
  );
  let setCardBackgroudColor = async (color: string) => {
    action.start();
    for (let card of props.selectedCards) {
      await mutate("assertFact", {
        entity: card,
        attribute: "card/background-color",
        value: color,
        positions: {},
      });
    }
    action.end();
  };
  const gradient =
    colors.length === 1
      ? colors[0]
      : `conic-gradient(#FFFFFF, #CBFF5C, #FF9BE9, #8DF1FF, #FFE660, #FFFFFF)`;

  return (
    <ActionItem
      button={
        <button
          className={`h-5 w-5 rounded-full border hover:cursor-pointer
           ${"border-2 border-white"}`}
          style={{ background: gradient }}
        />
      }
    >
      <div className="lightBorder rounded-lg bg-white p-2">
        <div className="flex gap-2">
          {CardBackgroundColors.map((color) => {
            return (
              <button
                key={color}
                className={`h-5 w-5 rounded-full border hover:cursor-pointer
                   ${"border-grey-80 border-1 hover:border-2"}`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  setCardBackgroudColor(color);
                }}
              />
            );
          })}
        </div>
      </div>
    </ActionItem>
  );
};

const ActionItem = (props: {
  children: React.ReactNode;
  button: React.ReactNode;
}) => (
  <Popover.Root>
    <Popover.Trigger>{props.button}</Popover.Trigger>
    <Popover.Content
      sideOffset={0}
      arrowPadding={100000}
      className="max-w-[240px]"
    >
      <Popover.Arrow asChild>
        <PopoverArrow />
      </Popover.Arrow>
      {props.children}
    </Popover.Content>
  </Popover.Root>
);
