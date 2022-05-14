import React, { useEffect, useState } from "react";
import {
  scanIndex,
  useIndex,
  useMutations,
  useSpaceID,
} from "hooks/useReplicache";
import { ulid } from "src/ulid";
import Head from 'next/head'
import { useAuth } from "hooks/useAuth";
import Textarea from "components/AutosizeTextArea";
import {
  Card,
  Cross,
  DeckSmall,
  SectionLinkedCard,
  Send,
} from "components/Icons";
import { useRouter } from "next/router";
import Link from "next/link";
import { FindOrCreate } from "components/FindOrCreateEntity";
import { SmallCard } from "components/SmallCard";
import { ref } from "data/Facts";

export default function ChatPage() {
  let id = useSpaceID();
  let spaceName = useIndex.aev("this/name")[0];
  return (
    <div className="h-full flex flex-col relative items-stretch">
      <Head>
        <title key="title">{spaceName?.value}</title>
      </Head>
      <Messages />
      <MessageInput id={id || ""} />
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
                entity={m.entity}
                sender={m.sender}
                attachedCards={m.attachedCards}
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
  entity?: string;
  sender: string;
  ts: string;
  content: string;
  attachedCards?: string[];
  doubleSend: boolean;
}) => {
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
      {!props.entity ? null : <MessageData entity={props.entity} />}
    </div>
  );
};

const MessageData = (props: { entity: string }) => {
  let { studio, space } = useRouter().query;
  let attachedCards = useIndex.eav(props.entity, "message/attachedCard") || [];

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {attachedCards?.map((e) => {
        return (
          <SmallCard
            entityID={e.value.value}
            key={e.id}
            href={`/s/${studio}/s/${space}/c/${e}`}
          />
        );
      })}
    </div>
  );
};

const MessageInput = (props: { id: string }) => {
  let [message, setMessage] = useState("");
  let [attachedCards, setAttachedCards] = useState<string[]>([]);
  let { session } = useAuth();
  useEffect(() => {
    let storedMsg = localStorage.getItem(
      `chatinput-${props.id}-${session?.session?.studio}`
    );
    if (storedMsg) setMessage((m) => (m ? m : (storedMsg as string)));
  }, [props.id, session]);
  useEffect(() => {
    localStorage.setItem(
      `chatinput-${props.id}-${session?.session?.studio}`,
      message
    );
  }, [message]);
  let { authorized, mutate } = useMutations();
  let [inputFocused, setInputFocused] = useState(false);

  if (!authorized) {
    return (
      <div className="bg-grey-90 text-grey-55 italic border-t border-grey-80 -mx-5 px-5 pt-3 pb-4">
        Log In to send a message!
      </div>
    );
  }

  const submit = async () => {
    if (!authorized || !session.session || !message) return;
    let messageId = ulid();
    let entity: string | undefined;
    if (attachedCards.length > 0) {
      entity = ulid();
      await mutate("assertFact", {
        entity,
        attribute: "message/id",
        value: messageId,
        positions: {},
      });
      await mutate(
        "assertFact",
        attachedCards.map((c) => {
          return {
            entity: entity as string,
            attribute: "message/attachedCard",
            value: ref(c),
            positions: {},
          };
        })
      );
    }
    mutate("postMessage", {
      id: ulid(),
      entity,
      content: message,
      sender: session.session.username,
      ts: Date.now().toString(),
    });
    setMessage("");
    setAttachedCards([]);
  };
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
        <FindOrCreateCard
          selected={attachedCards}
          onSelect={(e) => setAttachedCards((a) => [...a, e])}
        />
        <button
          className="text-accent-blue"
          onClick={(e) => {
            e.preventDefault;
            if (!authorized || !session.session || !message) return;
            submit();
          }}
        >
          <div className="flex gap-2 font-bold">
            <Send />
          </div>
        </button>
      </div>
      <div>
        {attachedCards.map((e) => {
          return (
            <AttachedCard
              entityID={e}
              key={e}
              remove={() => setAttachedCards((a) => a.filter((c) => c !== e))}
            />
          );
        })}
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
            submit();
          }
        }}
        onChange={(e) => setMessage(e.currentTarget.value)}
      />
    </div>
  );
};

const AttachedCard = (props: { entityID: string; remove: () => void }) => {
  let title = useIndex.eav(props.entityID, "card/title");
  return (
    <div>
      {title?.value}{" "}
      <button onClick={() => props.remove()}>
        <Cross />
      </button>
    </div>
  );
};

const FindOrCreateCard = (props: {
  onSelect: (e: string) => void;
  selected: string[];
}) => {
  let [open, setOpen] = useState(false);
  let { mutate } = useMutations();
  let decks = useIndex.aev("deck");
  let titles = useIndex.aev("card/title");
  let items = titles.map((t) => {
    return {
      entity: t.entity,
      display: t.value,
      icon: !!decks.find((d) => t.entity === d.entity) ? (
        <DeckSmall />
      ) : (
        <Card />
      ),
    };
  });

  return (
    <>
      <button className="border-l text-grey-80" onClick={() => setOpen(true)}>
        <SectionLinkedCard className="hover:text-accent-blue text-grey-35" />
      </button>
      <FindOrCreate
        allowBlank={false}
        onClose={() => setOpen(false)}
        open={open}
        items={items}
        selected={props.selected}
        onSelect={async (e) => {
          let entity;
          if (e.type === "create") {
            entity = ulid();
            await mutate("createCard", {
              entityID: entity,
              title: e.name,
            });
          } else {
            entity = e.entity;
          }

          props.onSelect(entity);
        }}
      />
    </>
  );
};
