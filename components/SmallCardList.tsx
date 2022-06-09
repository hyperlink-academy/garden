import { SortableContext } from "@dnd-kit/sortable";
import { ReferenceAttributes } from "data/Attributes";
import { Fact } from "data/Facts";
import { useMutations } from "hooks/useReplicache";
import { useRouter } from "next/router";
import { sortByPosition } from "src/position_helpers";
import { SortableSmallCard } from "./SmallCard";

// Currently this is rendered inside a DnD Context and used in a couple
// different places.
export const SmallCardList = (props: {
  cards: Fact<keyof ReferenceAttributes>[];
  deck: string;
  attribute: keyof ReferenceAttributes;
  horizontal?: boolean;
  positionKey: string;
  backlink?: boolean;
}) => {
  let { studio, space } = useRouter().query;
  let { authorized, mutate } = useMutations();
  let items = props.cards.sort(sortByPosition(props.positionKey));
  let itemsCount = items ? items.length : 0;

  return (
    <SortableContext items={items}>
      {itemsCount > 0 ? (
        <div
          className={`flex w-full gap-4 ${props.horizontal ? "" : "flex-wrap"}`}
        >
          {items.map((c, index) => {
            let entity = props.backlink ? c.entity : c.value.value;
            let attribute =
              props.attribute === "deck/contains"
                ? "cards"
                : props.attribute.slice(8);

            return (
              <SortableSmallCard
                parent={props.deck}
                siblings={props.cards}
                positionKey={props.positionKey}
                section={props.attribute}
                index={index}
                onDelete={
                  !authorized
                    ? undefined
                    : () => {
                        mutate("removeCardFromSection", {
                          id: c.id,
                        });
                      }
                }
                draggable={authorized}
                key={c.id}
                href={`/s/${studio}/s/${space}/c/${props.deck}/${
                  props.backlink ? "b" : "a"
                }/${attribute}/${entity}`}
                entityID={entity}
                id={c.id}
              />
            );
          })}
        </div>
      ) : (
        ""
      )}
    </SortableContext>
  );
};
