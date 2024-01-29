import React, { forwardRef, useCallback, useContext } from "react";
import Linkify from "linkify-react";
import { parseLine } from "src/parseMarkdownLine";
import { useCardViewer } from "components/CardViewerContext";
import { ref } from "data/Facts";

import {
  ReplicacheContext,
  scanIndex,
  useMutations,
} from "hooks/useReplicache";
import { ulid } from "src/ulid";

export const RenderedText = forwardRef<
  HTMLPreElement,
  {
    text: string;
    renderLinks?: boolean;
    entityID?: string;
    placeholder?: string;
  } & JSX.IntrinsicElements["pre"]
>((props, elRef) => {
  let { open } = useCardViewer();
  let { mutate, authorized, memberEntity } = useMutations();
  let rep = useContext(ReplicacheContext);
  let openLink = useCallback(
    async (link: string) => {
      let entity = await rep?.rep.query((tx) =>
        scanIndex(tx).ave("card/title", link.slice(2, -2))
      );
      if (!entity || entity.value !== link.slice(2, -2)) {
        if (!authorized || !memberEntity) return;
        let entityID = ulid();
        await mutate("createCard", {
          entityID,
          title: link.slice(2, -2),
          memberEntity,
        });
        if (props.entityID)
          await mutate("assertFact", {
            entity: props.entityID,
            attribute: "card/inline-links-to",
            value: ref(entityID),
            positions: {},
          });

        open({ entityID });
        return;
      }
      open({ entityID: entity.entity });
    },
    [open, rep?.rep, authorized, memberEntity, mutate, props.entityID]
  );
  let parseConfig = {
    renderLinks: props.renderLinks,
    openLink,
  };

  let newProps = { ...props };

  delete newProps.renderLinks;
  //@ts-ignore
  delete newProps.textareaRef;
  //@ts-ignore
  delete newProps.entityID;
  //@ts-ignore
  delete newProps.autoCompleteCardNames;

  return (
    <Linkify
      options={{ className: "text-accent-blue underline", target: "_blank" }}
    >
      <pre
        role="link"
        ref={elRef}
        {...newProps}
        className={`${props.className} break-words`}
        style={{
          ...props.style,
          wordBreak: "break-word", //this works better than tailwind 'break-words' for some reason!
        }}
      >
        {props.text ? (
          // One day we should do proper parsing but for now a line-based approach works
          // great
          props.text.split("\n").map((t, key) => {
            // headers (h1 h2 and h3)
            if (t.startsWith("# "))
              return (
                <span className="font-bold " key={key}>
                  {parseLine(t, parseConfig)}
                </span>
              );
            if (t.startsWith("## "))
              return (
                <span className="font-bold italic text-grey-35" key={key}>
                  {parseLine(t, parseConfig)}
                </span>
              );
            if (t.startsWith("### "))
              return (
                <span className="italic text-grey-35" key={key}>
                  {parseLine(t, parseConfig)}
                </span>
              );
            // blockquote
            if (t.startsWith("> "))
              return (
                <span className="italic text-grey-55" key={key}>
                  {parseLine(t, parseConfig)}
                </span>
              );
            // numbered list
            if (t.match(/^[0-9]+\./)) {
              let [num, ...rest] = t.split(" ");
              return (
                <span className="" key={key}>
                  <strong>{num}</strong>{" "}
                  {parseLine(rest.join(" "), parseConfig)}
                </span>
              );
            }

            return <span key={key}>{parseLine(t, parseConfig)}</span>;
          })
        ) : (
          <span className="block w-full italic !text-grey-80">
            {props.placeholder}
          </span>
        )}
      </pre>
    </Linkify>
  );
});

RenderedText.displayName = "RenderedText";
