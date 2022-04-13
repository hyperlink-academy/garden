import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type Props = React.DetailedHTMLProps<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
> & {
  previewOnly?: boolean;
  customCSS?: string;
  focused?: boolean;
};
const Textarea = forwardRef<HTMLTextAreaElement, Props>((props: Props, ref) => {
  let [initialCursor, _setInitialCursor] = useState<number | null>(null);
  let [focused, setFocused] = useState(false);
  useEffect(() => {
    if (props.focused !== undefined) {
      setFocused(props.focused);
    }
  }, [props.focused]);
  let textarea = useRef<HTMLTextAreaElement | null>(null);
  useImperativeHandle(ref, () => textarea.current as HTMLTextAreaElement);
  useEffect(() => {
    if (!focused || !initialCursor || !textarea.current) return;
    if (textarea.current === document.activeElement) return;
    textarea.current.focus();
    textarea.current.setSelectionRange(initialCursor, initialCursor);
  }, [initialCursor, focused, textarea]);

  let passDownProps = { ...props };
  delete passDownProps.focused;
  delete passDownProps.previewOnly;
  delete passDownProps.customCSS;

  return (
    <div
      className={`grow-wrap ${props.className}`}
      data-replicated-value={props.value}
      style={props.style}
    >
      <textarea
        rows={1}
        {...passDownProps}
        onBlur={(e) => {
          setFocused(false);
          if (props.onBlur) props.onBlur(e);
        }}
        ref={textarea}
      />
      <style jsx>
        {`
          .grow-wrap {
            /* easy way to plop the elements on top of each other and have them both sized based on the tallest one's height */
            display: grid;
            position: relative;
            max-width: 100%;
            overflow-wrap: anywhere; /* limit width in chrome */
          }

          .grow-wrap::after {
            /* Note the weird space! Needed to preventy jumpy behavior */
            content: attr(data-replicated-value) " ";

            /* This is how textarea text behaves */
            white-space: pre-wrap;

            /* Hidden from view, clicks, and screen readers */
            visibility: hidden;
          }
          .grow-wrap > textarea {
            /* You could leave this, but after a user resizes, then it ruins the auto sizing */
            resize: none;

            /* Firefox shows scrollbar on growth, you can hide like this. */
            overflow: hidden;
          }
          .grow-wrap > textarea,
          .grow-wrap::after {
            padding: 0;
            width: 100%;
            font: inherit;
            border: none;
            ${props.customCSS || ""}
            /* Place on top of each other */
            grid-area: 1 / 1 / 2 / 2;
          }

          textarea:focus {
            outline: none;
          }
        `}
      </style>
    </div>
  );
});
Textarea.displayName = "Textarea";
export default Textarea;
