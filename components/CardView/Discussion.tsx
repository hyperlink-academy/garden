import { ButtonLink, ButtonPrimary } from "components/Buttons";
import {
  CloseFilledTiny,
  CloseLinedTiny,
  GoBackToPage,
  Send,
} from "components/Icons";
import { RenderedText } from "components/Textarea/RenderedText";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useEffect, useState } from "react";
import { ulid } from "src/ulid";
import { Message } from "data/Messages";

export const Discussion = (props: { entityID: string }) => {
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
        entityID={props.entityID}
        reply={reply}
        setReply={setReply}
      />
    </div>
  );
};

export const MessageInput = (props: {
  entityID: string;
  reply: string | null;
  setReply: (reply: string | null) => void;
}) => {
  let [focused, setFocused] = useState(false);
  let [value, setValue] = useState("");
  let { mutate, memberEntity, authorized } = useMutations();
  let replyMessage = useIndex.messageByID(props.reply);

  if (!authorized) return null;
  const send = async () => {
    if (!memberEntity) return;
    let message: Message = {
      id: ulid(),
      topic: props.entityID,
      ts: Date.now().toString(),
      sender: memberEntity,
      content: value || "",
    };
    if (props.reply) message.replyTo = props.reply;
    await mutate("replyToDiscussion", {
      discussion: props.entityID,
      message,
    });
    setValue("");
    props.setReply(null);
    let roomScrollContainer = document.getElementById("roomScrollContainer");
    roomScrollContainer?.scrollTo(0, roomScrollContainer.scrollHeight);
  };
  return (
    <div className="sticky bottom-0 -mb-2 flex flex-col gap-2 px-2 pb-2 pt-2">
      {props.reply && (
        <div className="flex justify-between gap-2 bg-white p-2">
          <div>{replyMessage?.content}</div>{" "}
          <button onClick={() => props.setReply(null)}>
            <CloseLinedTiny />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <textarea
          onKeyDown={(e) => {
            if (
              (e.key === "Enter" && e.ctrlKey) ||
              (e.key === "Enter" && e.metaKey)
            ) {
              send();
            }
          }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="add your response..."
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="h-10 w-full resize-none overflow-hidden border-grey-80"
          id="messageInput"
        ></textarea>
        {/* {!focused && !value ? null : ( */}
        <div className="flex items-center justify-end text-grey-55">
          <ButtonPrimary disabled={!value} onClick={send} icon={<Send />} />
        </div>
      </div>
      {/* )} */}
    </div>
  );
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
  setReply: (reply: string) => void;
}) => {
  let memberName = useIndex.eav(props.author, "member/name");
  let time = new Date(parseInt(props.date));
  let replyMessage = useIndex.messageByID(props.reply || null);
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
    </div>
  );
};
