import { Backlinks } from "components/CardView/Backlinks";
import { SingleReactionPreview } from "components/CardView/Reactions";
import { SingleTextSection } from "components/CardView/Sections";
import { useCardViewer } from "components/CardViewerContext";
import {
  ChatEmptySmall,
  ChatEmptyTiny,
  ChatSmall,
  CloseLinedTiny,
  Edit,
  RoomChat,
} from "components/Icons";
import { Divider } from "components/Layout";
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
      className={`CardPreviewContent flex h-full grow flex-row !bg-cover !bg-center !bg-no-repeat pl-2 text-sm ${
        props.data.isMember ? "py-2 pr-2" : "py-2 pr-2"
      } `}
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
        className={`cardPreview flex w-full flex-col  ${
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
            className={`cardPreviewHeader items-top flex justify-between gap-2 pb-1`}
          >
            <div className="cardPreviewTitle flex w-full justify-between gap-2">
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      let element = document.getElementById(
                        `${props.entityID}-preview-default-text-section`
                      );
                      element?.focus();
                    }
                  }}
                  id={props.editable ? `${props.entityID}-preview-title` : ""}
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
        {!props.hideContent &&
          (editing || !!props.data.content?.value || !!props.data.imageUrl) && (
            <div
              className={`cardPreviewDefaultContent flex flex-col gap-2 pb-2 ${
                props.data.isMember &&
                !props.hideContent &&
                props.data.content?.value
                  ? "rounded-md bg-white pt-2 text-accent-red"
                  : ""
              }`}
            >
              {!props.hideContent && (
                <SingleTextSection
                  placeholder={editing ? "write something..." : ""}
                  entityID={props.entityID}
                  previewOnly={!editing}
                  className={`cardPreviewDefaultTextContent truncate whitespace-pre-wrap bg-accent-blue leading-tight ${
                    !props.data.imageUrl ? "" : ""
                  } ${props.data.isMember ? "px-2 " : ""} `}
                  section={"card/content"}
                  id={
                    props.editable
                      ? `${props.entityID}-preview-default-text-section`
                      : ""
                  }
                />
              )}

              {!props.data.imageUrl || props.hideContent ? null : (
                <img
                  src={`${props.data.imageUrl}`}
                  className="max-h-[600px] max-w-full rounded-md"
                />
              )}
            </div>
          )}

        {/* Reactions + Discussions WRAPPER */}
        {/* NB: show ONLY for non-member cards for now */}
        {!props.data.isMember && (
          <div className="cardPreviewActions flex w-full justify-between gap-2 pt-1">
            <div className="cardPreviewReactionAndDiscussion flex gap-2">
              {/* Discussions */}
              {/* three states: unread, existing, none */}
              {/* clicking = shortcut to focus input for a new message */}
              <button
                className={`cardPreivewComments relative rounded-md border ${
                  props.unreadDiscussions
                    ? "unreadCardGlow bg-background text-accent-blue hover:bg-accent-blue hover:text-background"
                    : "border-transparent bg-white text-grey-55 hover:border-accent-blue hover:bg-bg-blue hover:text-accent-blue"
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
                <div className="flex shrink-0 items-center gap-1 py-0.5 pl-0.5 pr-1 text-xs">
                  {props.messagesCount && props.messagesCount > 0 ? (
                    <>
                      <RoomChat /> {props.messagesCount}
                    </>
                  ) : (
                    <>
                      <ChatEmptyTiny /> 0
                    </>
                  )}
                </div>
              </button>

              {/* Reactions */}
              {props.data.reactions.length > 0 ? (
                <>
                  <div className="h-full w-0">
                    <Divider vertical />
                  </div>
                  <div className="cardPreviewReactions flex flex-row items-end gap-1">
                    {props.data.reactions
                      .slice(0, 3)
                      .map(([reaction, data]) => {
                        return (
                          <SingleReactionPreview
                            key={reaction}
                            memberReaction={data.memberReaction}
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
                </>
              ) : null}
            </div>

            {/* edit toggle on cardPreview  */}
            {props.editable && (
              <button
                className={`shink-0 jusitfy-self-end flex items-center gap-2 text-xs italic   ${
                  editing ? "text-accent-blue" : "text-grey-55"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  if (editing) setFocusedCard(undefined);
                  else {
                    setFocusedCard(props.entityID);
                    requestAnimationFrame(() => {
                      let element = document.getElementById(
                        `${props.entityID}-preview-default-text-section`
                      );
                      console.log(element);

                      element?.focus();
                      requestAnimationFrame(() => {
                        let element = document.getElementById(
                          `${props.entityID}-preview-default-text-section`
                        ) as HTMLTextAreaElement;
                        console.log(element);
                        element?.setSelectionRange(
                          element?.value?.length || 0,
                          element?.value?.length || 0
                        );
                      });
                    });
                  }
                }}
              >
                {!editing ? (
                  <div className="hidden group-hover:block">read mode</div>
                ) : (
                  <div>edit mode</div>
                )}
                <Edit editing={editing} width={20} height={20} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
