import { ButtonLink } from "components/Buttons";
import { Divider } from "components/Layout";
import { useIndex } from "hooks/useReplicache";

export const Sidebar = (props: {
  onRoomChange: (room: string) => void;
  currentRoom: string | null;
}) => {
  let homeEntity = useIndex.aev("home");
  return (
    <div className="roomListWrapper flex w-48 shrink-0 flex-col gap-2 rounded-l-[3px] border-r border-grey-90 bg-white p-4 text-grey-35">
      <h3>{props.currentRoom === homeEntity[0]?.entity ? "Home" : ""}</h3>
      <Divider />
      <div>
        <h4>Shared</h4>
        <ul>
          <strong>
            <li>Homeroom</li>
          </strong>
        </ul>
        <ButtonLink content="new room" />
      </div>
      <div>
        <h4>Members</h4>
        <MemberList />
        <ButtonLink content="invite member" />
      </div>
    </div>
  );
};

const MemberList = () => {
  let members = useIndex.aev("member/name");

  return (
    <ul>
      {members.map((member) => (
        <li>{member.value}</li>
      ))}
    </ul>
  );
};
