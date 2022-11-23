import { useIndex } from "hooks/useReplicache";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const Door = (props: {
  entityID: string;
  width?: string;
  glow?: boolean;
}) => {
  let defaultDoor = useIndex.eav(props.entityID, "space/door/image");
  let uploadedDoor = useIndex.eav(props.entityID, "space/door/uploaded-image");
  let spaceName = useIndex.eav(props.entityID, "space/name");

  let image = uploadedDoor
    ? uploadedDoor.value.filetype === "image"
      ? `${WORKER_URL}/static/${uploadedDoor.value.id}`
      : uploadedDoor.value.url
    : defaultDoor
    ? defaultDoor.value
    : "/doors/door-clouds-256.jpg";
  let color1 = "#ffec96";
  let color2 = "#ffd700";
  let color3 = "#daa520";

  return (
    <svg
      role="img"
      aria-labelledby="titleid"
      xmlns="http://www.w3.org/2000/svg"
      width={props.width || "128"}
      viewBox="0 0 256 576"
      className="flex-none -scale-x-100"
      filter={props?.glow ? "url(#softGlow)" : ""}
      overflow="visible"
    >
      <title id="titleid">Door to {spaceName?.value}</title>
      <defs>
        <style>
          {`.cls-1{fill:`}
          {color1}
          {`;} .cls-2{fill:`}
          {color2}
          {`;} .cls-3{fill:`}
          {color3}
          {`;} .cls-4{fill:white;}`}
        </style>
        {OuterFrameClipPath}

        {SoftGlowFilter}
      </defs>

      {/* rotating images */}
      {/* NB: this is hacky! */}
      {/* we're flipping the whole svg, but first want to unflip the image */}
      {/* but ONLY if uploaded - defaults need to be flipped to match frames! */}
      {/* TODO: fix issue where we see all default images while loading? */}
      <g
        width="100%"
        height="100%"
        clipPath="url(#outer-frame)"
        fill="transparent"
      >
        <image
          width="100%"
          height="100%"
          preserveAspectRatio="xMinYMin slice"
          xlinkHref={image}
          className={
            !defaultDoor && image !== "/doors/door-clouds-256.jpg"
              ? "-scale-x-100 origin-center"
              : ""
          }
        />
      </g>
      <path
        className="cls-2"
        d="M57.65,56.59,61.11,56c8.52-1.08,18.47.22,29.9,4.71,65.93,25.86,95.63,93.83,95.63,144.54V525.81l-26.55-15.27L21.34,430.76V173.12s-.05-1.65,0-4.59V112.7c0-24.62,11.56-50.88,36.31-56.11M1.34,112.7V442.33l205.3,118.05V205.26a180.68,180.68,0,0,0-34-105.48C140.24,54.3,95.84,35.65,66.88,35.65a64.6,64.6,0,0,0-15,1.71,104.81,104.81,0,0,0-14.41,5.51C13.65,55.83,1.34,84.4,1.34,112.7Z"
      />
      <path
        className="cls-1"
        d="M21.34,173.12V430.76l138.75,79.78,26.55-5.28V494.69l-93.7-53.88a1,1,0,0,1-.55,1.83,1,1,0,0,1-.5-.13L47.74,417.12a1,1,0,0,1-.5-.87V93.5c0-18.44,4.85-29,8.47-34.37-31.07,32.59-34.14,92.45-34.37,109.4Z"
      />
      <path
        className="cls-4"
        d="M49.22,97.67V92.92c0-14.46,3-23.73,6-29.36.27-.52.55-1,.82-1.45.08-.15.18-.3.27-.45l.27-.43c.45-.71.9-1.34,1.32-1.89.17-.23.34-.44.51-.64s.25-.31.37-.45.23-.28.35-.4c.32-.37.62-.67.88-.93s.66-.64.93-.89c-.88.11-2.48.39-3.33.56a23.33,23.33,0,0,0-1.93,2.53s0,0,0,0c-3.62,5.33-8.47,15.93-8.47,34.37V416.25a1,1,0,0,0,.5.87l44.15,25.39a1,1,0,0,0,1.37-.37,1,1,0,0,0-.32-1.33L49.22,415.67Z"
      />
      <path
        className="cls-3"
        d="M21.34,112.7v55.83c.23-16.95,3.3-76.81,34.37-109.4,0,0,0,0,0,0a27.69,27.69,0,0,1,1.93-2.53C32.9,61.82,21.34,88.08,21.34,112.7ZM27.57,427a1,1,0,0,1-.45,1.34l0,0a1,1,0,0,1-.43.1,1,1,0,0,1-.89-.56,1,1,0,0,1,1.81-.9Zm4.36-3.45a1,1,0,1,1,.93,1.77l-2.22,1.16a1,1,0,0,1-.46.11,1,1,0,0,1-.89-.54,1,1,0,0,1,.42-1.34Zm13.46-7a1,1,0,0,1,.93,1.77l-9,4.7a.93.93,0,0,1-.46.12,1,1,0,0,1-.46-1.89ZM204.42,119c16.61,36.6,16.91,65.77,16.91,77.52V551.68l-14.69,8.7V205.26a180.68,180.68,0,0,0-34-105.48C140.24,54.3,95.84,35.65,66.88,35.65a64.6,64.6,0,0,0-15,1.71c11.72-3.74,27-7.41,37.1-7.42C127.57,29.91,177.82,60.41,204.42,119ZM186.64,505.26v20.55l-26.55-15.27Z"
      />
    </svg>
  );
};

{
  /* GLOW EFFECT */
}
{
  /* reference: https://codepen.io/dipscom/pen/mVYjPw */
}
{
  /* alt example: https://stackoverflow.com/questions/54112231/is-it-possible-to-create-a-glow-effect-in-svg */
}
const SoftGlowFilter = (
  <filter id="softGlow" height="200%" width="200%" x="-50%" y="-50%">
    {/* <!-- Thicken out the original shape --> */}
    <feMorphology
      operator="dilate"
      radius="4"
      in="SourceAlpha"
      result="thicken"
    />
    {/* <!-- Use a gaussian blur to create the soft blurriness of the glow --> */}
    <feGaussianBlur in="thicken" stdDeviation="16" result="blurred" />
    {/* <!-- Change the colour --> */}
    <feFlood floodColor="#ffd700" result="glowColor" />
    {/* <!-- Color in the glows --> */}
    <feComposite
      in="glowColor"
      in2="blurred"
      operator="in"
      result="softGlow_colored"
    />
    {/* <!--	Layer the effects together --> */}
    <feMerge>
      <feMergeNode in="softGlow_colored" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);

const OuterFrameClipPath = (
  <clipPath id="outer-frame">
    <path
      className="cls-1"
      d="M196.56,521.92,28.19,427.57V119.84c0-27.47,13.1-70.32,57.88-65.3,50.79,5.7,111,78.77,110.9,165.32C196.91,295,196.56,521.92,196.56,521.92Z"
    />
  </clipPath>
);

export const DoorClippedImage = (props: { url: string; width?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.width || "128"}
      height="auto"
      viewBox="0 0 256 576"
      className="flex-none -scale-x-100"
      overflow="visible"
    >
      <defs>{OuterFrameClipPath}</defs>

      <image
        width="100%"
        height="100%"
        preserveAspectRatio="xMinYMin slice"
        xlinkHref={props.url}
        clipPath="url(#outer-frame)"
      />
    </svg>
  );
};
