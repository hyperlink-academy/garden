import { Backlinks } from "components/CardView/Backlinks";
import { SingleReactionPreview } from "components/CardView/Reactions";
import { SingleTextSection } from "components/CardView/Sections";
import { useCardViewer } from "components/CardViewerContext";
import {
  ChatEmptySmall,
  ChatSmall,
  CloseLinedTiny,
  Edit,
} from "components/Icons";
import { useMutations } from "hooks/useReplicache";
import { useUIState } from "hooks/useUIState";
import { useEffect, useState } from "react";
import { Props } from "./index";

export const BigCardBody = (
  props: {
    entityID: string;
    unreadDiscussions: boolean;
    messagesCount: number;
  } & Props
) => {
  let { authorized } = useMutations();
  let { open } = useCardViewer();
  let editing = useUIState((s) => s.focusedCard === props.entityID);
  let setFocusedCard = useUIState((s) => s.setFocusedCard);
  const setEditting = () =>
    editing ? setFocusedCard(undefined) : setFocusedCard(props.entityID);
  useEffect(() => {
    if (editing)
      return () => {
        useUIState.setState((s) => {
          if (s.focusedCard === props.entityID)
            return { ...s, focusedCard: undefined };
          return s;
        });
      };
  }, [editing]);

  let listenersAndAttributes =
    authorized && !editing
      ? {
          ...props?.dragHandleProps?.attributes,
          ...props?.dragHandleProps?.listeners,
        }
      : {};

  return (
    <div
      {...listenersAndAttributes}
      className={`CardPreviewContent flex h-full grow flex-row overflow-hidden !bg-cover !bg-center !bg-no-repeat pl-2 text-sm ${
        props.data.isMember ? "py-2 pr-2" : "py-2 pr-2"
      }`}
      style={{
        wordBreak: "break-word",
        background:
          props.hideContent && props.data.imageUrl && !props.data.isMember
            ? `url(${props.data.imageUrl})`
            : "",
      }} //no tailwind equiv - need for long titles to wrap
      onClick={(e) => {
        if (editing) return;
        if (e.defaultPrevented) return;
        let cardView = document.getElementById("cardViewerWrapper");
        open({ entityID: props.entityID });
        cardView ? cardView.scrollIntoView({ behavior: "smooth" }) : null;
      }}
    >
      {/* Big Card Preview Content Wrapper */}
      <div
        className={`cardPreview flex w-full flex-col gap-2 ${
          editing ? "" : "hover:cursor-pointer"
        }`}
      >
        {/* Big Card Preview Title and GoTo Button*/}
        {/* show ONLY if we have title OR inner "x" to remove button */}
        {(!props.outerControls && props.onDelete && authorized) ||
        props.data.title?.value ||
        props.data.member ||
        editing ? (
          <div
            className={`cardPreviewHeader items-top flex justify-between gap-2`}
          >
            <div className="flex w-full justify-between gap-2">
              {(props.data.title?.value || props.data.member || editing) && (
                <SingleTextSection
                  style={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                    width: "100%",
                  }}
                  entityID={props.entityID}
                  section={props.data.member ? "member/name" : "card/title"}
                  placeholder="Untitled"
                  previewOnly={!editing || !!props.data.member}
                  className={`cardPreviewTitle text-md bg-accent-blue font-bold ${
                    props.data.isMember ? "w-fit text-white" : "text-grey-35"
                  } ${
                    props.data.imageUrl &&
                    props.hideContent &&
                    !props.data.isMember
                      ? "rounded-[3px] !bg-white px-1"
                      : ""
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
              <>
                <button
                  className={`self-start ${
                    editing ? "text-grey-15" : "text-white"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setEditting();
                  }}
                >
                  <Edit />
                </button>
                <button
                  className="h-fit pt-1 text-grey-80 hover:text-grey-15"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onDelete?.();
                  }}
                >
                  <CloseLinedTiny width={12} height={12} />
                </button>
              </>
            ) : null}
          </div>
        ) : null}
        {props.showRelated && <Backlinks entityID={props.entityID} />}

        {/* Big Card Preview Default Content */}
        {!props.hideContent && (
          <div
            className={`cardPreviewDefaultContent flex flex-col gap-2 ${
              props.data.isMember &&
              !props.hideContent &&
              props.data.content?.value
                ? "mt-1 rounded-md bg-white text-accent-red"
                : ""
            }`}
          >
            {!props.data.imageUrl || props.hideContent ? null : (
              <img
                src={`${props.data.imageUrl}`}
                className="max-h-[600px] max-w-full rounded-md"
              />
            )}
            {!props.hideContent && (
              <SingleTextSection
                placeholder=" "
                entityID={props.entityID}
                previewOnly={!editing}
                className={`cardPreviewDefaultTextContent truncate whitespace-pre-wrap bg-accent-blue leading-tight ${
                  !props.data.imageUrl ? "" : ""
                } ${props.data.isMember ? "px-2 pb-2" : ""} `}
                section={"card/content"}
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
                  document
                    .getElementById("card-comments")
                    ?.scrollIntoView({ behavior: "smooth", block: "end" });
                }, 100);
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
