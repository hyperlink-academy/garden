import { ButtonPrimary } from "components/Buttons";
import * as Popover from "@radix-ui/react-popover";
import {
  ArrowDown,
  CardAdd,
  CardSmall,
  CloseLinedTiny,
  GoToBottom,
  Member,
  Reply,
  Send,
} from "components/Icons";
import { RenderedText } from "components/Textarea/RenderedText";
import { db, useMutations } from "hooks/useReplicache";
import { useEffect, useRef, useState } from "react";
import { ulid } from "src/ulid";
import { Message } from "data/Messages";
import AutosizeTextarea from "components/Textarea/AutosizeTextarea";
import { FindOrCreate, useAllItems } from "components/FindOrCreateEntity";
import { ref } from "data/Facts";
import { CardPreviewWithData } from "components/CardPreview";
import { useIntersectionObserver } from "hooks/useIntersectionObserver";

export const DiscussionRoom = (props: {
  entityID: string;
  allowReact?: boolean;
  isRoom: boolean;
}) => {
  let unreadBy = db.useEntity(props.entityID, "discussion/unread-by");
  let [focus, setFocus] = useState(true);
  let { mutate, memberEntity } = useMutations();
  useEffect(() => {
    let callback = () => setFocus(true);
    window.addEventListener("focus", callback);
    return () => {
      window.removeEventListener("focus", callback);
    };
  }, []);
  useEffect(() => {
    if (props.entityID && memberEntity) {
      if (!focus) return;
      let unread = unreadBy?.find((f) => f.value.value === memberEntity);
      if (unread)
        mutate("markRead", {
          memberEntity,
          entityID: props.entityID,
          attribute: "discussion/unread-by",
        });
    }
  }, [props.entityID, unreadBy, memberEntity, mutate, focus]);

  let [reply, setReply] = useState<string | null>(null);

  return (
    <div className="relative h-full">
      <div
        className="no-scrollbar relative flex h-full flex-col-reverse overflow-x-hidden overflow-y-scroll p-2 pb-12"
        id="card-comments"
      >
        <Messages
          entityID={props.entityID}
          setReply={setReply}
          isRoom={props.isRoom}
        />
      </div>
      <div className="absolute bottom-0 w-full">
        <MessageInput
          entityID={props.entityID}
          allowReact={props.allowReact}
          isRoom={props.isRoom}
          reply={reply}
          setReply={setReply}
        />
      </div>
    </div>
  );
};

export const MessageInput = (props: {
  entityID: string;
  allowReact?: boolean;
  isRoom: boolean;
  reply: string | null;
  setReply: (reply: string | null) => void;
}) => {
  let [unread, setUnread] = useState<boolean | null>(null);
  let [value, setValue] = useState("");
  let [attachedCards, setAttachedCards] = useState<string[]>([]);
  let { mutate, memberEntity, authorized } = useMutations();
  let replyMessage = db.useMessageByID(props.reply);
  let replyToName = db.useEntity(replyMessage?.sender || null, "member/name");

  if (!authorized) return null;
  const send = async () => {
    if (!memberEntity || !value) return;
    let message: Message = {
      id: ulid(),
      topic: props.entityID,
      ts: Date.now().toString(),
      sender: memberEntity,
      content: value || "",
    };
    if (props.reply) message.replyTo = props.reply;
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
      discussion: props.entityID,
      message,
    });
    setValue("");
    setAttachedCards([]);
    props.setReply(null);
    let ScrollContainer = null;
    if (props.isRoom)
      ScrollContainer = document.getElementById("roomScrollContainer");
    else ScrollContainer = document.getElementById("cardContentAndDiscussion");
    if (ScrollContainer)
      ScrollContainer?.scrollTo(0, ScrollContainer.scrollHeight);
    setTimeout(
      () =>
        document
          .getElementById("card-comments")
          ?.scrollIntoView({ behavior: "smooth", block: "end" }),
      50
    );
  };
  return (
    <>
      <div className="messageInput flex w-full flex-col gap-2 px-2 pt-1 pb-2">
        {unread && (
          <button
            className="messageInput sticky bottom-0 mx-auto flex  w-fit flex-row items-center justify-between gap-2 rounded-full bg-accent-blue py-1.5 px-4 text-sm font-bold italic text-white"
            onClick={() => {
              document
                .getElementById("card-comments")
                ?.scrollIntoView({ behavior: "smooth", block: "end" });
            }}
          >
            <div>unread messages</div>
            <GoToBottom />
          </button>
        )}
        {/* IF MESSAGE IS IN REPLY */}
        {props.reply && (
          <div className="messageInputReply -mb-2">
            <div className="flex items-start justify-between gap-2 rounded-md border border-grey-80 bg-white p-2 text-xs italic text-grey-55">
              <div className="flex flex-col gap-[1px]">
                <div className="font-bold"> {replyToName?.value}</div>
                <div>{replyMessage?.content}</div>
              </div>
              <button className="" onClick={() => props.setReply(null)}>
                <CloseLinedTiny />
              </button>
            </div>
            <div className="ml-2 h-2 w-0 border border-grey-80" />
          </div>
        )}
        {/* ACTUAL MESSAGE INPUT */}
        <div className="flex w-full items-end gap-2">
          <div className="flex w-full items-center gap-1 rounded-md border border-grey-55 bg-white p-1 text-sm text-grey-15">
            <AutosizeTextarea
              onKeyDown={(e) => {
                if (!e.shiftKey && e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder=""
              className="w-full"
              id="messageInput"
            />
            <div className="place-self-end">
              <AttachCard
                attachedCards={attachedCards}
                setAttachedCards={setAttachedCards}
              />
            </div>
          </div>

          <div className="flex h-min justify-end text-grey-55">
            <ButtonPrimary disabled={!value} onClick={send} icon={<Send />} />
          </div>
        </div>
      </div>
    </>
  );
};

const AttachCard = ({
  attachedCards,
  setAttachedCards,
}: {
  attachedCards: string[];
  setAttachedCards: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  let [open, setOpen] = useState(false);
  let items = useAllItems(open);
  let { authorized, mutate, memberEntity, action } = useMutations();
  if (!authorized) return null;
  return (
    <>
      {/* decide styling of button via children */}
      {attachedCards.length === 0 ? (
        <button onClick={() => setOpen(true)} className="flex text-grey-55">
          {/* {props.expanded ? "Attach Card" : ""} */}
          <CardAdd />
        </button>
      ) : (
        <Popover.Root>
          <Popover.Trigger asChild>
            <button className="flex items-center gap-[1px] text-sm text-grey-55">
              {attachedCards.length} <CardAdd />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="PopoverContent"
              sideOffset={12}
              collisionPadding={{ left: 24, right: 24 }}
              side="top"
              align="end"
              alignOffset={-6}
            >
              <div className="flex w-72 flex-col gap-0 rounded-md border border-grey-80 bg-white py-1 shadow-sm">
                {attachedCards.map((card) => {
                  return (
                    <div
                      className="flex w-full items-start justify-between gap-2 py-1 px-2 text-sm hover:bg-bg-blue"
                      key={card}
                    >
                      <AttachedCard entityID={card} />
                      <button
                        className="pt-1 text-grey-55 hover:text-accent-blue"
                        onClick={() =>
                          setAttachedCards((a) => a.filter((c) => c !== card))
                        }
                      >
                        <CloseLinedTiny />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => setOpen(true)}
                  className="flex gap-2 py-1 px-2 text-sm text-grey-55 hover:text-accent-blue"
                >
                  <CardAdd />
                  attach another card
                </button>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
      <FindOrCreate
        allowBlank={true}
        onClose={() => setOpen(false)}
        //START OF ON SELECT LOGIC
        onSelect={async (cards) => {
          if (!memberEntity) return;
          // if youre adding to a backlink section, then the entity is a string
          // if youre creating a new deck

          action.start();

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
            setAttachedCards((a) => [...a, entity]);
          }

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

const AttachedCard = (props: { entityID: string }) => {
  let name = db.useEntity(props.entityID, "card/title");
  let memberName = db.useEntity(props.entityID, "member/name");
  return (
    <div className="flex w-full items-start gap-2">
      <div className="shrink-0 text-grey-35">
        {memberName ? <Member /> : <CardSmall />}
      </div>
      <div className="grow pt-[2px]">
        {memberName?.value || name?.value || (
          <span className="italic text-grey-55">untitled</span>
        )}
      </div>
    </div>
  );
};

export const Messages = (props: {
  entityID: string;
  setReply: (reply: string) => void;
  isRoom: boolean;
}) => {
  let messages = db.useMessages(props.entityID);
  let { authorized } = useMutations();
  if (props.isRoom === false && messages.length == 0) return null;

  return (
    <>
      {messages.length == 0 && authorized ? (
        <div className="messagesEmpty flex flex-col gap-4 text-sm italic text-grey-35">
          <p>Welcome to the chat!</p>
          <p>Still quiet…start the conversation 🌱</p>
        </div>
      ) : null}
      {[...messages].reverse().map((m, index, reversedMessages) => (
        <Message
          multipleFromSameAuthor={
            index < reversedMessages.length &&
            m.sender === reversedMessages[index + 1]?.sender &&
            parseInt(m.ts) - parseInt(reversedMessages[index + 1]?.ts) <
              1000 * 60 * 3
          }
          author={m.sender}
          date={m.ts}
          content={m.content}
          key={m.id}
          id={m.id}
          entity={m.entity}
          reply={m.replyTo}
          setReply={props.setReply}
        />
      ))}
    </>
  );
};

const NewMessageAnchor = (props: {
  entityID: string;
  setUnreads: (setter: (unread: boolean | null) => boolean | null) => void;
}) => {
  let messages = db.useMessages(props.entityID);
  let [ref, intersectingState, intersectingRef] =
    useIntersectionObserver<HTMLDivElement>();
  useEffect(() => {
    if (intersectingState) props.setUnreads(() => false);
  }, [intersectingState]);

  useEffect(() => {
    if (intersectingRef.current || intersectingRef.current === null)
      setTimeout(() => {
        requestAnimationFrame(() => {
          ref.current?.scrollIntoView({ block: "end" });
        });
      }, 100);
    else
      setTimeout(() => {
        if (intersectingRef.current) return;
        props.setUnreads((unread) => (unread === null ? unread : true));
      }, 1000);
  }, [messages]);
  return (
    <>
      <div ref={ref} />
    </>
  );
};

const Message = (props: {
  multipleFromSameAuthor: boolean;
  content: string;
  author: string;
  date: string;
  id: string;
  reply?: string;
  entity?: string;
  setReply: (reply: string) => void;
}) => {
  let { authorized } = useMutations();

  let memberName = db.useEntity(props.author, "member/name");
  let time = new Date(parseInt(props.date));
  let replyMessage = db.useMessageByID(props.reply || null);
  let replyToName = db.useEntity(replyMessage?.sender || null, "member/name");
  let attachedCards = db.useEntity(
    props.entity || null,
    "message/attached-card"
  );
  return (
    <div
      id={props.id}
      className={`message flex flex-col text-sm first:pt-0 last:pb-2 ${
        !props.multipleFromSameAuthor ? "pt-5" : "pt-1"
      }`}
    >
      {/* MESSAGE HEADER */}
      {!props.multipleFromSameAuthor && (
        <div className="flex justify-between gap-2 text-grey-55">
          <div className="messageInfo flex gap-2">
            <span className="messageAuthor text-sm font-bold italic">
              {memberName?.value}
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

      {/* IF THE MESSAGE IS IN REPLY TO SOMEONE */}
      {replyMessage && (
        <>
          <div className="mt-1 flex flex-col gap-[1px] rounded-md border border-grey-80 p-2 text-xs">
            <div className="font-bold italic text-grey-55">
              {replyToName?.value}
            </div>
            <div className="italic text-grey-55">{replyMessage?.content}</div>
          </div>
          <div className="ml-2 h-2 w-0 border border-grey-80" />
        </>
      )}
      <div className="group -mx-4 flex items-end gap-1 py-1 px-4 hover:bg-bg-blue">
        <RenderedText
          className="messageContent grow text-sm text-grey-35"
          text={props.content}
          tabIndex={0}
          style={{
            whiteSpace: "pre-wrap",
          }}
        />
        {authorized ? (
          <span className="messageReplyButton mb-[1px] h-4 w-4 shrink-0 text-xs">
            <button
              className="hidden text-grey-55 hover:text-accent-blue group-hover:block"
              onClick={() => {
                props.setReply(props.id);
                document.getElementById("messageInput")?.focus();
              }}
            >
              <Reply />
            </button>
          </span>
        ) : null}
      </div>
      {attachedCards && (
        <div className="mt-2 flex flex-col gap-1">
          {attachedCards?.map((c) => (
            <CardPreviewWithData
              entityID={c.value.value}
              size="big"
              hideContent={true}
              key={c.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
