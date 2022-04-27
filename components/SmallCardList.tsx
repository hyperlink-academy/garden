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
        <div className="flex flex-wrap gap-4">
          {items.map((c, index) => {
            let entity = props.backlink ? c.entity : c.value.value;

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
                href={`/s/${studio}/s/${space}/c/${entity}`}
                entityID={entity}
                id={c.id}
              />
            );
          })}
        </div>
      ) : (
        <div className="pb-4"></div>
      )}
    </SortableContext>
  );
};
