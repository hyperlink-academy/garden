import { useIndex, useMutations } from "hooks/useReplicache";
import { useState } from "react";
import { ulid } from "src/ulid";
import { CardPreview, CardPreviewWithData } from "./CardPreview";
import { FindOrCreate, useAllItems } from "./FindOrCreateEntity";
import { AddSmall, CardSearch } from "./Icons";
import { Divider } from "./Layout";

export function CalendarRoom() {
  let { authorized } = useMutations();

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
        {days.length > 0 ? (
          days.map((d, index, days) => {
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
                <div key={index}>
                  <div className="calendarItem flex flex-row gap-3" key={d}>
                    <div className="flex h-fit flex-col gap-0.5 rounded-md bg-grey-35 pb-0.5 text-center text-sm text-grey-55">
                      <div className="calendarDateBox -gap-1 flex h-fit w-fit flex-col rounded-md border border-grey-55 bg-white py-1 px-2 ">
                        <span>{month?.value}</span>
                        <span className="text-lg font-bold text-grey-35">
                          {day?.value}
                        </span>{" "}
                      </div>
                      <span className="font-bold text-white">
                        {weekday?.value}
                      </span>
                    </div>
                    <div className="calendarCards flex h-full w-full flex-col gap-2">
                      {!cardsWithDate[d] ? (
                        <div className="calendarEmpty flex h-full flex-col place-items-end text-center text-sm italic text-grey-55">
                          <div className="flex grow place-items-end">
                            <p>no scheduled cards</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {cardsWithDate[d]?.map((card) => (
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
                </div>
                {index + 1 === days.length ? null : <Divider />}
              </>
            );
          })
        ) : authorized ? (
          <div className="flex flex-col gap-4 italic text-grey-35">
            <p>Schedule cards on the calendar 📅</p>
            <p>To get started, set start & end dates for the space!</p>
          </div>
        ) : (
          // empty calendar - non-auth view
          <div className="flex flex-col gap-4 italic text-grey-35">
            <p>
              This Space is not yet scheduled — once dates are set, its calendar
              will show here 📅 ✨
            </p>
          </div>
        )}
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
    <div className="flex shrink-0 place-items-center gap-2  place-self-end text-sm text-grey-55">
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
