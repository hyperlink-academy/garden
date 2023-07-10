import { SpaceData, SpaceList } from "components/SpacesList";
import { useStudioData } from "hooks/useStudioData";

export function StudioSpaces(props: { id: string }) {
  let { data } = useStudioData(props.id);
  return (
    <SpaceList
      spaces={
        data?.spaces_in_studios.map((s) => s.space_data as SpaceData) || []
      }
    />
  );
}
