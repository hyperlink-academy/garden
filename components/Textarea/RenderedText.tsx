import React, { forwardRef } from "react";
import Linkify from "linkify-react";
import { parseLine } from "src/parseMarkdownLine";

export const RenderedText = forwardRef<
  HTMLPreElement,
  { text: string; placeholderOnHover?: boolean } & JSX.IntrinsicElements["pre"]
>((props, ref) => {
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
                  {parseLine(t)}
                </p>
              );
            if (t.startsWith("#"))
              return (
                <p className="font-bold underline decoration-2 " key={key}>
                  {parseLine(t)}
                </p>
              );
            if (t.match(/^[0-9]+\./)) {
              let [num, ...rest] = t.split(" ");
              return (
                <p className="" key={key}>
                  <strong>{num}</strong> {parseLine(rest.join(" "))}
                </p>
              );
            }
            if (t.startsWith("-"))
              return (
                <p key={key}>
                  <strong>-</strong>
                  {parseLine(t.slice(1))}
                </p>
              );

            return <p key={key}>{parseLine(t)}</p>;
          })
        ) : (
          <span
            className={`${
              props.placeholderOnHover ? "opacity-0 hover:opacity-100 " : ""
            } block w-full italic !text-grey-80`}
          >
            {props.placeholder}
          </span>
        )}
      </pre>
    </Linkify>
  );
});

RenderedText.displayName = "RenderedText";
