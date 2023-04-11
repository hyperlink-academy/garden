import { ButtonPrimary } from "components/Buttons";
import { GoBackToPage, Send } from "components/Icons";
import { RenderedText } from "components/Textarea/RenderedText";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useEffect, useState } from "react";
import { ulid } from "src/ulid";

export const Discussion = (props: { close: () => void; entityID: string }) => {
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
  return (
    <div className="flex flex-col gap-4 ">
      <div className="flex flex-col gap-2">
        <button onClick={() => props.close()}>
          <div className="flex items-center gap-2 text-accent-blue">
            <GoBackToPage /> back
          </div>
        </button>

        <Thought entityID={props.entityID} />
      </div>
      <Messages entityID={props.entityID} />
      <MessageInput entityID={props.entityID} />
    </div>
  );
};

export const MessageInput = (props: { entityID: string }) => {
  let [focused, setFocused] = useState(false);
  let [value, setValue] = useState("");
  let { mutate, memberEntity, authorized } = useMutations();
  if (!authorized) return null;
  const send = async () => {
    if (!memberEntity) return;
    await mutate("replyToDiscussion", {
      discussion: props.entityID,
      message: {
        id: ulid(),
        topic: props.entityID,
        ts: Date.now().toString(),
        sender: memberEntity,
        content: value,
      },
    });
    setValue("");
    let roomScrollContainer = document.getElementById("roomScrollContainer");
    roomScrollContainer?.scrollTo(0, roomScrollContainer.scrollHeight);
  };
  return (
    <div className="sticky bottom-0 -mb-2 flex gap-2 px-2 pb-2 pt-2">
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
        id="thoughtInput"
      ></textarea>
      {/* {!focused && !value ? null : ( */}
      <div className="flex items-center justify-end text-grey-55">
        <ButtonPrimary disabled={!value} onClick={send} icon={<Send />} />
      </div>
      {/* )} */}
    </div>
  );
};

export const Messages = (props: { entityID: string }) => {
  let messages = useIndex.messages(props.entityID);
  return (
    <div
      className="flex flex-col gap-6 px-3 py-2"
      style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
    >
      {messages.map((m) => (
        <Reply author={m.sender} date={m.ts} content={m.content} key={m.id} />
      ))}
    </div>
  );
};

export const Thought = (props: { entityID: string }) => {
  let content = useIndex.eav(props.entityID, "discussion/content");
  let author = useIndex.eav(props.entityID, "discussion/author");
  let authorName = useIndex.eav(author?.value.value || null, "member/name");
  let createdAt = useIndex.eav(props.entityID, "discussion/created-at");

  let time = createdAt
    ? new Date(createdAt?.value.value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";
  return (
    <div
      className="flex flex-col gap-1 rounded-md border border-grey-80 bg-white py-2 px-3 text-left text-grey-35"
      style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
    >
      <div className="flex w-full items-baseline gap-2">
        <div className="font-bold">{authorName?.value}</div>
        <div className="text-sm">{time}</div>
      </div>
      {!content?.value ? null : (
        <RenderedText
          text={content?.value}
          tabIndex={0}
          style={{
            whiteSpace: "pre-wrap",
          }}
        />
      )}
    </div>
  );
};

const Reply = (props: { content: string; author: string; date: string }) => {
  let memberName = useIndex.eav(props.author, "member/name");
  let time = new Date(parseInt(props.date));
  return (
    <div>
      <div className="flex gap-2 text-grey-55">
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
