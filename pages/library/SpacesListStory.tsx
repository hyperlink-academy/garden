import { SpaceList } from "components/SpacesList";
import { ComponentViewer, Props, Stories } from ".";
export { getStaticProps } from ".";

const stories: Stories = {
  activities: {
    entities: [
      {
        "space/name": "Books",
        "space/studio": "jared",
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
