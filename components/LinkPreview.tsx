import { db } from "hooks/useReplicache";
import { useIsMobile } from "hooks/utils";

export const LinkPreview = (props: { entityID: string }) => {
  let data = db.useEntity(props.entityID, "link-preview/data");
  let isMobile = useIsMobile();

  return (
    <a href={data?.value.url}>
      <div className=" flex h-[86px] w-full gap-3 overflow-hidden rounded-md border border-accent-blue hover:bg-bg-blue sm:h-[120px] sm:gap-4">
        {/* 
        {data?.value.image && (
          <img src={data.value.image.url} className="w-full" />
        )} */}

        {data?.value.logo && (
          <img
            src={data.value.logo.url}
            height={isMobile ? 86 : 120}
            width={isMobile ? 86 : 120}
            alt="a website logo"
            className="shrink-0"
          />
        )}
        <div className="flex flex-col gap-2 py-1 pr-1 sm:py-2 sm:pr-2">
          <p className="font-bold text-accent-blue">{data?.value.title}</p>
          <p className="text-sm text-grey-55">{data?.value.description}</p>
        </div>
      </div>
    </a>
  );
};
