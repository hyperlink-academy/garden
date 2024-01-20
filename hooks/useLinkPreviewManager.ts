import { ulid } from "src/ulid";
import { db, scanIndex, useMutations } from "./useReplicache";
import { isUrl } from "src/isUrl";
import { ref } from "data/Facts";
import { workerAPI } from "backend/lib/api";
import { WORKER_URL } from "src/constants";
import { useDebouncedEffect } from "./utils";

export const useLinkPreviewManager = (entityID: string) => {
  let { authorized, mutate, rep } = useMutations();
  let title = db.useEntity(entityID, "card/title");
  let content = db.useEntity(entityID, "card/content");
  useDebouncedEffect(
    async () => {
      if (!authorized || !rep) return;
      let linkPreview = await rep.query((tx) =>
        scanIndex(tx).eav(entityID, "card/link-preview")
      );
      let isTitleUrl = isUrl(title?.value || "");
      let isContentUrl = isUrl(content?.value || "");
      let url = isTitleUrl
        ? title?.value
        : isContentUrl
        ? content?.value
        : null;
      if (!url) {
        if (linkPreview) {
          await mutate("retractFact", { id: linkPreview.id });
        }
        return;
      }

      if (linkPreview && linkPreview.value.url === url) return;
      if (url) {
        let data = await workerAPI(WORKER_URL, "get_url_preview_data", {
          url,
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
              url,
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
    [title?.value, content?.value, rep, entityID]
  );
};
