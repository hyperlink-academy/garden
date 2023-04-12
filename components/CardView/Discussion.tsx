import { ButtonPrimary, ButtonSecondary } from "components/Buttons";
import * as Popover from "@radix-ui/react-popover";
import { CardAdd, CloseLinedTiny, ReactionAdd, Send } from "components/Icons";
import { RenderedText } from "components/Textarea/RenderedText";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useEffect, useState } from "react";
import { ulid } from "src/ulid";
import { Message } from "data/Messages";
import AutosizeTextarea from "components/Textarea/AutosizeTextarea";
import { FindOrCreate, useAllItems } from "components/FindOrCreateEntity";
import { ref } from "data/Facts";
import { CardPreviewWithData } from "components/CardPreview";
import { AddReaction } from "./Reactions";
import { useReactions } from "hooks/useReactions";

export const Discussion = (props: {
  entityID: string;
  allowReact?: boolean;
}) => {
  let unreadBy = useIndex.eav(props.entityID, "discussion/unread-by");
  let { mutate, memberEntity } = useMutations();
  useEffect(() => {
    if (props.entityID && memberEntity) {
      let unread = unreadBy?.find((f) => f.value.value === memberEntity);
      if (unread)
        mutate("markRead", {
          memberEntity,
          entityID: props.entityID,
          attribute: "discussion/unread-by",
        });
    }
  }, [props.entityID, unreadBy, memberEntity, mutate]);

  let [reply, setReply] = useState<string | null>(null);

  return (
    <div>
      <Messages entityID={props.entityID} setReply={setReply} />
      <MessageInput
        allowReact={props.allowReact}
        entityID={props.entityID}
        reply={reply}
        setReply={setReply}
      />
    </div>
  );
};

export const MessageInput = (props: {
  allowReact?: boolean;
  entityID: string;
  reply: string | null;
  setReply: (reply: string | null) => void;
}) => {
  let [value, setValue] = useState("");
  let [attachedCards, setAttachedCards] = useState<string[]>([]);
  let [mode, setMode] = useState("normal" as "normal" | "focused" | "reacting");
  let { mutate, memberEntity, authorized } = useMutations();
  let replyMessage = useIndex.messageByID(props.reply);
  let reactions = useReactions(props.entityID);

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
    let roomScrollContainer = document.getElementById("roomScrollContainer");
    roomScrollContainer?.scrollTo(0, roomScrollContainer.scrollHeight);
  };
  return (
    <div className="sticky bottom-0 -mb-2 flex w-full flex-col gap-2 px-2 pb-2 pt-2">
      {props.reply && (
        <div className="flex justify-between gap-2 bg-white p-2">
          <div>{replyMessage?.content}</div>{" "}
          <button onClick={() => props.setReply(null)}>
            <CloseLinedTiny />
          </button>
        </div>
      )}
      <div className="flex w-full gap-2">
        {mode === "reacting" ? (
          <AddReaction
            entityID={props.entityID}
            close={() => setMode("normal")}
          />
        ) : (
          <div className="z-10 flex w-full gap-1 rounded-md border border-grey-80 bg-white p-1">
            <AutosizeTextarea
              onKeyDown={(e) => {
                if (
                  (e.key === "Enter" && e.ctrlKey) ||
                  (e.key === "Enter" && e.metaKey)
                ) {
                  send();
                }
              }}
              onFocus={() => setMode("focused")}
              onBlur={() => setMode("normal")}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder=""
              className="w-full "
              id="messageInput"
            />
            <AttachCard
              attachedCards={attachedCards}
              setAttachedCards={setAttachedCards}
            />
          </div>
        )}
        <div className="flex h-min justify-end text-grey-55">
          {!value &&
          mode !== "focused" &&
          reactions.length === 0 &&
          props.allowReact ? (
            <ButtonSecondary
              icon={<ReactionAdd />}
              onClick={() => setMode("reacting")}
            />
          ) : (
            <ButtonPrimary disabled={!value} onClick={send} icon={<Send />} />
          )}
        </div>
      </div>
    </div>
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
        <button onClick={() => setOpen(true)} className="flex ">
          {/* {props.expanded ? "Attach Card" : ""} */}
          <CardAdd />
        </button>
      ) : (
        <Popover.Root>
          <Popover.Trigger asChild>
            <button className="flex ">
              {attachedCards.length} <CardAdd />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="PopoverContent"
              sideOffset={24}
              side="top"
            >
              <div className="flex w-36 flex-col gap-2 rounded-md border bg-white shadow-sm">
                {attachedCards.map((card) => {
                  return (
                    <button
                      key={card}
                      onClick={() =>
                        setAttachedCards((a) => a.filter((c) => c !== card))
                      }
                    >
                      <AttachedCard entityID={card} />
                    </button>
                  );
                })}
                <button onClick={() => setOpen(true)} className="flex ">
                  <CardAdd />
                </button>
              </div>
              <Popover.Arrow className="PopoverArrow" />
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
  let name = useIndex.eav(props.entityID, "card/title");
  let memberName = useIndex.eav(props.entityID, "member/name");
  return <div>{memberName?.value || name?.value}</div>;
};

export const Messages = (props: {
  entityID: string;
  setReply: (reply: string) => void;
}) => {
  let messages = useIndex.messages(props.entityID);
  if (messages.length == 0) return null;
  return (
    <div
      className="flex flex-col gap-6 px-3 py-2"
      style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
    >
      {messages.map((m) => (
        <Message
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
    </div>
  );
};

const Message = (props: {
  content: string;
  author: string;
  date: string;
  id: string;
  reply?: string;
  entity?: string;
  setReply: (reply: string) => void;
}) => {
  let memberName = useIndex.eav(props.author, "member/name");
  let time = new Date(parseInt(props.date));
  let replyMessage = useIndex.messageByID(props.reply || null);
  let attachedCards = useIndex.eav(
    props.entity || null,
    "message/attached-card"
  );
  return (
    <div>
      <div className="flex justify-between gap-2 text-grey-55">
        <div className="flex gap-2">
          <small className="font-bold">{memberName?.value}</small>
          <small>
            {time.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </small>
        </div>
        <small>
          <button onClick={() => props.setReply(props.id)}>reply</button>
        </small>
      </div>

      {replyMessage && (
        <div className="my-2 rounded-md bg-bg-blue p-2">
          {replyMessage?.content}
        </div>
      )}
      <RenderedText
        text={props.content}
        tabIndex={0}
        style={{
          whiteSpace: "pre-wrap",
        }}
      />
      {attachedCards?.map((c) => (
        <CardPreviewWithData entityID={c.value.value} size="big" key={c.id} />
      ))}
    </div>
  );
};
