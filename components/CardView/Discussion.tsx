import { ButtonPrimary } from "components/Buttons";
import { CardAddLined, CloseLinedTiny, Reply, Send } from "components/Icons";
import { RenderedText } from "components/Textarea/RenderedText";
import { ReplicacheContext, db, useMutations } from "hooks/useReplicache";
import { HTMLAttributes, useContext, useEffect, useRef, useState } from "react";
import { ulid } from "src/ulid";
import type { Message } from "data/Messages";
import AutosizeTextarea from "components/Textarea/AutosizeTextarea";
import { FindOrCreate, useAllItems } from "components/FindOrCreateEntity";
import { ref } from "data/Facts";
import { CardPreviewWithData } from "components/CardPreview";
import { LoginOrSignupModal } from "components/LoginModal";
import { RoomHeader } from "components/Room";
import { useRoom, useUIState } from "hooks/useUIState";
import { useFilteredCards } from "../CardFilter";
import { useAuth } from "hooks/useAuth";
import { useGesture } from "@use-gesture/react";
import { theme } from "tailwind.config";
import { elementID } from "src/utils";
let { colors } = theme;

export const DiscussionRoom = (props: {
  entityID: string;
  allowReact?: boolean;
  isRoom: boolean;
}) => {
  useMarkRead(props.entityID, true);
  let room = useRoom();
  let { reactions, filters, setFilters, cardsFiltered, total } =
    useFilteredCards(room, "desktop/contains");

  let { permissions } = useMutations();

  let authorized = permissions.commentAndReact;

  return (
    // trying this w/ ~same wrapper as other rooms
    <div
      className="no-scrollbar mx-2 mb-2  mt-0 flex h-full  w-[302px] flex-col items-stretch overflow-x-hidden overflow-y-scroll text-sm sm:m-4 sm:mt-0 "
      id="room-wrapper"
    >
      <div className="discussionRoomHeaderWrapper -mb-3">
        <RoomHeader
          totalCount={total}
          filteredCount={cardsFiltered.length}
          entityID={room}
          reactions={reactions}
          filters={filters}
          setFilters={setFilters}
        />
      </div>
      <MessageWindow
        entityID={props.entityID}
        className={`discussionWindow no-scrollbar relative flex h-full flex-col overflow-x-hidden overflow-y-scroll ${
          authorized ? "pb-[64px]" : "pb-[88px]"
        }`}
      >
        <Messages entityID={props.entityID} isRoom={props.isRoom} />
      </MessageWindow>
      <div className="discussionInputWrapper absolute bottom-0 right-0 w-full ">
        <MessageInput
          entityID={props.entityID}
          allowReact={props.allowReact}
          isRoom={props.isRoom}
        />
      </div>
    </div>
  );
};

function InputBuffer(props: { entityID: string }) {
  return (
    <div
      className={`dummyMessageInput pointer-events-none opacity-0 -mt-8 whitespace-pre-wrap`}
    >
      <MessageInput
        entityID={props.entityID}
        allowReact={false}
        isRoom={false}
      />
    </div>
  );
}

export const useMarkRead = (entityID: string, focused: boolean) => {
  let rep = useContext(ReplicacheContext);
  let unreadBy = db.useEntity(entityID, "discussion/unread-by");
  let [windowFocus, setWindowFocus] = useState(true);
  let { mutate, memberEntity } = useMutations();
  let { session } = useAuth();
  useEffect(() => {
    let callback = () => setWindowFocus(true);
    window.addEventListener("focus", callback);
    return () => {
      window.removeEventListener("focus", callback);
    };
  }, []);
  useEffect(() => {
    if (entityID && memberEntity && session.user) {
      if (!windowFocus || !focused) return;
      if (!rep || !rep.data.space_id) return;
      let unread = unreadBy?.find((f) => f.value.value === memberEntity);
      if (unread)
        mutate("markRead", {
          memberEntity,
          space_id: rep.data.space_id,
          userID: session.user.id,
          entityID: entityID,
          attribute: "discussion/unread-by",
        });
    }
  }, [
    rep,
    entityID,
    unreadBy,
    memberEntity,
    mutate,
    windowFocus,
    focused,
    session.user,
  ]);
};

export const MessageWindow = (props: {
  entityID: string;
  style?: HTMLAttributes<HTMLDivElement>["style"];
  onDragTop?: () => void;
  children: React.ReactNode;
  className: string;
}) => {
  let isBottomed = useRef(true);
  let elRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (isBottomed.current) {
      requestAnimationFrame(() => {
        if (!elRef.current) return;
        elRef.current.scrollTop = elRef.current?.scrollHeight;
      });
    }
  });
  let bind = useGesture({
    onDrag: (data) => {
      if (
        (data.currentTarget as HTMLElement)?.scrollTop === 0 &&
        data.direction[1] > 0 &&
        data.distance[1] > 8 &&
        data.distance[0] < 8
      ) {
        props.onDragTop?.();
      }
    },
  });
  return (
    <div
      {...bind()}
      style={props.style}
      onScroll={(e) => {
        if (!e.isTrusted) return;
        isBottomed.current =
          e.currentTarget.scrollTop + e.currentTarget.clientHeight ===
          e.currentTarget.scrollHeight;
      }}
      ref={elRef}
      className={props.className}
      id={elementID.discussion(props.entityID).container}
    >
      {props.children}
      <InputBuffer entityID={props.entityID} />
    </div>
  );
};

export const MessageInput = (props: {
  entityID: string;
  allowReact?: boolean;
  isRoom: boolean;
  onSend?: () => void;
}) => {
  let setChatInput = useUIState((s) => s.setChatInput);
  let chatState = useUIState((s) => s.chatInputStates[props.entityID]);
  let value = chatState?.value || "";
  let attachedCards = chatState?.attachedCards || [];
  let reply = chatState?.reply || null;
  let { mutate, permissions } = useMutations();
  let { session } = useAuth();

  let authorized = permissions.commentAndReact;

  let replyMessage = db.useMessageByID(reply);
  let replyToName = db.useEntity(replyMessage?.sender || null, "member/name");
  let cardBackgroundColor =
    db.useEntity(props.entityID, "card/background-color")?.value || "#FFFFFF";
  const send = async () => {
    if (!session.session || !value) return;
    let message: Omit<Message, "sender"> = {
      id: ulid(),
      topic: props.entityID,
      ts: Date.now().toString(),
      replyTo: reply,
      content: value || "",
    };
    if (attachedCards.length > 0) {
      let entity = ulid();
      message.entity = entity;
      await mutate(
        "assertFact",
        attachedCards.map((c) => ({
          entity,
          attribute: "message/attached-card",
          value: ref(c),
          positions: {},
        }))
      );
    }
    await mutate("replyToDiscussion", {
      session: session.session,
      discussion: props.entityID,
      message,
    });
    setChatInput(props.entityID, {
      value: "",
      attachedCards: [],
      reply: null,
    });
    if (props.onSend) {
      props.onSend();
    }
    setTimeout(() => {
      let el = document.getElementById(
        elementID.discussion(props.entityID).container
      );
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    }, 50);
  };
  return (
    <>
      {!session?.loggedIn ? (
        <Login />
      ) : !authorized ? (
        <div className="messageNonAuth flex justify-center rounded-md bg-grey-90 p-2 text-center text-sm italic text-grey-55">
          Only members and studiomates can chat!
        </div>
      ) : (
        <div
          style={{
            backgroundColor: props.isRoom
              ? colors.background
              : cardBackgroundColor,
          }}
          className={`flex items-end gap-1 ${
            props.isRoom ? "rounded-lg px-2 pb-3 pt-1 sm:px-4" : ""
          } `}
        >
          <div className="shrink-0 pb-1">
            <AttachCard
              attachedCards={attachedCards}
              setAttachedCards={(cards) =>
                setChatInput(props.entityID, { attachedCards: cards })
              }
            />
          </div>
          <div className={`messageInput flex w-full flex-col gap-2`}>
            {/* IF MESSAGE IS IN REPLY */}
            {reply && (
              <div className="messageInputReply -mb-2">
                <div className="flex items-start justify-between gap-2 rounded-lg border border-grey-80  px-2 py-[5px] text-xs italic text-grey-55">
                  <div className="flex flex-col gap-[1px]">
                    <div className="font-bold"> {replyToName?.value}</div>
                    <div className="text-grey-55">{replyMessage?.content}</div>
                  </div>
                  <button
                    className=""
                    onClick={() =>
                      setChatInput(props.entityID, { reply: null })
                    }
                  >
                    <CloseLinedTiny />
                  </button>
                </div>
                <div className="ml-auto mr-2 h-2 w-0 border border-grey-80" />
              </div>
            )}
            {attachedCards.length > 0 && (
              <div className="flex flex-col gap-1 ">
                {attachedCards?.map((card) => {
                  return (
                    <div key={card} className="w-full">
                      <CardPreviewWithData
                        parent={props.entityID}
                        entityID={card}
                        size="big"
                        hideContent={true}
                        key={card}
                        onDelete={() =>
                          setChatInput(props.entityID, {
                            attachedCards: attachedCards.filter(
                              (c) => c !== card
                            ),
                          })
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
            {/* ACTUAL MESSAGE INPUT */}

            <div className="flex w-full flex-col items-end gap-1">
              <div className="flex w-full items-center gap-2 rounded-lg border border-grey-55 bg-white py-1 pl-2 pr-1 text-base text-grey-15">
                <AutosizeTextarea
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.currentTarget.blur();
                    }
                    if (!e.shiftKey && e.key === "Enter") {
                      e.preventDefault();
                      send();
                    }
                  }}
                  value={value}
                  onChange={(e) =>
                    setChatInput(props.entityID, { value: e.target.value })
                  }
                  placeholder=""
                  className="w-full grow text-sm"
                  id={elementID.discussion(props.entityID).input}
                />

                <ButtonPrimary
                  className="shrink-0 self-end !px-0 !py-0"
                  disabled={!value}
                  onPointerDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    send();
                  }}
                  icon={<Send />}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Login = () => {
  let [state, setState] = LoginOrSignupModal.useState("closed");
  return (
    <>
      <div className="messageLogIn mx-0 flex justify-center rounded-md bg-grey-90 p-2 group-[.spaceRoomWrapper]:mx-4">
        <p className=" w-full text-center text-sm italic text-grey-55">
          <span
            role="button"
            className="font-bold text-accent-blue"
            onClick={() => {
              setState("login");
            }}
          >
            Log In
          </span>{" "}
          to join the discussion!
        </p>
      </div>
      <LoginOrSignupModal state={state} setState={setState} />
    </>
  );
};

const AttachCard = ({
  attachedCards,
  setAttachedCards,
}: {
  attachedCards: string[];
  setAttachedCards: (cards: string[]) => void;
}) => {
  let [open, setOpen] = useState(false);
  let items = useAllItems(open);
  let { mutate, memberEntity, action, permissions } = useMutations();
  let authorized = permissions.commentAndReact;

  if (!authorized) return null;
  return (
    <>
      {/* decide styling of button via children */}
      <button
        onClick={() => setOpen(true)}
        className="flex text-grey-55 hover:text-accent-blue"
      >
        <CardAddLined />
      </button>

      <FindOrCreate
        allowBlank={true}
        onClose={() => setOpen(false)}
        //START OF ON SELECT LOGIC
        onSelect={async (cards) => {
          if (!memberEntity) return;
          // if youre adding to a backlink section, then the entity is a string
          // if youre creating a new deck

          action.start();

          let newAttachedCards = [...attachedCards];
          for (let d of cards) {
            let entity: string;
            if (d.type === "existing") entity = d.entity;
            else {
              entity = ulid();
              await mutate("createCard", {
                entityID: entity,
                title: d.name,
                memberEntity,
              });
            }
            newAttachedCards.push(entity);
          }
          setAttachedCards(newAttachedCards);

          action.end();
        }}
        // END OF ONSELECT LOGIC
        selected={attachedCards}
        open={open}
        items={items}
      />
    </>
  );
};

export const Messages = (props: { entityID: string; isRoom: boolean }) => {
  let messages = db.useMessages(props.entityID);
  let { permissions } = useMutations();
  let authorized = permissions.commentAndReact;
  let setChatInput = useUIState((s) => s.setChatInput);
  if (props.isRoom === false && messages.length == 0) return null;

  return (
    <>
      {messages.length == 0 && authorized ? (
        <div className="messagesEmpty mt-auto flex flex-col gap-2 py-1  text-sm italic text-grey-55 ">
          <p>Welcome to the chat room!</p>
          <p>Start a conversation 🌱</p>
        </div>
      ) : null}
      {[...messages].map((m, index, reversedMessages) => (
        <Message
          discussion={props.entityID}
          multipleFromSameAuthor={
            index > 0 &&
            m.sender === reversedMessages[index - 1]?.sender &&
            parseInt(m.ts) - parseInt(reversedMessages[index - 1]?.ts) <
              1000 * 60 * 3
          }
          author={m.sender}
          date={m.ts}
          content={m.content}
          key={m.id}
          id={m.id}
          entity={m.entity}
          reply={m.replyTo}
          setReply={(r) => setChatInput(props.entityID, { reply: r })}
        />
      ))}
    </>
  );
};

const Message = (props: {
  discussion: string;
  multipleFromSameAuthor: boolean;
  content: string;
  author: string;
  date: string;
  id: string;
  reply?: string | null;
  entity?: string;
  setReply: (reply: string) => void;
}) => {
  let { permissions } = useMutations();
  let authorized = permissions.commentAndReact;

  let { session } = useAuth();

  let memberName = db.useEntity(props.author, "member/name");
  let memberColor = db.useEntity(props.author, "member/color");

  let isMe = session.session?.username == memberName?.value;
  let time = new Date(parseInt(props.date));
  let replyMessage = db.useMessageByID(props.reply || null);
  let replyToName = db.useEntity(replyMessage?.sender || null, "member/name");
  let attachedCards = db.useEntity(
    props.entity || null,
    "message/attached-card"
  );
  return (
    <div
      className={`group  flex items-end gap-1 first:mt-auto ${
        !props.multipleFromSameAuthor ? "pt-4" : "pt-1"
      } ${isMe && "flex-row-reverse"}`}
    >
      <div
        id={props.id}
        className={`message mt-2 flex grow flex-col  gap-1 text-sm  first:mt-auto ${
          isMe && "place-items-end"
        }`}
      >
        {/* MESSAGE HEADER */}
        {!props.multipleFromSameAuthor && (
          <div
            className={`messageHeader flex w-full gap-2 text-grey-55 ${
              isMe && "flex-row-reverse"
            } `}
            style={{ color: memberColor?.value }}
          >
            <div
              className={`messageInfo flex gap-2 ${isMe && "flex-row-reverse"}`}
            >
              <span className="messageAuthor text-sm font-bold italic">
                {isMe ? null : memberName?.value}
              </span>
              <span className="messageTimeStamp self-center text-xs">
                {time.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        )}
        {replyMessage && (
          <div className={`-mb-1 w-fit ${isMe ? "ml-6" : "mr-6"}`}>
            <div
              className="mt-0.5 flex flex-col overflow-hidden rounded-lg border border-grey-80 px-2 py-1 text-xs"
              style={{
                wordBreak: "break-word", //no tailwind equiv - need for long titles to wrap
                display: "-webkit-box",
                WebkitLineClamp: 6,
                WebkitBoxOrient: "vertical",
              }}
            >
              <div className={`font-bold italic text-grey-55`}>
                {replyToName?.value}
              </div>
              <div className=" italic text-grey-55">
                {replyMessage?.content}
              </div>
            </div>
            <div
              className={` mt-0 h-2 w-0 border border-grey-80 ${
                isMe ? "ml-auto mr-2" : "ml-2"
              } `}
            />
          </div>
        )}
        <div className={`flex items-end gap-2 ${isMe && "flex-row-reverse"}`}>
          <div
            className={`messageContent  rounded-lg border border-grey-80 px-2 py-[5px] text-white  ${
              attachedCards ? "w-full " : "w-fit"
            } ${!isMe && "group-hover:!bg-bg-blue"}`}
            style={{
              backgroundColor: isMe ? memberColor?.value : "#FDFCFA",
            }}
          >
            {/* if comment is in reply, show reply content  */}

            {attachedCards && (
              <div className="mb-1 mt-[3px] flex w-full flex-col gap-1">
                {attachedCards?.map((c) => (
                  <div key={c.id} className="w-full">
                    <CardPreviewWithData
                      parent={props.discussion}
                      entityID={c.value.value}
                      size="big"
                      hideContent={true}
                      key={c.id}
                    />
                  </div>
                ))}
              </div>
            )}
            <div>
              <div className="flex items-end gap-1 ">
                <RenderedText
                  className={`messageTextContent text-sm ${
                    isMe ? "text-white" : "text-grey-35"
                  }`}
                  text={props.content}
                  tabIndex={0}
                  style={{
                    whiteSpace: "pre-wrap",
                  }}
                  messageIsMe={isMe}
                />
              </div>
            </div>
          </div>
          {authorized ? (
            <span className="messageReplyButton mb-[1px] h-4 w-4 shrink-0 text-xs">
              <button
                className={`hidden text-grey-55 hover:text-accent-blue group-hover:block ${
                  isMe && "-scale-x-100"
                }`}
                onClick={() => {
                  props.setReply(props.id);
                  document
                    .getElementById(
                      elementID.discussion(props.discussion).input
                    )
                    ?.focus();
                }}
              >
                <Reply />
              </button>
            </span>
          ) : (
            <div className="h-4 w-4 " />
          )}
        </div>
      </div>
    </div>
  );
};
