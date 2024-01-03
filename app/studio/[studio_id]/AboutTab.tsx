import { SectionImageAdd } from "components/Icons";
import { Divider } from "components/Layout";
import { Textarea } from "components/Textarea";
import { db, useMutations } from "hooks/useReplicache";
import { useState } from "react";

export function About() {
  let home = db.useAttribute("home")[0];
  let homeContent = db.useEntity(home?.entity, "card/content");
  let { mutate } = useMutations();
  let [aboutFocus, setAboutFocus] = useState(false);
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-3 rounded-lg border border-grey-80 bg-white p-4 text-lg">
      {
        <div className="no-scrollbar flex h-full flex-col gap-2 overflow-scroll">
          <Textarea
            id="studio-about"
            placeholder="write a readme..."
            value={homeContent?.value}
            onFocus={() => {
              setAboutFocus(true);
            }}
            onBlur={() => setAboutFocus(false)}
            onChange={(e) => {
              if (!home) return;
              mutate("assertFact", {
                positions: {},
                attribute: "card/content",
                value: e.currentTarget.value,
                entity: home?.entity,
              });
            }}
          />
          <>
            {aboutFocus && (
              <>
                <Divider />
                <div className="flex items-center gap-2 text-grey-55">
                  <SectionImageAdd />
                  add an image
                </div>
              </>
            )}
          </>
        </div>
      }
    </div>
  );
}
