import {
  CardSmall,
  ReactionAdd,
  CloseLinedTiny,
  Delete,
} from "components/Icons";
import { Divider } from "components/Layout";
import * as Popover from "@radix-ui/react-popover";
import { useSelectedCards } from "hooks/useUIState";
import { CardBackgroundColors } from "src/constants";
import { scanIndex, useMutations } from "hooks/useReplicache";
import { AddReaction } from "components/CardView/Reactions";
import { useSubscribe } from "hooks/useSubscribe";

export const CardActionMenu = () => {
  let [selectedCards, setSelectedCards] = useSelectedCards();
  return (
    <div className="mb-6 flex flex-row items-center gap-1 ">
      <div className="cardActionMenu bg-grey-90 text-grey-35 border-grey-80 flex items-center gap-2 rounded-full border px-2 py-1">
        <div className="bg-accent-blue text-md cardActionCounter relative flex h-6 place-items-center gap-1  rounded-full pl-1 pr-2 font-bold text-white">
          <CardSmall /> {selectedCards.length}
        </div>
        <div className="relative">
          <ReactionPicker selectedCards={selectedCards} />
        </div>
        <div className="relative">
          <CardBackgroundColorPicker selectedCards={selectedCards} />
        </div>
        <div className="h-6">
          <Divider vertical />
        </div>
      </div>
      <button
        className="bg-background border-grey-80 hover:bg-grey-90 rounded-full border p-[3px]"
        onClick={() => {
          setSelectedCards([]);
        }}
      >
        <CloseLinedTiny width={16} height={16} className="text-grey-55" />
      </button>
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
    colors.length === 1 ? colors[0] : `conic-gradient(${colors.join(", ")})`;

  return (
    <ActionItem
      button={
        <button
          className={`h-5 w-5 rounded-full border hover:cursor-pointer
           ${"border-grey-55 border-2"}`}
          style={{ background: gradient }}
        />
      }
    >
      <Popover.Arrow />
      <div className="bg-grey-90 rounded-lg p-2">
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
    <Popover.Content sideOffset={8}>
      <Popover.Arrow />
      {props.children}
    </Popover.Content>
  </Popover.Root>
);
