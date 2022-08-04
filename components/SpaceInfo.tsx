import { Disclosure, Tab } from "@headlessui/react";
import { spaceAPI } from "backend/lib/api";
import { Fact } from "data/Facts";
import { useAuth } from "hooks/useAuth";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { ulid } from "src/ulid";
import useSWR from "swr";
import { ButtonLink, ButtonPrimary } from "./Buttons";
import { Drawer } from "./DeckList";
import { Member, BotIcon, BotAdd } from "./Icons";
import { Divider } from "./Layout";
import { SmallCard } from "./SmallCard";
import { useSmoker } from "./Smoke";
import { Textarea } from "./Textarea";

export const SpaceInfo = () => {
  let spaceName = useIndex.aev("this/name")[0];
  let bots = useIndex.aev("bot/url");
  let members = useIndex.aev("space/member");
  let [memberToggle, setMemberToggle] = useState<boolean | undefined>(
    undefined
  );
  let [botToggle, setBotToggle] = useState<boolean | undefined>(undefined);

  return (
    <>
      <Head>
        <title key="title">{spaceName?.value}</title>
      </Head>
      <div className="spaceInfo grid auto-rows-max gap-3 pb-4 pt-6">
        <div className="spaceNameDescription">
          <h1>{spaceName?.value}</h1>
          <Description entity={spaceName?.entity} />
        </div>
        <Tab.Group>
          <Tab.List className={`flex gap-2`}>
            <Tab>
              <div
                className="membersList grid grid-cols-[max-content_max-content] gap-2 items-center font-bold w-max"
                onClick={() => {
                  setBotToggle(false);
                  setMemberToggle(!memberToggle);
                  console.log("Bot:" + botToggle + "| Member:" + memberToggle);
                }}
              >
                <Member />
                <p>Members ({members.length})</p>
              </div>
            </Tab>
            <Tab>
              <div
                className="membersList grid grid-cols-[max-content_max-content] gap-2 items-center font-bold"
                onClick={() => {
                  setMemberToggle(false);
                  setBotToggle(!botToggle);
                  console.log("Bot:" + botToggle + " | Member:" + memberToggle);
                }}
              >
                <BotIcon />
                <p>Bots ({bots.length})</p>
              </div>
            </Tab>
          </Tab.List>
          <Disclosure>
            <Drawer
              open={
                botToggle === false && memberToggle === false ? false : true
              }
              bump={memberToggle === true ? 0 : 142}
            >
              <Tab.Panels>
                <Tab.Panel>
                  <Members />
                </Tab.Panel>
                <Tab.Panel>
                  <Bots botList={bots} />
                </Tab.Panel>
              </Tab.Panels>
            </Drawer>
          </Disclosure>
        </Tab.Group>
        <Divider dark />
      </div>
    </>
  );
};

const Description = (props: { entity: string }) => {
  let description = useIndex.eav(props.entity, "this/description");
  return <p className="spaceDescription text-grey-35 ">{description?.value}</p>;
};

const Bots = (props: { botList: Fact<"bot/url">[] }) => {
  let { mutate, authorized } = useMutations();

  return (
    <div>
      <style jsx>{`
        @media (max-width: 360px) {
          .membersCardList {
            place-content: space-between;
            gap: 1rem 0rem;
          }
        }
      `}</style>

      <div className="flex flex-col gap-4">
        <div className="membersCardList flex flex-wrap gap-4">
          {props.botList.map((b) => (
            <Bot entity={b.entity} />
          ))}
        </div>
        {!authorized ? null : (
          <ButtonLink
            icon={<BotAdd />}
            content="Add Bot!"
            onClick={() => {
              mutate("assertFact", {
                entity: ulid(),
                value: "http://example.com",
                attribute: "bot/url",
                positions: {},
              });
            }}
          />
        )}
      </div>
    </div>
  );
};

const Bot = (props: { entity: string }) => {
  let name = useIndex.eav(props.entity, "bot/name");
  let url = useIndex.eav(props.entity, "bot/url");
  let { mutate, authorized } = useMutations();
  return (
    <div className="flex flex-row w-full gap-2">
      <Textarea
        placeholder="name"
        value={name?.value}
        className="border-2 p-1 w-full"
        onChange={async (e) => {
          if (!authorized) return;
          await mutate("assertFact", {
            entity: props.entity,
            attribute: "bot/name",
            value: e.currentTarget.value,
            positions: {},
          });
        }}
      />
      <Textarea
        placeholder="url"
        className="border-2 p-1 w-full"
        value={url?.value}
        onChange={async (e) => {
          if (!authorized) return;
          await mutate("assertFact", {
            entity: props.entity,
            attribute: "bot/url",
            value: e.currentTarget.value,
            positions: {},
          });
        }}
      />
    </div>
  );
};

const Members = () => {
  let members = useIndex.aev("space/member");
  let { studio, space } = useRouter().query;

  let [toggle, setToggle] = useState<boolean | undefined>(undefined);

  return (
    <div>
      <style jsx>{`
        @media (max-width: 360px) {
          .membersCardList {
            place-content: space-between;
            gap: 1rem 0rem;
          }
        }
      `}</style>

      <div className="flex flex-col gap-4">
        <div className="membersCardList flex flex-wrap gap-4">
          {members.map((m) => (
            <SmallCard
              key={m.entity}
              entityID={m.entity}
              href={`/s/${studio}/s/${space}/c/${m.entity}`}
            />
          ))}
        </div>
        <Join />
      </div>
    </div>
  );
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const Join = () => {
  let { session } = useAuth();
  let router = useRouter();
  let isMember = useIndex.ave("space/member", session.session?.studio);
  let smoker = useSmoker();
  const spaceID = useSpaceID();
  let { data: inviteLink } = useSWR(
    !isMember ? null : `${WORKER_URL}/space/${spaceID}/get_share_code`,
    async () => {
      if (!spaceID || !session.token) return;
      let code = await spaceAPI(
        `${WORKER_URL}/space/${spaceID}`,
        "get_share_code",
        {
          token: session.token,
        }
      );
      if (code.success) {
        return `${document.location.href}/join?code=${code.code}`;
      }
    }
  );

  const getShareLink = async (e: React.MouseEvent) => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    smoker({ position: { x: e.clientX, y: e.clientY }, text: "copied!" });
  };

  if (isMember && inviteLink) {
    return (
      <div className="self-start flex flex-col gap-2 lightBorder w-full p-4 place-items-center">
        <p className="font-bold">
          Copy and share this invite link to add new members!
        </p>
        <div className="flex flex-row gap-2 w-full">
          <input
            readOnly
            value={inviteLink}
            className="bg-grey-90 text-grey-55 w-full"
          />
          <ButtonPrimary onClick={getShareLink} content="Copy!" />
        </div>
      </div>
    );
  }
  return (
    <div className="text-grey-55 italic">
      <p className="pb-1">
        Members can make edits to the space and send chat messages.{" "}
      </p>
      <p> You need an invite to become one!</p>
    </div>
  );
};
