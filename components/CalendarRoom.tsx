import { useIndex } from "hooks/useReplicache";
import { CardPreview } from "./CardPreview";

export function CalendarRoom() {
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
    <div className="no-scrollbar relative flex h-full w-[336px] flex-col p-2 sm:p-4">
      <div className="flex flex-col gap-2">
        {Object.entries(cardsWithDate).map(([date, cards]) => {
          let dateParts = Intl.DateTimeFormat("en", {
            timeZone: "UTC",
            month: "short",
            day: "numeric",
            weekday: "short",
          }).formatToParts(new Date(date));

          let month = dateParts.find((f) => f.type === "month");
          let day = dateParts.find((f) => f.type === "day");
          let weekday = dateParts.find((f) => f.type === "weekday");

          return (
            <div className="flex flex-row gap-2" key={date}>
              <div className="flex h-fit w-fit flex-col rounded-md border border-grey-15 bg-white py-1 px-2 text-center text-xs">
                <span>{month?.value}</span>
                <span className="text-lg font-bold">{day?.value}</span>{" "}
                <span>{weekday?.value}</span>
              </div>
              <div className="flex w-full flex-col gap-2">
                {cards.map((card) => (
                  <CardPreview
                    entityID={card.entity}
                    key={card.entity}
                    size="big"
                    hideContent
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
