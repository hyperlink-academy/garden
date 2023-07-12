import { DisclosureCollapseTiny, DisclosureExpandTiny } from "components/Icons";
import { Divider } from "components/Layout";
import { SpaceData, SpaceList } from "components/SpacesList";
import { useStudioData } from "hooks/useStudioData";
import { useState } from "react";
import { getCurrentDate } from "src/utils";

export function StudioSpaces(props: { id: string }) {
  let { data } = useStudioData(props.id);
  let [showHistory, setShowCompleted] = useState(false);

  let now = getCurrentDate();

  const spacesUpcoming = data?.spaces_in_studios.filter(
    (s) => s?.space_data?.start_date && s.space_data.start_date > now
  );

  // active:
  // start-date = in past
  // end-date = in future or unset
  const spacesActive = data?.spaces_in_studios.filter((s) => {
    if (!s?.space_data) return false;
    if (!s.space_data.start_date) {
      return s.space_data.end_date && s.space_data.end_date >= now;
    } else
      return (
        s.space_data.start_date &&
        s.space_data.start_date <= now &&
        (!s.space_data.end_date || s.space_data.end_date >= now)
      );
  });

  // unscheduled (implicit draft)
  // spaces with NEITHER start nor end date
  const spacesUnscheduled = data?.spaces_in_studios.filter(
    (s) => !s?.space_data?.start_date && !s?.space_data?.end_date
  );

  const spacesCompleted = data?.spaces_in_studios.filter(
    (s) => s?.space_data?.end_date && s.space_data.end_date < now
  );

  return (
    <div className="mb-12 flex flex-col gap-8">
      {spacesActive && spacesActive.length > 0 ? (
        <>
          <SpaceList
            spaces={spacesActive?.map((s) => s.space_data as SpaceData) || []}
          />
          <Divider />
        </>
      ) : null}

      {spacesUpcoming && spacesUpcoming?.length > 0 ? (
        <div className="flex flex-col gap-1">
          <h3>Coming Up</h3>
          <SpaceList
            small
            spaces={spacesUpcoming?.map((s) => s.space_data as SpaceData) || []}
          />
        </div>
      ) : null}

      {spacesUnscheduled && spacesUnscheduled.length > 0 ? (
        <div className="flex flex-col gap-1">
          <h3>Unscheduled</h3>
          <SpaceList
            small
            spaces={
              spacesUnscheduled?.map((s) => s.space_data as SpaceData) || []
            }
          />
        </div>
      ) : null}

      {spacesCompleted && spacesCompleted.length > 0 ? (
        <div>
          <button
            className={`flex items-center gap-2 hover:text-accent-blue ${
              showHistory ? "text-grey-15" : "text-grey-55"
            }`}
            onClick={() => {
              setShowCompleted(!showHistory);
            }}
          >
            <h3>Completed ({spacesCompleted.length})</h3>
            {!showHistory ? (
              <DisclosureCollapseTiny />
            ) : (
              <DisclosureExpandTiny />
            )}
          </button>
          <div className={`${showHistory ? "" : "hidden"}`}>
            <SpaceList
              small
              spaces={
                spacesCompleted?.map((s) => s.space_data as SpaceData) || []
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
