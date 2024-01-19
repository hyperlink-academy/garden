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
          console.log("yooo");
          await mutate("retractFact", { id: linkPreview.id });
          await mutate("deleteEntity", { entity: linkPreview.value.value });
        }
        return;
      }
      if (isTitleUrl) {
        let linkPreviewEntity: string;
        if (linkPreview) {
          linkPreviewEntity = linkPreview.entity;
          let linkPreviewData = await rep.query((tx) =>
            scanIndex(tx).eav(linkPreviewEntity, "link-preview/data")
          );
          if (linkPreviewData && linkPreviewData?.value.url === value) return;
        } else {
          linkPreviewEntity = ulid();
          await mutate("assertFact", {
            entity: entityID,
            value: ref(linkPreviewEntity),
            positions: {},
            attribute: "card/link-preview",
          });
        }
        let data = await workerAPI(WORKER_URL, "get_url_preview_data", {
          url: value,
        });
        if (!data.success) {
          let linkPreview = await rep.query((tx) =>
            scanIndex(tx).eav(entityID, "card/link-preview")
          );
          if (linkPreview) {
            await mutate("retractFact", { id: linkPreview.id });
            await mutate("deleteEntity", { entity: linkPreview.value.value });
          }
          return;
        }
        await mutate("assertFact", [
          {
            entity: linkPreviewEntity,
            attribute: "link-preview/data",
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
