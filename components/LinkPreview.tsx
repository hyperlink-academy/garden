import { db } from "hooks/useReplicache";
import { useIsMobile } from "hooks/utils";
import { ExternalLink } from "./Icons";

export const LinkPreview = (props: { entityID: string }) => {
  let data = db.useEntity(props.entityID, "card/link-preview");
  let isMobile = useIsMobile();

  return (
    <a href={data?.value.url} target="_blank" rel="noopener noreferrer">
      <div className=" flex h-[86px] w-full gap-3 overflow-hidden rounded-md border border-grey-80 hover:bg-bg-blue sm:h-[120px] sm:gap-4">
        {/* use image if it exists, logo if not */}
        {data?.value.image ? (
          <img
            src={data.value.image.url}
            className="max-w-[64px] object-cover"
            alt={`preview image for ${data.value.url}`}
          />
        ) : data?.value.logo && data.value.logo.height ? (
          <img
            src={data.value.logo.url}
            height={isMobile ? 86 : 120}
            width={isMobile ? 86 : 120}
            alt={`website logo for ${data.value.url}`}
            className="m-2 h-fit rounded-md"
          />
        ) : (
          <div className="w-[64px] pl-4 pt-3 text-accent-blue">
            <ExternalLink />
          </div>
        )}
        <div className="flex flex-col gap-2 py-1 pr-1 sm:py-2 sm:pr-2">
          <p className="font-bold text-accent-blue">{data?.value.title}</p>
          <p className="text-sm text-grey-55">{data?.value.description}</p>
        </div>
      </div>
    </a>
  );
};

export const LinkPreviewCondensed = (props: { entityID: string }) => {
  let data = db.useEntity(props.entityID, "card/link-preview");

  return (
    <a
      href={data?.value.url}
      target="_blank"
      rel="noopener noreferrer"
      className=""
    >
      <div className="group/link flex h-[64px] w-full gap-3 overflow-hidden rounded-md border border-grey-80 hover:bg-bg-blue ">
        {/* use image if it exists, logo if not */}
        {data?.value.image ? (
          <img
            src={data.value.image.url}
            className="max-w-[64px] object-cover"
            alt={`preview image for ${data.value.url}`}
          />
        ) : data?.value.logo ? (
          <img
            src={data.value.logo.url}
            height={32}
            width={32}
            alt={`website logo for ${data.value.url}`}
            className="m-2 h-fit rounded-md"
          />
        ) : (
          <div className="w-[32px] pl-2 pt-[10px] text-accent-blue">
            <ExternalLink />
          </div>
        )}
        <div className="h-full py-1 pr-1 sm:py-2 sm:pr-2">
          <p className="h-full overflow-hidden font-bold text-accent-blue">
            {data?.value.title}
          </p>
        </div>
        <div className="invisible absolute top-[37px] inline-block w-full overflow-hidden overflow-ellipsis whitespace-nowrap bg-white bg-opacity-75 p-1 text-xs group-hover/link:visible">
          {data?.value.url}
        </div>
      </div>
    </a>
  );
};

export const LinkPreviewTiny = (props: { entityID: string }) => {
  let data = db.useEntity(props.entityID, "card/link-preview");

  return (
    <a
      href={data?.value.url}
      target="_blank"
      rel="noopener noreferrer"
      className="-mx-[9px] -mt-[9px]"
    >
      <div className="group/link flex h-[72px] w-full gap-3 overflow-hidden rounded-md border border-grey-80 hover:bg-bg-blue ">
        {/* use image if it exists, logo if not */}
        {data?.value.image ? (
          <img
            src={data.value.image.url}
            className="max-w-[32px] object-cover"
            alt={`preview image for ${data.value.url}`}
          />
        ) : data?.value.logo ? (
          <img
            src={data.value.logo.url}
            height={32}
            width={32}
            alt={`website logo for ${data.value.url}`}
            className="h-fit pl-2 pt-[6px]"
          />
        ) : (
          <div className="w-[24px] pl-2 pt-[6px] text-accent-blue">
            <ExternalLink />
          </div>
        )}
        <div className="h-full py-1 pr-1">
          <p className="h-full overflow-hidden text-sm font-bold text-accent-blue">
            {data?.value.title}
          </p>
        </div>
        <div className="invisible absolute top-[45px] inline-block w-full overflow-hidden overflow-ellipsis whitespace-nowrap bg-white bg-opacity-75 p-1 text-xs group-hover/link:visible">
          {data?.value.url}
        </div>
      </div>
    </a>
  );
};
