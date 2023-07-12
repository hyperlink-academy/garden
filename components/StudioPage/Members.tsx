import { spaceAPI } from "backend/lib/api";
import { ButtonPrimary } from "components/Buttons";
import { useSmoker } from "components/Smoke";
import { useAuth } from "hooks/useAuth";
import { useStudioData } from "hooks/useStudioData";
import useSWR from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export function StudioMembers(props: { id: string }) {
  let { data } = useStudioData(props.id);
  let { authToken } = useAuth();
  let { data: inviteLink } = useSWR(
    !data || !authToken
      ? null
      : `${WORKER_URL}/space/${data.do_id}/get_share_code`,
    async () => {
      if (!data || !authToken) return;
      let code = await spaceAPI(
        `${WORKER_URL}/space/${data.do_id}`,
        "get_share_code",
        { authToken }
      );
      if (code.success) {
        return `${document.location.href}/join?code=${code.code}`;
      }
    }
  );

  let smoker = useSmoker();

  const getShareLink = async (e: React.MouseEvent) => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    smoker({ position: { x: e.clientX, y: e.clientY }, text: "copied!" });
  };
  return (
    <>
      <div className="inviteMemberModalLink flex w-full gap-2">
        <input
          className="grow bg-grey-90 text-grey-35"
          readOnly
          value={inviteLink}
          onClick={getShareLink}
        />
        <ButtonPrimary
          onClick={(e) => getShareLink(e)}
          content={"Copy Invite Link"}
        />
      </div>
      {data?.members_in_studios.map((m) => m.identity_data?.username)}
    </>
  );
}
