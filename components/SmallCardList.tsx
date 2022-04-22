import {
  closestCenter,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { ReferenceAttributes } from "data/Attributes";
import { Fact } from "data/Facts";
import { useMutations } from "hooks/useReplicache";
import { useRouter } from "next/router";
import { useState } from "react";
import { sortByPosition } from "src/position_helpers";
import { SmallCard } from "./SmallCard";

export const SmallCardList = (props: {
  cards: Fact<keyof ReferenceAttributes>[];
  deck: string;
  attribute: keyof ReferenceAttributes;
  positionKey: string;
}) => {
  let { studio, space } = useRouter().query;
  const mouseSensor = useSensor(MouseSensor, {});
  const touchSensor = useSensor(TouchSensor, {});
  const sensors = useSensors(mouseSensor, touchSensor);
  let { authorized, mutate } = useMutations();
  let [dragging, setDragging] = useState<string | null>(null);
  let items = props.cards.sort(sortByPosition(props.positionKey));
  let itemsCount = items ? items.length : 0;

  return (
    <DndContext
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragStart={({ active }) => {
        setDragging(active.id);
      }}
      onDragEnd={({ over }) => {
        setDragging(null);
        if (over) {
          if (!dragging) return;
          let index = items.findIndex((f) => f.id === over.id);
          let currentIndex = items.findIndex((f) => f.id === dragging);
          if (index === -1) return;
          mutate("moveCard", {
            factID: dragging,
            positionKey: props.positionKey,
            parent: props.deck,
            attribute: props.attribute,
            index: currentIndex < index ? index : index - 1,
          });
        }
      }}
    >
      <SortableContext items={items.map((item) => item.id)}>
        {itemsCount > 0 ? (
          <div className="flex flex-wrap gap-4 pt-8 pb-6">
            {items.map((c) => (
              <SmallCard
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
                href={`/s/${studio}/s/${space}/c/${c.value.value}`}
                entityID={c.value.value}
                id={c.id}
              />
            ))}
          </div>
        ) : (
          <div className="pb-4"></div>
        )}
      </SortableContext>
    </DndContext>
  );
};
