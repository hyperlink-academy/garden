import React, { forwardRef, useCallback, useContext } from "react";
import Linkify from "linkify-react";
import { parseLine } from "src/parseMarkdownLine";
import { useCardViewer } from "components/CardViewerContext";
import {
  ReplicacheContext,
  scanIndex,
  useMutations,
} from "hooks/useReplicache";
import { ulid } from "src/ulid";

export const RenderedText = forwardRef<
  HTMLPreElement,
  { text: string; renderLinks?: boolean } & JSX.IntrinsicElements["pre"]
>((props, ref) => {
  let { open } = useCardViewer();
  let { mutate, authorized, memberEntity } = useMutations();
  let rep = useContext(ReplicacheContext);
  let openLink = useCallback(
    async (link: string) => {
      let entity = await rep?.rep.query((tx) =>
        scanIndex(tx).ave("card/title", link.slice(2, -2))
      );
      if (!entity || entity.value !== link) {
        if (!authorized || !memberEntity) return;
        let entityID = ulid();
        await mutate("createCard", {
          entityID,
          title: link.slice(2,-2),
          memberEntity,
        });

        open({ entityID });
        return;
      }
      open({ entityID: entity.entity });
    },
    [open, rep?.rep]
  );
  let parseConfig = {
    renderLinks: props.renderLinks,
    openLink,
  };
  return (
    <Linkify options={{ className: "text-accent-blue underline" }}>
      <pre
        role="link"
        ref={ref}
        {...props}
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
            if (t.startsWith("##"))
              return (
                <p className="font-bold text-grey-35" key={key}>
                  {parseLine(t, parseConfig)}
                </p>
              );
            if (t.startsWith("#"))
              return (
                <p className="font-bold underline decoration-2 " key={key}>
                  {parseLine(t, parseConfig)}
                </p>
              );
            if (t.match(/^[0-9]+\./)) {
              let [num, ...rest] = t.split(" ");
              return (
                <p className="" key={key}>
                  <strong>{num}</strong>{" "}
                  {parseLine(rest.join(" "), parseConfig)}
                </p>
              );
            }
            if (t.startsWith("-"))
              return (
                <p key={key}>
                  <strong>-</strong>
                  {parseLine(t.slice(1), parseConfig)}
                </p>
              );

            return <p key={key}>{parseLine(t, parseConfig)}</p>;
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
