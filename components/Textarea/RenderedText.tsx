import React, { forwardRef } from "react";
import Linkify from "linkify-react";

export const RenderedText = forwardRef<
  HTMLPreElement,
  { text: string } & JSX.IntrinsicElements["pre"]
>((props, ref) => {
  return (
    <Linkify options={{ className: "text-accent-blue underline" }}>
      <pre ref={ref} {...props}>
        {props.text || (
            <span className="!text-grey-80 italic">{props.placeholder}</span>
          ) ||
          " "}
      </pre>
    </Linkify>
  );
});

RenderedText.displayName = "RenderedText";
