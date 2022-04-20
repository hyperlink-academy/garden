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
      {
        "space/name": "Infinite Musings",
        "space/studio": "brendan",
      },
      {
        "space/name": "Antilibraries Atelier",
        "space/studio": "brendan",
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
