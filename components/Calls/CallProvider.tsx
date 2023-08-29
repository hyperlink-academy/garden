import Daily, {
  DailyCall,
  DailyEventObjectAppMessage,
  DailyParticipant,
} from "@daily-co/daily-js";
import { createContext, useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "hooks/useAuth";
import { useSpaceID } from "hooks/useReplicache";
import { spaceAPI } from "backend/lib/api";

let events = [
  "loading",
  "load-attempt-failed",
  "loaded",
  "started-camera",
  "camera-error",
  "joining-meeting",
  "joined-meeting",
  "left-meeting",
  "participant-joined",
  "participant-updated",
  "participant-left",
  "track-started",
  "track-stopped",
  "recording-started",
  "recording-stopped",
  "recording-stats",
  "recording-error",
  "recording-upload-completed",
  "recording-data",
  "app-message",
  "local-screen-share-started",
  "local-screen-share-stopped",
  "active-speaker-change",
  "active-speaker-mode-change",
  "network-quality-change",
  "network-connection",
  "fullscreen",
  "exited-fullscreen",
  "error",
  "click",
  "mousedown",
  "mouseup",
  "mouseover",
  "mousemove",
  "touchstart",
  "touchmove",
  "touchend",
  "live-streaming-started",
  "live-streaming-stopped",
  "live-streaming-error",
  "access-state-updated",
  "waiting-participant-added",
  "waiting-participant-updated",
  "waiting-participant-removed",
] as const;

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

export let CallContext = createContext({
  activeDevice: null as MediaDeviceInfo | null,
  joinCall: (_room: { id: string }) => new Promise(() => { }),
  muted: false,
  videoOn: false,
  setLocalAudio: (_mute: boolean) => { },
  setLocalVideo: (_video: boolean) => { },
  setInputDevices: (_devices: {
    audioDeviceId?: string;
    videoDeviceId?: string;
  }) => { },
  leaveCall: () => { },
  call: null as { id: string } | null,
  participants: [] as DailyParticipant[],
  devices: [] as MediaDeviceInfo[],
  sendMessage: (_msg: Message) => { },
});

type Message = { type: "summon"; page: string };

export const CallProvider = (props: { children: React.ReactNode }) => {
  let [room, setRoom] = useState<DailyCall | null>(null);
  let [call, setInCall] = useState<null | { id: string }>(null);
  let [participants, setParticipants] = useState<DailyParticipant[]>([]);
  let [activeDevice, setActiveDevice] = useState<null | MediaDeviceInfo>(null);
  let { session, authToken } = useAuth();
  let spaceID = useSpaceID();
  useEffect(() => {
    if (!call || !room || !spaceID || !session.session) return;
    room.setUserName(session.session.username);
  }, [spaceID, room, call, session.session]);
  let devices = useDevices();
  useEffect(() => {
    if (!room) return;
    let currentRoom = room;
    let updateParticipants = () => {
      setParticipants(Object.values(currentRoom.participants()));
    };
    const handleAppMessage = (_msg?: DailyEventObjectAppMessage) => { };
    room.updateInputSettings({
      audio: { processor: { type: "noise-cancellation" } },
    });
    currentRoom.on("app-message", handleAppMessage);
    currentRoom.on("selected-devices-updated", (devices) => {
      if (
        !devices ||
        !devices.devices.mic ||
        !(devices.devices.mic as MediaDeviceInfo).deviceId
      )
        setActiveDevice(null);
      else setActiveDevice(devices.devices.mic as MediaDeviceInfo);
    });
    for (let event of events) {
      currentRoom.on(event, updateParticipants);
    }
    return () => {
      currentRoom.off("app-message", handleAppMessage);
      for (let event of events) {
        currentRoom.off(event, updateParticipants);
      }
    };
  }, [room]);

  const joinCall = useCallback(
    async (roomData: { id: string }) => {
      console.log("yo");
      if (!session.session || !authToken) return;
      if (room) await room.leave();
      let token = await spaceAPI(
        `${WORKER_URL}/space/${spaceID}`,
        "get_daily_token",
        { authToken }
      );
      console.log(token);
      if (!token.success) return;
      const call =
        room ||
        Daily.createCallObject({
          audioSource: true, // start with audio on to get mic permission from user at start
          videoSource: false,
          dailyConfig: {},
        });
      setRoom(call);
      console.log("joining new room");
      call.updateInputSettings({
        audio: { processor: { type: "noise-cancellation" } },
      });
      await call.join({
        token: token.token.token,
        url: `https://hyperlink.daily.co/${token.name}`,
        userName: session.session?.username,
      });
      call.setLocalAudio(true);
      setInCall(roomData);
    },
    [room, session.session, authToken, spaceID]
  );

  const leaveCall = async () => {
    if (!room) return;
    await room.leave();
    setInCall(null);
  };
  const setLocalAudio = (mute: boolean) => {
    if (!room) return;
    room.setLocalAudio(mute);
  };
  const setLocalVideo = (video: boolean) => {
    if (!room) return;
    room.setLocalVideo(video);
  };
  const setInputDevices = (devices: {
    audioDeviceId?: string;
    videoDeviceId?: string;
  }) => {
    if (!room) return;
    room.setInputDevicesAsync(devices);
  };

  const sendMessage = (msg: Message) => {
    if (!room) return;
    room.sendAppMessage(msg);
  };

  return (
    <CallContext.Provider
      value={{
        joinCall,
        leaveCall,
        participants,
        activeDevice,
        call,
        setLocalVideo,
        videoOn: !!room?.localVideo(),
        setLocalAudio,
        devices,
        setInputDevices,
        sendMessage,
        muted: !room?.localAudio(),
      }}
    >
      {props.children}
      <div className="hidden">
        {participants.map((p) => (
          <Participant participant={p} key={p.user_id} />
        ))}
      </div>
    </CallContext.Provider>
  );
};

const Participant = (props: { participant: DailyParticipant }) => {
  const audioEl = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    let track = props.participant.tracks.audio.persistentTrack;
    if (!track || !audioEl.current) return;
    audioEl.current.srcObject = new MediaStream([track]);
  }, [props.participant.tracks.audio.persistentTrack, audioEl]);
  return props.participant.local ? null : (
    <audio autoPlay playsInline ref={audioEl} />
  );
};

const useDevices = () => {
  let [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(setDevices);
    let listener = async () => {
      let devices = await navigator.mediaDevices.enumerateDevices();
      setDevices(devices);
    };
    navigator.mediaDevices.addEventListener("devicechange", listener);
    return () =>
      navigator.mediaDevices.removeEventListener("devicechange", listener);
  }, []);
  return devices;
};
