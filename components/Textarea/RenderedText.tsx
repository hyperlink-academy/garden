import React, { forwardRef } from "react";
import Linkify from "linkify-react";

export const RenderedText = forwardRef<
  HTMLPreElement,
  { text: string; placeholderOnHover?: boolean } & JSX.IntrinsicElements["pre"]
>((props, ref) => {
  return (
    // <Linkify options={{ className: "text-accent-blue underline" }}>
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
          <span
            className={`${
              props.placeholderOnHover ? "opacity-0 hover:opacity-100 " : ""
            } !text-grey-80 italic block w-full`}
          >
            {props.placeholder}
          </span>
        )}
      </pre>
    // </Linkify>
  );
});

RenderedText.displayName = "RenderedText";
