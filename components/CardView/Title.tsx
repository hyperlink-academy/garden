import { db, useMutations } from "hooks/useReplicache";
import { SingleTextSection } from "./Sections";
import { useCallback, useState } from "react";
import { useOpenCard } from "hooks/useUIState";
import * as Popover from "@radix-ui/react-popover";
import { CardSmall } from "components/Icons";
import { createPortal } from "react-dom";

export const Title = (props: { entityID: string }) => {
  let { authorized, mutate, action } = useMutations();
  let memberName = db.useEntity(props.entityID, "member/name");
  let cardTitle = db.useEntity(props.entityID, "card/title");
  let titleFact = memberName || cardTitle;
  let content = db.useEntity(props.entityID, "card/content");
  let titles = db.useAttribute(content?.value ? null : "card/title");
  let matchingTitles = titles.filter(
    (t) =>
      titleFact &&
      t.value
        .toLocaleLowerCase()
        .includes(titleFact?.value.toLocaleLowerCase()) &&
      t.entity !== props.entityID
  );
  let [focused, setFocused] = useState(false);
  let [selectedAutocomplete, setSelectedAutocomplete] = useState(0);
  let openCard = useOpenCard();
  let complete = useCallback(
    async (selectedCard?: string) => {
      if (selectedCard) {
        let newCard = selectedCard;

        action.start();
        await mutate("replaceCard", {
          currentCard: props.entityID,
          newCard,
        });
        openCard(newCard);

        action.end();
        setTimeout(() => {
          document.getElementById("default-text-section")?.focus;
        }, 50);
        return;
      }
      let element = document.getElementById("default-text-section");
      element?.focus();
    },
    [props.entityID, action, mutate, openCard]
  );
  return (
    <div>
      <SingleTextSection
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        id="card-title"
        className="bg-inherit text-xl font-bold"
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            complete(matchingTitles[selectedAutocomplete]?.entity);
          }
          if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "j")) {
            e.preventDefault();
            setSelectedAutocomplete((s) =>
              Math.min(s + 1, matchingTitles.length - 1)
            );
          }

          if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "k")) {
            setSelectedAutocomplete((s) => Math.max(s - 1, 0));
            e.preventDefault();
          }
        }}
        entityID={props.entityID}
        section={titleFact?.attribute || "card/title"}
        previewOnly={titleFact?.attribute === "member/name"}
        placeholder={authorized ? "Untitled" : "Untitled"}
      />
      <Popover.Root
        open={
          !content?.value &&
          matchingTitles.length > 0 &&
          !!titleFact?.value &&
          focused
        }
      >
        <Popover.Anchor />
        <Popover.Content
          align={"start"}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div
            className="flex flex-col rounded-md border border-grey-55 bg-white py-2 shadow-md"
            style={{ width: "var(--radix-popper-anchor-width)" }}
          >
            {matchingTitles.map((t, index) => (
              <AutocompleteItem
                key={t.entity}
                complete={complete}
                name={t.value}
                entity={t.entity}
                selected={selectedAutocomplete}
                index={index}
              />
            ))}
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
};

const AutocompleteItem = (props: {
  name: string;
  complete: (card: string) => void;
  entity: string;
  index: number;
  selected: number;
}) => {
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        props.complete(props.entity);
      }}
      className={`flex w-full flex-row gap-1 px-2 text-left ${
        props.selected === props.index ? "bg-bg-blue" : ""
      }`}
    >
      <CardSmall className="shrink-0 grow-0" />
      {props.name}
    </button>
  );
};
