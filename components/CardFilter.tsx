import { scanIndex } from "hooks/useReplicache";
import { useSubscribe } from "hooks/useSubscribe";
import { useState, useEffect } from "react";
import { sortByPosition } from "src/position_helpers";
import { z } from "zod";

let FilterVerifier = z.array(
  z.object({
    reaction: z.string(),
    not: z.boolean(),
  })
);
export type Filters = z.TypeOf<typeof FilterVerifier>;

export const useFilteredCards = (
  entityID: string,
  attribute: "desktop/contains" | "deck/contains"
) => {
  let cards = useSubscribe(
    async (tx) => {
      let allCards = await scanIndex(tx).eav(entityID, attribute);
      return Promise.all(
        allCards.sort(sortByPosition("eav")).map(async (card) => {
          let reactions = (
            await scanIndex(tx).eav(card.value.value, "card/reaction")
          ).map((r) => r.value);
          return { ...card, reactions };
        })
      );
    },
    [],
    [entityID, attribute],
    `${entityID}-cards`
  );

  let [filters, setFilters] = useState<Filters>([]);

  // set filter values based on local storage
  useEffect(() => {
    try {
      let filterString = window.localStorage.getItem(
        `cardCollectionFilters-${entityID}`
      );
      if (filterString) {
        let parsed = FilterVerifier.safeParse(JSON.parse(filterString));
        if (parsed.success) setFilters(parsed.data);
      }
    } catch (e) {}
  }, [entityID]);
  // save filter values to local storage every time the filters state is updated
  useEffect(() => {
    window.localStorage.setItem(
      `cardCollectionFilters-${entityID}`,
      JSON.stringify(filters)
    );
  }, [filters, entityID]);

  let reactions = cards.reduce((acc, card) => {
    for (let reaction of card.reactions) {
      if (!acc.includes(reaction)) acc.push(reaction);
    }
    return acc;
  }, [] as string[]);

  let cardsFiltered = cards.filter((card) => {
    let passed = true;
    for (let filter of filters) {
      if (filter.not)
        passed = passed && !card.reactions.includes(filter.reaction);
      else passed = passed && card.reactions.includes(filter.reaction);
    }
    return passed;
  });

  return { reactions, filters, setFilters, cardsFiltered };
};

export function FilterByReactions(props: {
  reactions: string[];
  filters: Filters;
  setFilters: (f: (old: Filters) => Filters) => void;
}) {
  return (
    <div className="lightBorder flex w-full flex-row flex-wrap gap-2 p-2">
      {props.reactions.map((reaction) => {
        let existingFilter = props.filters.find((f) => f.reaction === reaction);
        return (
          <button
            key={reaction}
            onClick={() => {
              props.setFilters((oldFilters) => {
                let existingFilter = oldFilters.find(
                  (f) => f.reaction === reaction
                );
                if (!existingFilter)
                  return [...oldFilters, { reaction, not: false }];
                if (existingFilter.not)
                  return oldFilters.filter((f) => f.reaction !== reaction);
                return oldFilters.map((f) =>
                  f.reaction === reaction ? { ...f, not: true } : f
                );
              });
            }}
            className={`text-md flex items-center gap-2 rounded-md border px-2 py-0.5 ${
              existingFilter
                ? existingFilter.not
                  ? "border-accent-red bg-bg-red"
                  : "border-accent-green bg-bg-green"
                : "border-grey-80"
            }`}
          >
            <strong>
              {existingFilter?.reaction === reaction &&
                (existingFilter.not ? "−" : "+")}{" "}
              {reaction}
            </strong>{" "}
          </button>
        );
      })}
      {props.filters.length > 0 && (
        <button onClick={() => props.setFilters(() => [])}>clear</button>
      )}
    </div>
  );
}
