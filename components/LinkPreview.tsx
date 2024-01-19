import { workerAPI } from "backend/lib/api";
import { db } from "hooks/useReplicache";
import useSWR from "swr";
export const LinkPreview = (props: { entityID: string }) => {
  let data = db.useEntity(props.entityID, "link-preview/data");
  return (
    <div className="w-full border p-2">
      {data?.value.title}
      {data?.value.description}
      <a href={data?.value.url}>link</a>
      {data?.value.image && (
        <img src={data.value.image.url} className="w-full" />
      )}

      {data?.value.logo && <img src={data.value.logo.url} className="w-full" />}
    </div>
  );
};
