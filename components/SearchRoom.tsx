import { useState } from "react";
import { CardPreview } from "./CardPreview";
import { useAllItems } from "./FindOrCreateEntity";

export const SearchRoom = () => {
  let items = useAllItems(true);
  let [searchInput, setSearchInput] = useState("");
  return (
    <div className="no-scrollbar relative flex h-full w-[336px] flex-col items-stretch p-2 text-sm sm:p-4">
      <input
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
      <div className="no-scrollbar flex h-full flex-col gap-4 overflow-scroll pt-4">
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
