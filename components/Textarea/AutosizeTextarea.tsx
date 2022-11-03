import { forwardRef, useImperativeHandle, useRef } from "react";

type Props = React.DetailedHTMLProps<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>;
const AutosizeTextarea = forwardRef<HTMLTextAreaElement, Props>(
  (props: Props, ref) => {
    let textarea = useRef<HTMLTextAreaElement | null>(null);
    useImperativeHandle(ref, () => textarea.current as HTMLTextAreaElement);

    return (
      <div
        className={`grow-wrap ${props.className}`}
        data-replicated-value={props.value}
        style={props.style}
      >
        <textarea rows={1} {...props} ref={textarea} />
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
  }
);
AutosizeTextarea.displayName = "Textarea";
export default AutosizeTextarea;
