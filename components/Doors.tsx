import { useIndex } from "hooks/useReplicache";
import { SVGProps } from "react";

let doorImages: string[] = [
  "/doors/door-clouds-256.jpg",
  "/doors/door-chicken-256.jpg",
  "/doors/door-field-256.jpg",
  "/doors/door-windowseat-256.jpg",
];

var doorIndex = 0;
function getSequentialDoorImage(doorImages: string[]) {
  var length = doorImages.length;
  if (doorIndex <= length - 1) {
    doorIndex++;
    return doorImages[doorIndex - 1];
  } else {
    doorIndex = 1;
    return doorImages[doorIndex - 1];
  }
}

let frameColors = {
  skyblue: ["#87ceeb", "#e0ffff"], //skyblue, lightcyan
  salmon: ["#fa8072", "#ffa07a"], //salmon, lightsalmon
  plum: ["#9932cc", "#dda0dd"], //darkorchid, plum
  lavender: ["#d8bfd8", "#fff0f5"], //thistle, lavenderblush
  "green - light": ["#3cb371", "#90ee90"], //mediumseagreen, lightgreen
  "green - dark": ["#008000", "#006400"], //green, darkgreen
  "gold - light": ["#ffd700", "#ffe4b5"], //gold, moccasin
  "gold - dark": ["#daa520", "#ffd700"], //goldenrod, gold
  "blue - med light": ["#0000ff", "#6495ed"], //blue, cornflowerblue
  "blue - dark": ["#000080", "#0000ff"], //navy, blue
  "crimson - light": ["#dc143c", "#f08080"], //crimson, lightcoral
  "crimson - dark": ["#b22222", "#dc143c"], //firebrick, crimson
};

function getRandomFrame(frameColors: object) {
  var length = Object.keys(frameColors).length;
  return Object.keys(frameColors)[
    Math.floor(Math.random() * length)
  ] as keyof typeof frameColors;
}

export const Door = (props: {
  entityID: string;
  width?: string;
  glow?: boolean;
}) => {
  let image = useIndex.eav(props.entityID, "space/door/image");
  // let colorKey = getRandomFrame(frameColors);
  // let color1 = frameColors[colorKey][0];
  // let color2 = frameColors[colorKey][1];
  let color1 = "#daa520";
  let color2 = "#ffd700";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.width || "128"}
      height="auto"
      viewBox="0 0 256 576"
      className="flex-none -scale-x-100"
      filter={props?.glow ? "url(#softGlow)" : ""}
      overflow="visible"
    >
      <defs>
        <style>
          {`.cls-1{fill:`}
          {color1}
          {`;} .cls-2{fill:`}
          {color2}
          {`;}`}
        </style>
        <clipPath id="outer-frame">
          <path d="M1.00034 447.074L1 90.5077C1.00084 61.4231 15.0766 33.3046 40.3945 21.1728L71.2673 6.85697C83.5403 1.96661 111.359 -1.29418 126.2 2.98783C210.299 27.253 257 116.088 257 200.556L257 560.528L227.104 577L1.00034 447.074Z" />
        </clipPath>

        {/* GLOW EFFECT */}
        {/* reference: https://codepen.io/dipscom/pen/mVYjPw */}
        {/* alt example: https://stackoverflow.com/questions/54112231/is-it-possible-to-create-a-glow-effect-in-svg */}
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
          <feFlood flood-color="#ffd700" result="glowColor" />
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
      </defs>

      <image
        width="100%"
        height="100%"
        preserveAspectRatio="xMinYMin slice"
        // xlinkHref={image?.value || getSequentialDoorImage(doorImages)}
        xlinkHref={image?.value || "/doors/door-clouds-256.jpg"}
        clipPath="url(#outer-frame)"
      />

      <path
        className="cls-1"
        d="M256,199.56v360L226.1,576V216c0-77.86-39.55-168.6-130.8-197.57-19.34-6.14-36.14-5.7-50-.73l25-11.87C82.54,1,110.36-2.29,125.2,2,209.3,26.26,256,115.09,256,199.56Z"
      />
      <path
        className="cls-2"
        d="M45.28,17.73c13.88-5,30.68-5.41,50,.73,91.25,29,130.8,119.71,130.8,197.57V576L0,446.08V89.51C0,58.24,16.27,28.1,45.28,17.73ZM196.19,523.44V200.94c0-41.36-29.88-119.39-96.2-145.41C85.9,50,74.06,49.28,64.35,51.87h0C40.88,58.13,29.9,83.76,29.89,107.82v320Z"
      />
      <polygon
        className="cls-1"
        points="196.19 503.54 196.19 523.44 29.89 427.81 47.28 417.99 47.31 417.93 196.19 503.54"
      />
      <path
        className="cls-1"
        d="M47.28,418l-17.39,9.82v-320c0-24.06,11-49.69,34.45-55.94-.52.45-17.06,15.13-17.06,43.28V417.91l0,0Z"
      />
    </svg>
  );
};
