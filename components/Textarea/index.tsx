import { useEffect, useRef, useState } from "react";
import AutosizeTextarea from "./AutosizeTextarea";
import { RenderedText } from "./RenderedText";

export const Textarea = (
  props: {
    previewOnly?: boolean;
    focused?: boolean;
  } & JSX.IntrinsicElements["textarea"]
) => {
  let textarea = useRef<HTMLTextAreaElement | null>(null);
  let pre = useRef<HTMLPreElement | null>(null);

  let [initialCursor, setInitialCursor] = useState<number | null>(null);
  let [focused, setFocused] = useState(false);
  useEffect(() => {
    if (props.focused !== undefined) {
      setFocused(props.focused);
    }
  }, [props.focused]);

  useEffect(() => {
    if (!focused || !textarea.current) return;
    if (textarea.current === document.activeElement) return;
    textarea.current.focus();
    textarea.current.setSelectionRange(initialCursor, initialCursor);
  }, [initialCursor, focused, textarea.current]);

  if ((!focused || props.previewOnly) && typeof props.value === "string") {
    return (
      <RenderedText
        {...(props as JSX.IntrinsicElements["pre"])}
        text={props.value}
        ref={pre}
        tabIndex={0}
        style={{
          ...props.style,
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
          width: "100%",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (e.isDefaultPrevented()) return;
            if (props.previewOnly) return;
            setFocused(true);
            if (typeof props.value === "string")
              setInitialCursor(props.value?.length);
          }
        }}
        onClick={(e) => {
          if (e.isDefaultPrevented()) return;
          if (props.previewOnly) return;
          let range = window.getSelection()?.getRangeAt(0);
          if (!range || !pre.current) return;
          range.setStart(pre.current, 0);
          setFocused(true);
          setInitialCursor(range.toString().length);
        }}
      />
    );
  }
  return (
    <AutosizeTextarea
      {...props}
      focused={focused}
      onKeyDown={(e) => {
        if (e.key === "Escape") e.currentTarget.blur();
        props.onKeyDown?.(e);
      }}
      onChange={async (e) => {
        if (!props.onChange) return;
        let start = e.currentTarget.selectionStart,
          end = e.currentTarget.selectionEnd;
        await Promise.all([props.onChange(e)]);
        textarea.current?.setSelectionRange(start, end);
      }}
      onBlur={(e) => {
        setFocused(false);
        setInitialCursor(null);
        props.onBlur?.(e);
      }}
      ref={textarea}
    />
  );
};
