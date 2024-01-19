import { ulid } from "src/ulid";
import { scanIndex, useMutations } from "./useReplicache";
import { isUrl } from "src/isUrl";
import { ref } from "data/Facts";
import { workerAPI } from "backend/lib/api";
import { WORKER_URL } from "src/constants";
import { useDebouncedEffect } from "./utils";

export const useLinkPreviewManager = (
  entityID: string,
  value: string | undefined
) => {
  let { authorized, mutate, rep } = useMutations();
  useDebouncedEffect(
    async () => {
      if (!authorized || !rep) return;
      if (value === undefined) return;
      let linkPreview = await rep.query((tx) =>
        scanIndex(tx).eav(entityID, "card/link-preview")
      );
      let isTitleUrl = isUrl(value);
      if (!isTitleUrl) {
        if (linkPreview) {
          await mutate("retractFact", { id: linkPreview.id });
        }
        return;
      }

      if (linkPreview && linkPreview.value.url === value) return;
      if (isTitleUrl) {
        let data = await workerAPI(WORKER_URL, "get_url_preview_data", {
          url: value,
        });
        if (!data.success) {
          if (linkPreview) {
            await mutate("retractFact", { id: linkPreview.id });
          }
          return;
        }
        await mutate("assertFact", [
          {
            entity: entityID,
            attribute: "card/link-preview",
            value: {
              url: value,
              description: data.description,
              image: data.image,
              logo: data.logo,
              title: data.title,
              author: data.author,
            },
            positions: {},
          },
        ]);
      }
    },
    1000,
    [value, rep, entityID]
  );
};
