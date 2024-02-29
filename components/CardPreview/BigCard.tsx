import { Backlinks } from "components/CardView/Backlinks";
import { SingleReactionPreview } from "components/CardView/Reactions";
import { SingleTextSection } from "components/CardView/Sections";
import { useCardViewer } from "components/CardViewerContext";
import {
  ChatEmptyTiny,
  CloseLinedTiny,
  Edit,
  RoomChat,
} from "components/Icons";
import { Divider } from "components/Layout";
import { db, useMutations } from "hooks/useReplicache";
import { useUIState } from "hooks/useUIState";
import { Props } from "./index";
import { focusElement } from "src/utils";
import { LinkPreviewCondensed } from "components/LinkPreview";

export const BigCardBody = (
  props: {
    entityID: string;
    unreadDiscussions: boolean;
    messagesCount: number;
    focusText?: string;
  } & Props
) => {
  let { authorized } = useMutations();
  let { open } = useCardViewer();
  let editing = useUIState((s) => s.focusedCard === props.entityID);
  let setFocusedCard = useUIState((s) => s.setFocusedCard);
  let linkPreview = db.useEntity(props.entityID, "card/link-preview");
  let cardBackgroundColor =
    db.useEntity(props.entityID, "card/background-color")?.value || "#FFFFFF";
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
      className={`CardPreview flex h-full grow flex-row !bg-cover !bg-center !bg-no-repeat pl-2 text-sm ${
        props.data.isMember ? "py-2 pr-2" : "pb-1 pr-2 pt-2"
      }`}
      style={{
        wordBreak: "break-word",
        background:
          props.hideContent &&
          props.data.imageUrl &&
          !props.data.isMember &&
          !linkPreview
            ? `url(${props.data.imageUrl})`
            : cardBackgroundColor,
      }} //no tailwind equiv - need for long titles to wrap
    >
      {/* Big Card Preview Content Wrapper */}
      <div
        className={`cardPreviewContent flex w-full flex-col gap-2 ${
          editing ? "" : "hover:cursor-pointer"
        }`}
      >
        {/* TODO: remove this, seems to be unused??? */}
        {/* {props.showRelated && <Backlinks entityID={props.entityID} />} */}

        {/* Link Preview  */}
        {linkPreview && (
          <div
            className={`-mx-[9px] -mt-[9px] ${
              props.hideContent &&
              (linkPreview.value.url === props.data.title?.value ||
                !props.data.title)
                ? "-mb-1"
                : ""
            }`}
          >
            <LinkPreviewCondensed entityID={props.entityID} />
          </div>
        )}

        {/* Big Card Preview Title*/}
        {/* show AFTER link preview if we have one, and only if expanded */}
        {/* show title and remove button
           if (you're in list view)
        or if (theres a title)
        or if (its a member card)
        or if (you're in edit mode) */}
        {!(
          linkPreview &&
          (linkPreview.value.url === props.data.title?.value ||
            !props.data.title)
        ) && (
          <div className="cardPreviewTitle flex w-full justify-between gap-2">
            <SingleTextSection
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "inherit",
                width: "100%",
                backgroundColor:
                  props.data.imageUrl &&
                  props.hideContent &&
                  !props.data.isMember
                    ? cardBackgroundColor
                    : "transparent",
              }}
              entityID={props.entityID}
              section={props.data.member ? "member/name" : "card/title"}
              placeholder="Untitled"
              previewOnly={!editing || !!props.data.member}
              className={`cardPreviewTitle text-md font-bold ${
                props.data.isMember ? "w-fit text-white" : "text-grey-35"
              } ${
                props.data.imageUrl && props.hideContent && !props.data.isMember
                  ? "rounded-[3px] px-1"
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
            {props.data.isMember ? (
              <div className="shrink-0 italic text-white">member</div>
            ) : (
              ""
            )}
          </div>
        )}

        {/* Big Card Preview Default Content*/}
        {/* (show if you're in preview mode OR there is content/image OR you're in edit mode) */}
        {!props.hideContent &&
          (editing || !!props.data.content?.value || !!props.data.imageUrl) && (
            <div
              className={`cardPreviewDefaultContent flex flex-col gap-2 ${
                props.data.isMember &&
                !props.hideContent &&
                props.data.content?.value
                  ? "text-accent-red rounded-md bg-white pt-2"
                  : ""
              }`}
            >
              {!props.hideContent && (
                <SingleTextSection
                  autocompleteCardNames
                  focusText={props.focusText}
                  placeholder={editing ? "write something…" : ""}
                  entityID={props.entityID}
                  previewOnly={!editing}
                  className={`cardPreviewDefaultTextContent truncate whitespace-pre-wrap leading-tight ${
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
              {props.data.imageUrl && !props.hideContent && (
                <img
                  alt=""
                  src={`${props.data.imageUrl}`}
                  className="max-h-[600px] max-w-full rounded-md"
                />
              )}
            </div>
          )}

        {/* Reactions + Discussions WRAPPER */}
        {/* NB: show ONLY for non-member cards for now */}
        {!props.data.isMember && (
          <div className="cardPreviewActionsWrapper flex w-full items-center justify-between gap-2">
            <div className="cardPreviewActions flex  gap-2">
              {/* Discussions */}
              {/* three states: unread, existing, none */}
              {/* clicking = shortcut to focus input for a new message */}
              <button
                style={{
                  backgroundColor: cardBackgroundColor,
                }}
                className={`cardPreviewComments relative rounded-md border ${
                  props.unreadDiscussions
                    ? "unreadCardGlow text-accent-blue hover:bg-accent-blue hover:text-background"
                    : "text-grey-55 hover:border-accent-blue hover:bg-bg-blue hover:text-accent-blue border-transparent"
                } `}
                onClick={() => {
                  if (!props.entityID) return;
                  open({ entityID: props.entityID });
                  useUIState.getState().openDrawer(props.entityID, "chat");
                  setTimeout(() => {
                    document.getElementById("messageInput")?.focus();
                  }, 50);
                }}
              >
                <div className="cardPreviewCommentIcon flex shrink-0 items-center gap-1 py-0.5 pl-0.5 pr-1 text-xs">
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
                  <Divider vertical my={2} />
                  <div className="cardPreviewReactions flex flex-row items-center gap-1">
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
                      <span className="text-grey-55 px-1 py-0.5 text-xs">
                        {`+${props.data.reactions.length - 3}`}
                      </span>
                    ) : (
                      ""
                    )}
                  </div>
                </>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              {/* edit toggle on cardPreview  */}
              {props.editable && authorized && (
                <button
                  className={`jusitfy-self-end flex shrink-0 items-center gap-2 text-xs italic   ${
                    editing ? "text-accent-blue" : "text-grey-55"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (editing) setFocusedCard(undefined);
                    else {
                      setFocusedCard(props.entityID);
                      requestAnimationFrame(() => {
                        focusElement(() => {
                          return document.getElementById(
                            `${props.entityID}-preview-title`
                          );
                        });
                      });
                    }
                  }}
                >
                  {!editing ? (
                    <div className="hidden group-hover:block">edit</div>
                  ) : (
                    <div>done</div>
                  )}
                  <Edit editing={editing} width={20} height={20} />
                </button>
              )}
              {/* Card "X" to remove button */}
              {/* NB: this is for inner control in Collection only! */}
              {!props.outerControls && props.onDelete && authorized ? (
                <>
                  <button
                    style={{
                      backgroundColor: cardBackgroundColor,
                    }}
                    className="cardPreviewRemove text-grey-80 hover:text-accent-blue h-fit rounded-md p-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onDelete?.();
                    }}
                  >
                    <CloseLinedTiny width={14} height={14} />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
