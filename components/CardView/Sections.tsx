import { Textarea } from "components/Textarea";

import { useIndex, useMutations } from "hooks/useReplicache";
import { SyntheticEvent, useCallback, useRef, useState } from "react";
import { FilterAttributes } from "data/Attributes";
import { useAuth } from "hooks/useAuth";
import { CardCollection } from "components/CardCollection";
import { Autocomplete, useSuggestions } from "components/Autocomplete";
import { getCoordinatesInTextarea } from "src/getCoordinatesInTextarea";
import { getLinkAtCursor } from "src/utils";
import { modifyString, useKeyboardHandling } from "hooks/useKeyboardHandling";
import { CollectionType } from "components/Room";

export const SingleTextSection = (
  props: {
    autocompleteCardNames?: boolean;
    entityID: string;
    section: keyof FilterAttributes<{
      unique: any;
      type: "string";
      cardinality: "one";
    }>;
    focused?: boolean;
    previewOnly?: boolean;
    className?: string;
    new?: boolean;
  } & JSX.IntrinsicElements["textarea"]
) => {
  let fact = useIndex.eav(props.entityID, props.section);
  let timeout = useRef<null | number>(null);
  let { authorized, mutate, action } = useMutations();

  let [cursorCoordinates, setCursorCoordinates] = useState<
    undefined | { top: number; left: number; textIndex: number }
  >();
  let {
    setSuggestionPrefix,
    suggestionPrefix,
    suggestions,
    suggestionIndex,
    close,
    setSuggestionIndex,
  } = useSuggestions({ disabled: !props.autocompleteCardNames });

  const onSelect = useCallback(
    (e: SyntheticEvent<HTMLTextAreaElement>) => {
      let value = e.currentTarget.value,
        start = e.currentTarget.selectionStart,
        end = e.currentTarget.selectionEnd;
      previousSelection.current = { start, end };
      if (start !== end) return setCursorCoordinates(undefined);

      let link = getLinkAtCursor(value, start);
      if (!link) {
        setSuggestionPrefix(undefined);
        setCursorCoordinates(undefined);
        close();
        return;
      }
      let coordinates = getCoordinatesInTextarea(e.currentTarget, link.start);
      let textareaPosition = e.currentTarget.getBoundingClientRect();
      setCursorCoordinates({
        textIndex: link.start,
        top:
          coordinates.top +
          textareaPosition.top +
          document.documentElement.scrollTop +
          coordinates.height,
        left: coordinates.left + textareaPosition.left,
      });
    },
    [setCursorCoordinates]
  );

  let onKeyDown = useKeyboardHandling({
    ...props,
    suggestions,
    suggestionIndex,
    suggestionPrefix,
    setSuggestionIndex,
    cursorCoordinates,
    close,
  });

  let textareaRef = useRef<HTMLTextAreaElement | null>(null);
  let previousSelection = useRef<null | { start: number; end: number }>();

  return (
    <>
      {suggestionPrefix && cursorCoordinates && suggestions.length > 0 ? (
        <Autocomplete
          top={cursorCoordinates.top}
          onClick={async (item) => {
            if (!textareaRef.current || !suggestionPrefix) return;

            let value = textareaRef.current.value,
              start = textareaRef.current.selectionStart,
              end = textareaRef.current.selectionEnd;

            action.start();
            let [newValue, cursors] = modifyString(
              value,
              [start, end],
              (text) => {
                if (!cursorCoordinates || !suggestionPrefix) return;
                text.delete(
                  cursorCoordinates.textIndex,
                  suggestionPrefix.length
                );
                text.insert(cursorCoordinates.textIndex, item);
              }
            );

            action.add({
              undo: () => {
                textareaRef.current?.setSelectionRange(start, end);
              },
              redo: () => {
                textareaRef?.current?.setSelectionRange(cursors[0], cursors[1]);
              },
            });
            await mutate("assertFact", {
              entity: props.entityID,
              attribute: props.section,
              value: newValue,
              positions: {},
            });
            textareaRef.current.setSelectionRange(
              cursors[0] + 2 - suggestionPrefix.length,
              cursors[1] + 2 - suggestionPrefix.length
            );
            action.end();
          }}
          left={cursorCoordinates.left}
          selected={suggestionIndex}
          suggestions={suggestions.map((s) => s.value)}
          suggestionPrefix={suggestionPrefix}
        />
      ) : null}
      <Textarea
        {...props}
        textareaRef={textareaRef}
        onKeyDown={(e, ref) => {
          props?.onKeyDown?.(e);
          onKeyDown(e, ref);
        }}
        renderLinks={props.autocompleteCardNames}
        focused={props.focused}
        previewOnly={props.previewOnly || !authorized}
        placeholder={props.placeholder}
        className={`w-full bg-inherit ${props.className || ""}`}
        spellCheck={false}
        value={(fact?.value as string) || ""}
        onSelect={onSelect}
        onChange={async (e) => {
          if (!timeout.current) action.start();
          else clearTimeout(timeout.current);
          timeout.current = window.setTimeout(() => {
            timeout.current = null;
            action.end();
          }, 200);

          let value = e.currentTarget.value,
            start = e.currentTarget.selectionStart,
            end = e.currentTarget.selectionEnd;
          if (start !== end) return setCursorCoordinates(undefined);

          let link = getLinkAtCursor(value, start);
          setSuggestionPrefix(link?.value);
          if (!link) {
            setCursorCoordinates(undefined);
            close();
          }
          if (link) {
            let coordinates = getCoordinatesInTextarea(
              e.currentTarget,
              link.start
            );

            let textareaPosition = e.currentTarget.getBoundingClientRect();
            setCursorCoordinates({
              textIndex: link.start,
              top:
                coordinates.top +
                textareaPosition.top +
                document.documentElement.scrollTop +
                coordinates.height,
              left: coordinates.left + textareaPosition.left,
            });
          }

          let previousStart = previousSelection.current?.start;
          let previousEnd = previousSelection.current?.end;
          action.add({
            undo: () => {
              textareaRef.current?.setSelectionRange(
                previousStart || null,
                previousEnd || null
              );
            },
            redo: () => {
              textareaRef.current?.setSelectionRange(start, end);
            },
          });
          await mutate(
            props.section === "card/content"
              ? "updateContentFact"
              : props.section === "card/title"
              ? "updateTitleFact"
              : "assertFact",
            {
              entity: props.entityID,
              attribute: props.section,
              value: value,
              positions: fact?.positions || {},
            }
          );
          previousSelection.current = { start, end };
        }}
      />
    </>
  );
};

export const DateSection = (props: { entityID: string }) => {
  let [editing, setEditing] = useState(false);

  let { session } = useAuth();
  let { mutate, authorized } = useMutations();

  let date = useIndex.eav(props.entityID, "card/date");
  if (!date) return null;
  return (
    <div className="flex gap-2">
      {editing ? (
        <input type="date" value={date.value.value} />
      ) : (
        <span>{date.value.value}</span>
      )}
      {!authorized ? null : (
        <button
          className="justify-self-center text-sm text-grey-55 hover:text-accent-blue"
          onClick={() => {
            if (!date) return;
            mutate("retractFact", { id: date.id });
          }}
        >
          remove
        </button>
      )}
    </div>
  );
};

export const AttachedCardSection = (props: { entityID: string }) => {
  let attachedCards = useIndex.eav(props.entityID, "deck/contains");
  let currentCollectionType = useIndex.eav(props.entityID, "collection/type");

  return (
    <>
      {attachedCards && attachedCards.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="float-right">
            <CollectionType
              collectionType={currentCollectionType?.value}
              entityID={props.entityID}
            />
          </div>
          <CardCollection
            entityID={props.entityID}
            attribute="deck/contains"
            cards={attachedCards}
          />
        </div>
      )}
    </>
  );
};
