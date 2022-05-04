import React, { useEffect, useState } from "react";
import {
  scanIndex,
  useIndex,
  useMutations,
  useSpaceID,
} from "hooks/useReplicache";
import { ulid } from "src/ulid";
import { useAuth } from "hooks/useAuth";
import Textarea from "components/AutosizeTextArea";
import { SectionLinkedCard, Send } from "components/Icons";
import { useRouter } from "next/router";
import Link from "next/link";

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col relative items-stretch">
      <Messages />
      <MessageInput />
    </div>
  );
}

const Messages = () => {
  let messages = useIndex.messages();
  let { rep } = useAuth();
  let id = useSpaceID();
  let lastMessage = messages[messages.length - 1];

  useEffect(() => {
    rep?.query(async (tx) => {
      if (!id || !lastMessage?.index) return;
      let q = scanIndex(tx);

      let space = await q.ave("space/id", id);
      if (!space) return;

      let latest = await q.eav(space.entity, "space/lastSeenMessage");
      if (latest && latest.value > lastMessage.index) return;

      rep?.mutate.updateLastSeenMessage({
        space: id,
        lastSeenMessage: lastMessage.index,
      });
    });
  }, [messages]);

  return (
    <React.Fragment>
      <style jsx>
        {`
          .Message:hover .MessageInfo {
            display: block;
          }
        `}
      </style>
      <div className=" h-full overflow-y-auto overflow-x-hidden pb-6 flex flex-col-reverse ">
        <div className=" flex flex-col">
          {messages.map((m, index) => {
            return (
              <Message
                key={m.id}
                sender={m.sender}
                ts={m.ts}
                content={m.content}
                doubleSend={
                  messages[index - 1]?.sender === m.sender &&
                  parseInt(m.ts) - parseInt(messages[index - 1].ts) < 300000
                }
              />
            );
          })}
        </div>
      </div>
    </React.Fragment>
  );
};

const Message = (props: {
  sender: string;
  ts: string;
  content: string;
  doubleSend: boolean;
}) => {
  let messages = useIndex.messages();
  let lastMessage = messages[messages.length - 1];
  let member = useIndex.ave("member/name", props.sender);
  let q = useRouter().query;
  return (
    <div
      className={`Message flex flex-col ${props.doubleSend ? "pt-1" : "pt-4"}`}
    >
      <div className="grid grid-cols-[auto_max-content]">
        {props.doubleSend ? null : (
          <Link href={`/s/${q.studio}/s/${q.space}/c/${member?.entity}`}>
            <a>
              <div className={`MessageSender font-bold `}>{props.sender}</div>
            </a>
          </Link>
        )}
        <div className="MessageInfo hidden italic text-grey-80">
          {new Date(parseInt(props.ts)).toLocaleDateString()}
        </div>
      </div>
      <pre className="MessageContent whitespace-pre-wrap font-[Quattro] text-grey-35">
        {props.content}
      </pre>
    </div>
  );
};

const MessageInput = () => {
  let [message, setMessage] = useState("");
  let { session } = useAuth();
  let { authorized, mutate } = useMutations();
  let [inputFocused, setInputFocused] = useState(false);

  if (!authorized) {
    return (
      <div className="bg-grey-90 text-grey-55 italic border-t border-grey-80 -mx-5 px-5 pt-3 pb-4">
        Log In to send a message!
      </div>
    );
  } else {
    return (
      <div className="-mx-5 px-5 pt-3 pb-4 border-t border-grey-80 flex flex-col gap-2">
        <div
          onMouseDown={(e) => e.preventDefault()}
          className={`w-full bg-bg-blue lightBorder ${
            inputFocused
              ? "flex flex-row justify-end rounded-md p-2 gap-4"
              : "hidden"
          } `}
        >
          <SectionLinkedCard className="hover:text-accent-blue text-grey-35" />
          <div className="border-l text-grey-80"></div>
          <button
            className="text-accent-blue"
            onClick={(e) => {
              e.preventDefault;
              if (!authorized || !session.session || !message) return;
              mutate("postMessage", {
                id: ulid(),
                content: message,
                sender: session.session.username,
                ts: Date.now().toString(),
              });
              setMessage("");
            }}
          >
            <div className="flex gap-2 font-bold">
              <Send />
            </div>
          </button>
        </div>
        <Textarea
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          className="bg-background"
          placeholder="write a message"
          value={message}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (e.shiftKey) {
                return;
              }
              e.preventDefault();
              if (!authorized || !session.session || !message) return;
              mutate("postMessage", {
                id: ulid(),
                content: message,
                sender: session.session.username,
                ts: Date.now().toString(),
              });
              setMessage("");
            }
          }}
          onChange={(e) => setMessage(e.currentTarget.value)}
        />
      </div>
    );
  }
};
