import { SpaceList } from "components/SpacesList";
import { ComponentViewer, Props, Stories } from ".";
export { getStaticProps } from ".";

const stories: Stories = {
  activities: {
    entities: [
      {
        id: "1",
        facts: [
          { attribute: "space/name", value: "Books" },
          { attribute: "space/studio", value: "jared" },
        ],
      },
    ],
  },
};

const SpacesListStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={stories}>
      <SpaceList />
    </ComponentViewer>
  );
};
SpacesListStory.metadata = {
  name: "Spaces List",
};
export default SpacesListStory;
