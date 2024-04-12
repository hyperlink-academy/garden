import { db, useMutations } from "hooks/useReplicache";
import { SingleTextSection } from "./Sections";
import { useCallback, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { CardSmall } from "components/Icons";
import { useCardViewer } from "components/CardViewerContext";
import { useCloseCard } from "hooks/useUIState";
import { elementID } from "src/utils";

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
  let { open } = useCardViewer();
  let close = useCloseCard();
  let complete = useCallback(
    async (selectedCard?: string) => {
      if (selectedCard) {
        let newCard = selectedCard;

        action.start();
        await mutate("replaceCard", {
          currentCard: props.entityID,
          newCard,
        });
        open({ entityID: newCard, parent: props.entityID });
        close(props.entityID);

        action.end();
        setTimeout(() => {
          document.getElementById(elementID.card(props.entityID).content)
            ?.focus;
        }, 50);
        return;
      }
      let element = document.getElementById(
        elementID.card(props.entityID).content
      );
      element?.focus();
    },
    [props.entityID, action, mutate, open, close]
  );

  return (
    <div>
      <SingleTextSection
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        id={elementID.card(props.entityID).title}
        className="bg-inherit text-lg font-bold"
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            complete(matchingTitles[selectedAutocomplete]?.entity);
          }
          if (matchingTitles.length === 0) return;
          if (
            (e.key === "ArrowDown" && !(e.ctrlKey || e.metaKey)) ||
            (e.ctrlKey && e.key === "j")
          ) {
            e.preventDefault();
            setSelectedAutocomplete((s) =>
              Math.min(s + 1, matchingTitles.length - 1)
            );
          }

          if (
            (e.key === "ArrowUp" && !(e.ctrlKey || e.metaKey)) ||
            (e.ctrlKey && e.key === "k")
          ) {
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
      style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
    >
      <CardSmall className="shrink-0 grow-0" />
      {props.name}
    </button>
  );
};
