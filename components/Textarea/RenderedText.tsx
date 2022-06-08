import React, { forwardRef } from "react";
import Linkify from "linkify-react";

export const RenderedText = forwardRef<
  HTMLPreElement,
  { text: string } & JSX.IntrinsicElements["pre"]
>((props, ref) => {
  return (
    <Linkify options={{ className: "text-accent-blue underline" }}>
      <pre ref={ref} {...{ ...props, value: undefined }}>
        {props.text ? (
          // One day we should do proper parsing but for now a line-based approach works
          // great
          props.text.split("\n").map((t, key) => {
            if (t.startsWith("##"))
              return (
                <p className="font-bold text-grey-35" key={key}>
                  {t + "\n"}
                </p>
              );
            if (t.startsWith("#"))
              return (
                <p className="font-bold" key={key}>
                  {t + "\n"}
                </p>
              );
            return <p key={key}>{t + "\n"}</p>;
          })
        ) : (
          <span className="!text-grey-80 italic">{props.placeholder}</span>
        )}
      </pre>
    </Linkify>
  );
});

RenderedText.displayName = "RenderedText";
