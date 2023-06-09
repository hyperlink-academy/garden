import { Backlinks } from "components/CardView/Backlinks";
import { SingleReactionPreview } from "components/CardView/Reactions";
import { SingleTextSection } from "components/CardView/Sections";
import { useCardViewer } from "components/CardViewerContext";
import { ChatEmptySmall, ChatSmall, CloseLinedTiny } from "components/Icons";
import { RenderedText } from "components/Textarea/RenderedText";
import { useReactions } from "hooks/useReactions";
import { useIndex, useMutations } from "hooks/useReplicache";
import { Props } from "./index";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const BigCardBody = (
  props: {
    entityID: string;
    unreadDiscussions: boolean;
    messagesCount: number;
  } & Props
) => {
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
      <div className="cardPreview flex w-full flex-col gap-2 hover:cursor-pointer">
        {/* Big Card Preview Title and GoTo Button*/}
        {/* show ONLY if we have title OR inner "x" to remove button */}
        {(!props.outerControls && props.onDelete && authorized) ||
        props.data.title?.value ||
        props.data.member ? (
          <div
            className={`cardPreviewHeader items-top flex justify-between gap-2`}
          >
            <div className="flex w-full justify-between gap-2">
              {(props.data.title?.value || props.data.member) && (
                <RenderedText
                  style={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                    width: "100%",
                  }}
                  text={
                    props.data.member?.value || props.data.title?.value || ""
                  }
                  placeholder="Untitled"
                  className={`cardPreviewTitle text-md !w-fit font-bold ${
                    props.data.isMember ? "text-white" : "text-grey-35"
                  } ${
                    !props.data.imageUrl ? "" : "rounded-[3px] !bg-white px-1"
                  }`}
                />
              )}
              {props.data.isMember ? (
                <div className="shrink-0 italic text-white">member</div>
              ) : (
                ""
              )}
            </div>

            {/* Card "X" to remove button */}
            {/* NB: this is for inner control in Collection only! */}
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
        ) : null}
        {props.showRelated && <Backlinks entityID={props.entityID} />}

        {/* Big Card Preview Default Content */}
        {!props.hideContent &&
          (props.data.content?.value || props.data.imageUrl) && (
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
          )}

        {/* Reactions + Discussions WRAPPER */}
        {/* NB: show ONLY for non-member cards for now */}
        {!props.data.isMember && (
          <div className="flex w-full justify-end gap-2">
            {/* Reactions */}
            {props.data.reactions.length > 0 ? (
              <div className="flex w-full flex-row items-end gap-1">
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
                  <span className="rounded-md border border-grey-90 bg-white py-0.5 px-1 text-xs text-grey-55">
                    {`+${props.data.reactions.length - 3}`}
                  </span>
                ) : (
                  ""
                )}
              </div>
            ) : null}

            {/* Discussions */}
            {/* three states: unread, existing, none */}
            {/* clicking = shortcut to focus input for a new message */}
            <button
              className={`unreadCount relative -right-[7px] -bottom-[0px] w-fit self-end rounded-md border ${
                props.unreadDiscussions
                  ? "unreadCardGlow bg-background text-accent-blue hover:bg-accent-blue hover:text-background"
                  : props.messagesCount && props.messagesCount > 0
                  ? "border-grey-80 bg-background text-grey-55 hover:border-accent-blue hover:bg-bg-blue hover:text-accent-blue"
                  : "border-grey-80 bg-white text-grey-55 hover:border-accent-blue hover:bg-bg-blue hover:text-accent-blue"
              } `}
              onClick={() => {
                props.entityID && open({ entityID: props.entityID });
                setTimeout(() => {
                  document.getElementById("messageInput")?.focus();
                }, 50);
              }}
            >
              {props.messagesCount && props.messagesCount > 0 ? (
                <ChatSmall />
              ) : (
                <ChatEmptySmall />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
