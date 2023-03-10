import { useIndex, useMutations } from "hooks/useReplicache";
import { useState } from "react";
import { ulid } from "src/ulid";
import { CardPreview } from "./CardPreview";
import { FindOrCreate, useAllItems } from "./FindOrCreateEntity";
import { AddSmall, CardSearch } from "./Icons";
import { Divider } from "./Layout";

export function CalendarRoom() {
  let start_date = useIndex.aev("space/start-date")[0];
  let end_date = useIndex.aev("space/end-date")[0];

  let days: string[] = [];
  if (start_date && end_date) {
    let date = new Date(start_date.value.value);
    let endDate = new Date(end_date.value.value);
    while (date <= endDate) {
      days.push(date.toISOString().split("T")[0]);
      date.setTime(date.getTime() + 24 * 60 * 60 * 1000);
    }
  }
  console.log(days, start_date?.value, end_date?.value);
  //get number of days between start and end date

  let cardsWithDate = useIndex.at("card/date").reduce((acc, card) => {
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

  return (
    <div className="no-scrollbar calendarRoom relative m-2 flex h-full w-[336px] flex-col overflow-y-scroll sm:m-4">
      <div className="calendarCardList flex h-full flex-col gap-4">
        {days.map((d, index, days) => {
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
              <div className="calendarItem flex flex-row gap-3" key={d}>
                <div className="flex h-fit flex-col gap-0.5 rounded-md bg-grey-35 pb-0.5 text-center text-sm text-grey-55">
                  <div className="calendarDateBox -gap-1 flex h-fit w-fit flex-col rounded-md border border-grey-55 bg-white py-1 px-2 ">
                    <span>{month?.value}</span>
                    <span className="text-lg font-bold text-grey-35">
                      {day?.value}
                    </span>{" "}
                  </div>
                  <span className="font-bold text-white">{weekday?.value}</span>
                </div>
                <div className="calendarCards flex h-full w-full flex-col gap-2">
                  {!!!cardsWithDate[d] ? (
                    <div className="calendarEmpty flex h-full flex-col place-items-end text-center text-sm italic text-grey-55">
                      <div className="flex grow place-items-end">
                        <p>no scheduled cards</p>
                      </div>
                      <div className="flex shrink-0 place-items-center gap-2 ">
                        <button>
                          <p className="font-bold hover:text-accent-blue">
                            create new
                          </p>
                        </button>
                        <div className="h-full border-l text-grey-80" />
                        <AddAttachedCard day={d}>
                          <div className="hover:text-accent-blue">
                            <CardSearch />
                          </div>{" "}
                        </AddAttachedCard>
                      </div>
                    </div>
                  ) : (
                    <>
                      {cardsWithDate[d]?.map((card) => (
                        <CardPreview
                          entityID={card.entity}
                          key={card.entity}
                          size="big"
                          hideContent
                        />
                      ))}

                      <div className="flex place-items-center  gap-2 place-self-end text-sm text-grey-55">
                        <button>
                          <p className=" font-bold hover:text-accent-blue">
                            create new
                          </p>
                        </button>{" "}
                        <div className="h-full border-l text-grey-80" />
                        <AddAttachedCard day={d}>
                          <div className="hover:text-accent-blue">
                            <CardSearch />
                          </div>{" "}
                        </AddAttachedCard>
                      </div>

                      {/* <div className="flex gap-2 place-self-end text-sm text-grey-55">
                        <button className="font-bold hover:text-accent-blue">
                          create new
                        </button>

                        <div className="h-full border-l text-grey-80" />
                        <AddAttachedCard day={d}>
                          <div className="shrink-0 hover:text-accent-blue">
                            <CardSearch />
                          </div>
                        </AddAttachedCard>
                      </div> */}

                      {/* <div className="flex justify-between gap-2 rounded-md border border-dashed border-grey-80 p-2 text-sm text-grey-55">
                        <button className="grow font-bold hover:text-accent-blue">
                          create new
                        </button>

                        <div className="h-full border-l text-grey-80" />
                        <AddAttachedCard day={d}>
                          <div className="shrink-0 hover:text-accent-blue">
                            <CardSearch />
                          </div>
                        </AddAttachedCard>
                      </div> */}
                    </>
                  )}
                </div>
              </div>
              {index + 1 === days.length ? null : <Divider />}
            </>
          );
        })}
      </div>
    </div>
  );
}

const AddAttachedCard = (props: { day: string; children: React.ReactNode }) => {
  let [open, setOpen] = useState(false);
  let items = useAllItems(open);

  let { authorized, mutate, memberEntity, action } = useMutations();
  if (!authorized) return null;
  return (
    <>
      {/* decide styling of button via children */}
      <button onClick={() => setOpen(true)}>
        {props.children}
        {/* <div
          className={`relative flex h-10
          w-full items-center justify-center rounded-lg border border-dashed text-grey-35`}
        >
          <AddSmall />
        </div> */}
      </button>
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
