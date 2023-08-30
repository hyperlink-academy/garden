import { DailyProvider, DailyAudio, useDaily } from "@daily-co/daily-react";
import { useCallback } from "react";
import { useAuth } from "hooks/useAuth";
import { useSpaceID } from "hooks/useReplicache";
import { spaceAPI } from "backend/lib/api";

export const CallProvider = (props: { children: React.ReactNode }) => {
  return (
    <DailyProvider audioSource videoSource={false}>
      {props.children}
      <DailyAudio />
    </DailyProvider>
  );
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const useJoinCall = () => {
  let call = useDaily();
  let { session, authToken } = useAuth();
  let spaceID = useSpaceID();

  return useCallback(async () => {
    if (!session.session || !authToken || !call) return;
    let token = await spaceAPI(
      `${WORKER_URL}/space/${spaceID}`,
      "get_daily_token",
      { authToken }
    );
    if (!token.success) return;
    call.updateInputSettings({
      audio: { processor: { type: "noise-cancellation" } },
    });
    await call.join({
      token: token.token.token,
      url: `https://hyperlink.daily.co/${token.name}`,
      userName: session.session?.username,
    });
    call.setLocalAudio(true);
  }, [call, session.session, authToken, spaceID]);
};
