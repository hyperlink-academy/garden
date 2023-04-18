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
  let previewElement = useRef<HTMLPreElement | null>(null);
  let ignoreFocus = useRef(false);

  let [initialCursor, setInitialCursor] = useState<[number, number] | null>(
    null
  );
  let [focused, setFocused] = useState(false);
  useEffect(() => {
    if (props.focused !== undefined) {
      setFocused(props.focused);
    }
  }, [props.focused]);

  let newProps = { ...props };
  delete newProps.previewOnly;
  delete newProps.focused;

  useEffect(() => {
    if (!focused || !textarea.current) return;
    if (textarea.current === document.activeElement) return;
    textarea.current.focus({ preventScroll: true });
    if (initialCursor)
      textarea.current.setSelectionRange(initialCursor[0], initialCursor[1]);
  }, [initialCursor, focused]);

  if ((!focused || props.previewOnly) && typeof props.value === "string") {
    return (
      <RenderedText
        {...(newProps as JSX.IntrinsicElements["pre"])}
        text={props.value}
        ref={previewElement}
        tabIndex={0}
        style={{
          ...props.style,
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
          width: "100%",
        }}
        onFocus={() => {
          if (!ignoreFocus.current) setFocused(true);
          ignoreFocus.current = false;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (e.isDefaultPrevented()) return;
            if (props.previewOnly) return;
            setFocused(true);
            if (typeof props.value === "string")
              setInitialCursor([props.value?.length, props.value?.length]);
          }
        }}
        onTouchStart={() => {
          ignoreFocus.current = true;
        }}
        onMouseDown={() => {
          ignoreFocus.current = true;
        }}
        onClick={(e) => {
          if (e.isDefaultPrevented()) return;
          if (props.previewOnly) return;
          if (props.value) {
            let range = window.getSelection()?.getRangeAt(0);
            if (!range || !previewElement.current) return;
            if (range.startContainer !== range.endContainer) return;
            let length = range.toString().length;
            range.setStart(previewElement.current, 0);
            let end = range.toString().length;
            let start = end - length;

            setInitialCursor([start, end]);
          }
          setFocused(true);
        }}
      />
    );
  }
  return (
    <AutosizeTextarea
      {...newProps}
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
