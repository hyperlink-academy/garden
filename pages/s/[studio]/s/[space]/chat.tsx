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
import { cornersOfRectangle } from "@dnd-kit/core/dist/utilities/algorithms/helpers";

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
    console.log(messages);
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
      <div className=" h-full overflow-auto pb-6 flex flex-col-reverse ">
        <div className=" flex flex-col gap-4">
          {messages.map((m) => {
            return (
              <div className="Message flex flex-col" key={m.id}>
                <div className="grid grid-cols-[auto_max-content]">
                  <div className={`MessageSender font-bold`}>{m.sender}</div>
                  <div className="MessageInfo hidden italic text-grey-80">
                    4/12/22
                  </div>
                </div>
                <pre className="MessageContent whitespace-pre-wrap font-[Quattro] text-grey-35">
                  {m.content}
                </pre>
              </div>
            );
          })}
        </div>
      </div>
    </React.Fragment>
  );
};

const MessageInput = () => {
  let [message, setMessage] = useState("");
  let { session } = useAuth();
  let { authorized, mutate } = useMutations();

  return (
    <div className="-mx-5 border-t border-grey-80">
      <Textarea
        className="bg-background px-5 pt-3 pb-4"
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
};
