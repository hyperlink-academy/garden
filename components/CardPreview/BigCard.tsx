import { Backlinks } from "components/CardView/Backlinks";
import { SingleReactionPreview } from "components/CardView/Reactions";
import { SingleTextSection } from "components/CardView/Sections";
import { useCardViewer } from "components/CardViewerContext";
import { CloseLinedTiny } from "components/Icons";
import { RenderedText } from "components/Textarea/RenderedText";
import { useReactions } from "hooks/useReactions";
import { useIndex, useMutations } from "hooks/useReplicache";
import { Props } from "./index";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const BigCardBody = (props: { entityID: string } & Props) => {
  let { authorized } = useMutations();
  let { open } = useCardViewer();

  let listenersAndAttributes = authorized
    ? {
        ...props?.dragHandleProps?.attributes,
        ...props?.dragHandleProps?.listeners,
      }
    : {};

  return (
    <div
      {...listenersAndAttributes}
      className={`CardPreviewContent flex h-full grow  flex-row overflow-hidden !bg-cover !bg-center !bg-no-repeat pl-2 text-sm ${
        props.data.isMember ? "py-2 pr-2" : "py-2 pr-3"
      }`}
      style={{
        wordBreak: "break-word",
        background:
          props.hideContent && props.data.imageUrl
            ? `url(${props.data.imageUrl})`
            : "",
      }} //no tailwind equiv - need for long titles to wrap
      onClick={() => {
        let cardView = document.getElementById("cardViewerWrapper");
        open({ entityID: props.entityID });
        cardView ? cardView.scrollIntoView({ behavior: "smooth" }) : null;
      }}
    >
      {/* Big Card Preview Content Wrapper */}
      <div className="cardPreview flex w-full flex-col hover:cursor-pointer">
        {/* Big Card Preview Title and GoTo Button*/}
        <div
          className={`cardPreviewHeader items-top flex justify-between gap-2`}
        >
          <RenderedText
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              width: "100%",
            }}
            text={props.data.member?.value || props.data.title?.value || ""}
            placeholderOnHover={true}
            placeholder="Untitled"
            className={`cardPreviewTitle text-md !w-fit font-bold ${
              props.data.isMember ? "text-white" : "text-grey-35"
            } ${!props.data.imageUrl ? "" : "rounded-[3px] !bg-white px-1"}`}
          />
          {props.data.isMember ? (
            <div className="shrink-0 text-white ">member</div>
          ) : (
            ""
          )}
          {!props.outerControls && props.onDelete && authorized ? (
            <button
              className="h-fit pt-1 text-grey-80 hover:text-grey-15"
              onClick={(e) => {
                e.stopPropagation();
                props.onDelete?.();
              }}
            >
              <CloseLinedTiny width={12} height={12} />
            </button>
          ) : null}
        </div>
        {props.showRelated && <Backlinks entityID={props.entityID} />}

        {/* Big Card Preview Default Content */}
        <div
          className={` cardPreviewDefaultContent ${
            props.data.isMember &&
            !props.hideContent &&
            props.data.content?.value
              ? "mt-1 rounded-md bg-white p-2 pt-1 text-accent-red"
              : ""
          }`}
        >
          {!props.data.imageUrl || props.hideContent ? null : (
            <img
              src={`${props.data.imageUrl}`}
              className="max-h-[600px] max-w-full  py-2 px-1"
            />
          )}
          {!props.hideContent && props.data.content?.value && (
            <RenderedText
              className={`cardPreviewDefaultTextContent truncate whitespace-pre-wrap pt-1 leading-tight  ${
                !props.data.imageUrl ? "" : "rounded-[3px] bg-white/75 px-1"
              } `}
              text={(props.data.content?.value as string) || ""}
            />
          )}
        </div>
        {/* Reactions */}
        {props.data.reactions.length > 0 ? (
          <div className="flex w-full flex-row items-center gap-1 pt-2">
            {props.data.reactions.slice(0, 3).map(([reaction, data]) => {
              return (
                <SingleReactionPreview
                  key={reaction}
                  {...data}
                  reaction={reaction}
                  entityID={props.entityID}
                />
              );
            })}
            {props.data.reactions.length > 3 ? (
              <span className="rounded-md border border-grey-80 bg-white py-0.5 px-2 text-sm">
                <em>{`+${props.data.reactions.length - 3}…`}</em>
              </span>
            ) : (
              ""
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
