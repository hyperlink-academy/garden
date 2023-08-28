import { defaultDoorImages } from "./DoorSelector";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

const OuterFrameClipPath = (props: { small?: boolean }) => {
  return (
    <>
      {props.small ? (
        <clipPath id="small-outer-frame">
          <path d="M177.36,67.83c-41-5.68-81.6,42.82-90.68,108.33-6.57,47.41,5.18,90.73,27.71,113.21.53.09,1.07.18,1.61.25,41,5.69,81.61-42.82,90.68-108.33,6.57-47.41-5.17-90.73-27.7-113.21C178.44,68,177.91,67.9,177.36,67.83Z" />
        </clipPath>
      ) : (
        <clipPath id="large-outer-frame">
          <path d="M58.67,521.92,227,427.57V119.84c0-27.47-13.1-70.32-57.88-65.3-50.79,5.7-111,78.77-110.91,165.32C58.32,295,58.67,521.92,58.67,521.92Z" />
        </clipPath>
      )}
    </>
  );
};

export const DoorImage = (props: {
  image?: string | null;
  default_space_image?: string | null;
  display_name?: string | null;
  width?: string;
  glow?: boolean;
  small?: boolean;
}) => {
  let image = props.image
    ? `${WORKER_URL}/static/${props.image}`
    : props.default_space_image
    ? props.default_space_image
    : "/doors/door-clouds-256.jpg";
  let light = "#ffec96";
  let medium = "#ffd700";
  let dark = "#daa520";

  return (
    <svg
      role="img"
      aria-labelledby="titleid"
      xmlns="http://www.w3.org/2000/svg"
      width={props.width || "128"}
      viewBox={props.small ? " 0 0 256 330" : "0 0 256 576"}
      className="flex-none"
      filter={props?.glow ? "url(#softGlow)" : ""}
      overflow="visible"
    >
      <defs>
        <>
          <style>
            {`.cls-1{fill:`}
            {light}
            {`;} .cls-2{fill:`}
            {medium}
            {`;} .cls-3{fill:`}
            {dark}
            {`;} .cls-4{fill:white;}`}
          </style>
          <OuterFrameClipPath small={props.small} />

          {SoftGlowFilter}
        </>
      </defs>

      {/* TODO: fix issue where we see all default images while loading? */}

      <g
        width="100%"
        height="100%"
        clipPath={`${
          props.small ? "url(#small-outer-frame)" : "url(#large-outer-frame)"
        } `}
        fill="transparent"
      >
        <image
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          xlinkHref={image}
        />
      </g>
      {props.small ? (
        <>
          {/* SMALL DOOR FRAME SVG */}

          <path
            className="cls-1"
            d="M179.58,68.08c22.53,22.48,34.27,65.8,27.7,113.21-9.07,65.51-49.67,114-90.68,108.33-.54-.07-1.08-.16-1.61-.25,8.6,8.58,18.77,14.13,30.1,15.7,41,5.68,81.6-42.82,90.68-108.33C244.73,132.09,219.65,75,179.58,68.08Z"
          />
          <path
            className="cls-3"
            d="M198.3,45.46l-7.89-6.66c-11.77-5.2-22.56-6.9-33.16-8.27-53.76-7-106.37,48.14-117.62,129.35-9.27,66.92,12.46,127.49,50.43,150.9h0l.63.37.56.34,29.68,14,7.22-26.13c-30.87-17-48.61-67.28-40.86-123.21C96.36,110.65,137,62.15,178,67.83a48.13,48.13,0,0,1,13.11,3.77Z"
          />
          <path
            className="cls-3"
            d="M179.58,68.08A87.51,87.51,0,0,1,198.3,97c23.4,6.44,37.2,40.9,39.09,82.09C240,122,216,74.4,179.58,68.08Z"
          />
          <path
            className="cls-2"
            d="M177.42,35.63C123.73,28.19,71.09,88,59.83,169.21S83,322.29,136.67,329.72,243,277.36,254.26,196.15,231.11,43.07,177.42,35.63Zm58.35,161.11c-9.08,65.51-49.67,114-90.68,108.33s-66.88-63.4-57.81-128.91S137,62.15,178,67.83,244.85,131.22,235.77,196.74Z"
          />
        </>
      ) : (
        <>
          {/* BIG DOOR FRAME SVG */}
          <path
            className="cls-2"
            d="M199,56.59,195.58,56c-8.52-1.08-18.47.22-29.9,4.71C99.75,86.58,70.05,154.55,70.05,205.26V525.81L96.6,510.54l138.75-79.78V173.12s.05-1.65,0-4.59V112.7c0-24.62-11.56-50.88-36.31-56.11m56.31,56.11V442.33L50.05,560.38V205.26A180.68,180.68,0,0,1,84,99.78c32.44-45.48,76.84-64.13,105.8-64.13a64.6,64.6,0,0,1,15,1.71,104.81,104.81,0,0,1,14.41,5.51C243,55.83,255.35,84.4,255.35,112.7Z"
          />
          <path
            className="cls-1"
            d="M235.35,173.12V430.76L96.6,510.54l-26.55-5.28V494.69l93.7-53.88a1,1,0,0,0,.55,1.83,1,1,0,0,0,.5-.13L209,417.12a1,1,0,0,0,.5-.87V93.5c0-18.44-4.85-29-8.47-34.37,31.07,32.59,34.14,92.45,34.37,109.4Z"
          />
          <path
            className="cls-4"
            d="M207.47,97.67V92.92c0-14.46-3-23.73-6-29.36-.27-.52-.55-1-.82-1.45-.08-.15-.18-.3-.27-.45l-.27-.43c-.45-.71-.9-1.34-1.32-1.89-.17-.23-.34-.44-.51-.64s-.25-.31-.37-.45-.23-.28-.35-.4c-.32-.37-.62-.67-.88-.93s-.66-.64-.93-.89c.88.11,2.48.39,3.33.56A23.33,23.33,0,0,1,201,59.12s0,0,0,0c3.62,5.33,8.47,15.93,8.47,34.37V416.25a1,1,0,0,1-.5.87L164.8,442.51a1,1,0,0,1-1.37-.37,1,1,0,0,1,.32-1.33l43.72-25.14Z"
          />
          <path
            className="cls-3"
            d="M235.35,112.7v55.83c-.23-16.95-3.3-76.81-34.37-109.4,0,0,0,0,0,0A27.69,27.69,0,0,0,199,56.59C223.79,61.82,235.35,88.08,235.35,112.7ZM229.12,427a1,1,0,0,0,.45,1.34l0,0a1,1,0,0,0,.43.1,1,1,0,0,0,.89-.56,1,1,0,0,0-1.81-.9Zm-4.36-3.45a1,1,0,0,0-.93,1.77l2.22,1.16a1,1,0,0,0,.46.11,1,1,0,0,0,.89-.54,1,1,0,0,0-.42-1.34Zm-13.46-7a1,1,0,1,0-.93,1.77l9,4.7a.93.93,0,0,0,.46.12,1,1,0,0,0,.46-1.89ZM52.27,119c-16.61,36.6-16.91,65.77-16.91,77.52V551.68l14.69,8.7V205.26A180.68,180.68,0,0,1,84,99.78c32.44-45.48,76.84-64.13,105.8-64.13a64.6,64.6,0,0,1,15,1.71c-11.72-3.74-27-7.41-37.1-7.42C129.12,29.91,78.87,60.41,52.27,119ZM70.05,505.26v20.55L96.6,510.54Z"
          />
        </>
      )}
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

export const DoorClippedImage = (props: { url: string; width?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.width || "128"}
      height="auto"
      viewBox="0 0 256 576"
      className="flex-none"
      overflow="visible"
    >
      <defs>
        <OuterFrameClipPath small={false} />
      </defs>

      <image
        width="100%"
        height="100%"
        preserveAspectRatio="xMinYMin slice"
        xlinkHref={props.url}
        clipPath="url(#large-outer-frame)"
      />
    </svg>
  );
};
