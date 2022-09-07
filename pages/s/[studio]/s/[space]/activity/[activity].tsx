import { CardContainer, Carousel } from "components/CardCarousel";
import { CardView } from "components/CardView";
import { Divider } from "components/Layout";
import { AddToSection, SmallCardList } from "components/SmallCardList";
import { ref } from "data/Facts";
import { useInActivity } from "hooks/useInActivity";
import { useIndex, useMutations } from "hooks/useReplicache";
import { spacePath } from "hooks/utils";
import Head from "next/head";
import Link from "next/link";
import router, { useRouter } from "next/router";
import { useEffect } from "react";
import { MessageInput, Messages } from "../chat";

export default function ActivityPage() {
  let { query } = useRouter();
  return (
    <>
      <ActivityTitle entity={query.activity as string} />
      <Activity entity={query.activity as string} />
    </>
  );
}

export const Activity = (props: { entity: string }) => {
  let name = useIndex.eav(props.entity, "activity/name");
  let { mutate, authorized, memberEntity } = useMutations();
  let { query } = useRouter();

  let inActivity = useInActivity();
  let cards = useIndex.eav(props.entity, "activity/hand-contains");
  useEffect(() => {
    if (!memberEntity) return;
    if (authorized && inActivity?.value.value !== props.entity) {
      mutate("assertFact", {
        entity: memberEntity,
        attribute: "member/in-activity",
        value: ref(props.entity),
        positions: {},
      });
    }
  }, [props.entity, !!inActivity, authorized]);
  return (
    <div className="h-full flex flex-col gap-4 pb-6">
      <div className=" max-w-3xl m-auto w-full pt-4  grid grid-cols-[auto_max-content] gap-4 grow-0">
        <h2>{name?.value}</h2>
        <Link href={`${spacePath(query.studio, query.space)}/activity`}>
          <a className="text-right text-accent-red pt-0.5">Exit</a>
        </Link>
      </div>
      <Carousel>
        <CardContainer onFocus={() => {}} selected={false} key={"chat"}>
          <div
            className={`grow h-full bg-white rounded-lg relative border border-grey-80`}
          >
            <div className="absolute top-0 bottom-0 left-0 right-0 flex flex-col gap-4 h-full p-4">
              <Messages topic={props.entity} />
              <MessageInput id={props.entity} topic={props.entity} />
            </div>
          </div>
        </CardContainer>
        {cards?.map((c) => {
          let entity = c.value.value;
          return (
            <CardContainer onFocus={() => {}} selected={false} key={entity}>
              <CardView entityID={entity} referenceFactID={c.id} />
            </CardContainer>
          );
        })}
        <CardContainer onFocus={() => {}} selected={false} key="create">
          <div className="h-full w-full flex items-center">
            <AddToSection
              entity={props.entity}
              attribute="activity/hand-contains"
            />
          </div>
        </CardContainer>
      </Carousel>
    </div>
  );
};

const Hand = (props: { entity: string }) => {
  let cards = useIndex.eav(props.entity, "activity/hand-contains");
  return (
    <div className="overflow-x-auto p-4 w-full">
      <SmallCardList
        horizontal
        cards={cards || []}
        deck={props.entity}
        attribute="activity/hand-contains"
        positionKey="eav"
      />
    </div>
  );
};

const ActivityTitle = (props: { entity: string }) => {
  let name = useIndex.eav(props.entity, "activity/name");
  return (
    <Head>
      <title key="title">{name?.value || "Untitled Activity"}</title>
    </Head>
  );
};
