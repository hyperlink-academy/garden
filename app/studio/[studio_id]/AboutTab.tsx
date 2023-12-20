import { NonUndefined } from "@use-gesture/react";
import { Textarea } from "components/Textarea";
import { db, useMutations } from "hooks/useReplicache";
import { useStudioData } from "hooks/useStudioData";

export type Props = {
  data: NonUndefined<ReturnType<typeof useStudioData>["data"]>;
};

export function About() {
  let home = db.useAttribute("home")[0];
  let homeContent = db.useEntity(home?.entity, "card/content");
  let { mutate } = useMutations();
  return (
    <div className="h-full rounded-lg border border-grey-80 bg-white p-4">
      {
        <Textarea
          className="h-full"
          placeholder="write a readme..."
          value={homeContent?.value}
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
      }
    </div>
  );
}
