import { useState } from "react";
import { CardPreview } from "./CardPreview";
import { useAllItems } from "./FindOrCreateEntity";
import { RoomSearch } from "./Icons";
import { Divider } from "./Layout";

export const SearchRoom = () => {
  let items = useAllItems(true);
  let [searchInput, setSearchInput] = useState("");
  return (
    <div className="no-scrollbar relative m-2 flex h-full w-[336px] flex-col items-stretch gap-3 text-sm sm:m-4">
      <div className="flex gap-2 rounded-md border border-grey-35 bg-white">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="search cards..."
          className="grow border-transparent bg-transparent"
        />
        <div className="shrink-1 place-self-center pr-3 text-grey-35">
          <RoomSearch />
        </div>
      </div>
      <Divider />
      <div className="no-scrollbar flex h-full flex-col gap-2 overflow-scroll pt-2">
        {items
          .filter((f) =>
            f.display
              .toLocaleLowerCase()
              .includes(searchInput.toLocaleLowerCase())
          )
          .map((item) => {
            return (
              <div>
                <CardPreview
                  entityID={item.entity}
                  size={"big"}
                  hideContent={true}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};
