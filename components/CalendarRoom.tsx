import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import { useState } from "react";
import { ulid } from "src/ulid";
import { CardPreviewWithData } from "./CardPreview";
import { FindOrCreate, useAllItems } from "./FindOrCreateEntity";
import {
  CardSearch,
  DisclosureCollapseTiny,
  DisclosureExpandTiny,
} from "./Icons";
import { Divider } from "./Layout";
import { useSpaceData } from "hooks/useSpaceData";
import { RoomWrapper } from "./RoomLayout";
import { Disclosure } from "@headlessui/react";

export function CalendarRoom() {
  let { authorized } = useMutations();
  let spaceID = useSpaceID();

  // get all dates with cards and create 'days' array of dates in ISOString form (e.g. "2024-12-06")
  let datesWithCards = db.useTimeAttribute("card/date").reduce((acc, card) => {
    let key = card.value.value;
    if (!acc[key]) {
      acc[key] = [{ entity: card.entity, value: card.value.value }];
    } else
      acc[key] = [
        ...acc[key],
        { entity: card.entity, value: card.value.value },
      ];
    return acc;
  }, {} as { [key: string]: { entity: string; value: string }[] });

  let days: string[] = Object.keys(datesWithCards);

  // default - show at least next 7 days after today (even if empty)
  let date = new Date();
  for (let d = 1; d <= 8; d++) {
    let newDay = date.toISOString().split("T")[0];
    if (!days.includes(newDay)) days.push(newDay);
    date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
  }

  // filter: past days vs. current week (today + next 7 days) vs. future
  let today = new Date().toISOString().split("T")[0];
  let nextWeek = new Date();
  nextWeek.setTime(nextWeek.getTime() + 24 * 60 * 60 * 1000 * 7);
  let nextWeekString = nextWeek.toISOString().split("T")[0];

  let daysPast = days.filter((d) => d < today);
  let daysThisWeek = days.filter((d) => d >= today && d <= nextWeekString);
  let daysFuture = days.filter((d) => d > nextWeekString);

  return (
    <RoomWrapper>
      <div className="calendarCardList flex flex-col gap-4">
        {daysPast.length > 0 && (
          <Disclosure as="div" className="flex w-full flex-col gap-4">
            <>
              <Disclosure.Button
                className={`flex w-full items-center justify-between gap-2 text-left focus:outline-none focus-visible:ring focus-visible:ring-accent-blue`}
              >
                <h2>Past</h2>
                {!open ? <DisclosureExpandTiny /> : <DisclosureCollapseTiny />}
              </Disclosure.Button>
              <Disclosure.Panel>
                <div className="calendarItemWrapper flex flex-col gap-4">
                  <CalendarList
                    days={daysPast}
                    datesWithCards={datesWithCards}
                  />
                </div>
              </Disclosure.Panel>
            </>
          </Disclosure>
        )}

        {daysThisWeek.length > 0 && (
          <Disclosure
            as="div"
            defaultOpen
            className="flex w-full flex-col gap-4"
          >
            <>
              <Disclosure.Button
                className={`flex w-full items-center justify-between gap-2 text-left focus:outline-none focus-visible:ring focus-visible:ring-accent-blue`}
              >
                <h2>This Week</h2>
                {!open ? <DisclosureExpandTiny /> : <DisclosureCollapseTiny />}
              </Disclosure.Button>
              <Disclosure.Panel>
                <div className="calendarItemWrapper flex flex-col gap-4">
                  <CalendarList
                    days={daysThisWeek}
                    datesWithCards={datesWithCards}
                  />
                </div>
              </Disclosure.Panel>
            </>
          </Disclosure>
        )}

        {daysFuture.length > 0 && (
          <Disclosure as="div" className="flex w-full flex-col gap-4">
            <>
              <Disclosure.Button
                className={`flex w-full items-center justify-between gap-2 text-left focus:outline-none focus-visible:ring focus-visible:ring-accent-blue`}
              >
                <h2>Future</h2>
                {!open ? <DisclosureExpandTiny /> : <DisclosureCollapseTiny />}
              </Disclosure.Button>
              <Disclosure.Panel>
                <div className="calendarItemWrapper flex flex-col gap-4">
                  <CalendarList
                    days={daysFuture}
                    datesWithCards={datesWithCards}
                  />
                </div>
              </Disclosure.Panel>
            </>
          </Disclosure>
        )}
      </div>
    </RoomWrapper>
  );
}

const CalendarList = (props: {
  days: string[];
  datesWithCards: { [key: string]: { entity: string; value: string }[] };
}) => {
  return props.days
    .sort((a, b) => (a > b ? 0 : -1))
    .map((d, index, days) => {
      let dateParts = Intl.DateTimeFormat("en", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        weekday: "short",
      }).formatToParts(new Date(d));

      let month = dateParts.find((f) => f.type === "month");
      let day = dateParts.find((f) => f.type === "day");
      let weekday = dateParts.find((f) => f.type === "weekday");
      return (
        <>
          <div key={index} className="flex flex-col gap-4">
            <div className="calendarItem flex flex-row gap-3" key={d}>
              <div className="flex h-fit flex-col gap-0.5 rounded-md bg-grey-35 pb-0.5 text-center text-sm text-grey-55">
                <div className="calendarDateBox -gap-1 flex h-fit w-fit flex-col rounded-md border border-grey-55 bg-white px-2 py-1">
                  <span>{month?.value}</span>
                  <span className="text-lg font-bold text-grey-35">
                    {day?.value}
                  </span>{" "}
                </div>
                <span className="font-bold text-white">{weekday?.value}</span>
              </div>
              <div className="calendarCards flex h-full w-full flex-col gap-2">
                {!props.datesWithCards[d] ? (
                  <div className="calendarEmpty flex h-full flex-col place-items-end text-center text-sm italic text-grey-55">
                    <div className="flex grow place-items-end">
                      <p>no scheduled cards</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {props.datesWithCards[d]?.map((card) => (
                      <div key={card.entity} className="h-fit">
                        <CardPreviewWithData
                          entityID={card.entity}
                          key={card.entity}
                          size="big"
                          hideContent
                        />
                      </div>
                    ))}
                  </>
                )}
                <AddCardToCalendar day={d} />
              </div>
            </div>
            {index + 1 === days.length ? null : <Divider />}
          </div>
        </>
      );
    });
};

const AddAttachedCard = (props: { day: string; children: React.ReactNode }) => {
  let [open, setOpen] = useState(false);
  let items = useAllItems(open);

  let { authorized, mutate, memberEntity, action } = useMutations();
  if (!authorized) return null;
  return (
    <>
      {/* decide styling of button via children */}
      <button onClick={() => setOpen(true)}>{props.children}</button>
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
            await mutate("assertFact", {
              entity,
              factID: ulid(),
              attribute: "card/date",
              value: { type: "yyyy-mm-dd", value: props.day },
              positions: {},
            });
          }

          action.end();
        }}
        // END OF ONSELECT LOGIC
        selected={[]}
        open={open}
        items={items}
      />
    </>
  );
};

const AddCardToCalendar = (props: { day: string }) => {
  let { authorized, mutate, memberEntity, action } = useMutations();
  if (!authorized) return null;
  return (
    <div className="flex shrink-0 place-items-center gap-2 place-self-end text-sm text-grey-55">
      <button
        onClick={async () => {
          if (!memberEntity) return;
          action.start();
          let entity = ulid();
          await mutate("createCard", {
            entityID: entity,
            title: "",
            memberEntity,
          });

          await mutate("assertFact", {
            entity,
            factID: ulid(),
            attribute: "card/date",
            value: { type: "yyyy-mm-dd", value: props.day },
            positions: {},
          });

          action.end();
        }}
      >
        <p className="font-bold hover:text-accent-blue">create new</p>
      </button>
      <div className="h-4 w-[1px] border-l border-dashed text-grey-80" />
      <AddAttachedCard day={props.day}>
        <div className="hover:text-accent-blue">
          <CardSearch />
        </div>
      </AddAttachedCard>
    </div>
  );
};
