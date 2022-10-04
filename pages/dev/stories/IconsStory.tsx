import { ComponentViewer, Props } from "./index";
import * as Icons from "components/Icons";
export { getStaticProps } from "./index";

const IconsStory = (props: Props) => {
  return (
    <ComponentViewer {...props} stories={{}}>
      <div className="flex flex-wrap gap-4">
        {Object.values(Icons).map((Icon, index) => (
          <svg width="64" height="64">
            <title>{Icon.name}</title>
            <Icon key={index} />
          </svg>
        ))}
      </div>
    </ComponentViewer>
  );
};

IconsStory.metadata = {
  name: "Icons",
};

export default IconsStory;
