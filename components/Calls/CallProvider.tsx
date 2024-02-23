import {
  DailyProvider,
  DailyAudio,
  useDaily,
  useDailyEvent,
} from "@daily-co/daily-react";
import { useCallback, useRef } from "react";
import { useAuth } from "hooks/useAuth";
import { workerAPI } from "backend/lib/api";

export const CallProvider = (props: { children: React.ReactNode }) => {
  return (
    <DailyProvider audioSource videoSource={false}>
      {props.children}
      <ScreenWake />
      <DailyAudio />
    </DailyProvider>
  );
};

const ScreenWake = () => {
  let wakeLock = useRef<null | any>(null);
  useDailyEvent("joined-meeting", async () => {
    try {
      if ("wakeLock" in navigator) {
        //@ts-ignore
        wakeLock.current = await navigator.wakeLock.request("screen");
      }
    } catch (e) {}
  });
  useDailyEvent("left-meeting", async () => {
    if (wakeLock.current) await wakeLock.current.release();
    wakeLock.current = null;
  });
  return <></>;
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const useJoinCall = ({ space_id }: { space_id: string }) => {
  let call = useDaily();
  let { session, authToken } = useAuth();

  return useCallback(async () => {
    if (!session.session || !authToken || !call) return;
    let token = await workerAPI(`${WORKER_URL}`, "get_daily_token", {
      authToken,
      id: space_id,
    });
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
  }, [call, session.session, authToken, space_id]);
};
