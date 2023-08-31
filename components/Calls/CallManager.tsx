import { useState } from "react";
import { useJoinCall } from "./CallProvider";
import { useMutations } from "hooks/useReplicache";
import { CloseFilledTiny, Member, SettingsOutline } from "components/Icons";
import { RadioGroup } from "@headlessui/react";
import {
  useDaily,
  useDevices,
  useLocalParticipant,
  useMeetingState,
  useParticipantCounts,
  useRoom,
} from "@daily-co/daily-react";

export function CallManager() {
  let joinCall = useJoinCall();
  let call = useDaily();
  let participantCounts = useParticipantCounts();
  let localPariticpant = useLocalParticipant();
  let { authorized } = useMutations();

  let [settingsOpen, setSettingsOpen] = useState(false);

  let [loading, setLoading] = useState(false);
  let meetingState = useMeetingState();

  let inCall = meetingState === "joined-meeting";
  let muted = localPariticpant?.tracks.audio.state !== "playable";

  if (!authorized) return null;
  return (
    <div className="w-full">
      {!inCall ? (
        <button
          className="w-full rounded-md bg-accent-green py-1 italic text-white"
          onClick={async (e) => {
            e.preventDefault();
            console.log({ loading, inCall });
            if (loading || inCall) return;
            setLoading(true);
            await joinCall();
            setLoading(false);
          }}
        >
          join call
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <div
              className={`flex w-full flex-row justify-between rounded-t-lg ${muted ? "bg-grey-55" : "bg-[#005B00]"
                } px-3 py-1.5 text-white`}
            >
              <div>calling...</div>
              <div className="flex flex-row gap-1">
                <Member />
                {participantCounts.present}
              </div>
            </div>
            <div
              className={`flex w-full  flex-row justify-between gap-1 rounded-b-lg ${muted ? "bg-grey-80" : "bg-accent-green"
                } px-3 py-1.5 text-white`}
            >
              <button
                onClick={() => call?.setLocalAudio(muted)}
                className={`${muted ? "bg-grey-55" : "bg-[#005B00]"
                  } rounded-md border border-white px-4 py-1`}
              >
                {muted ? "speak" : "mute"}
              </button>
              <div
                className={`flex flex-row gap-2 ${muted ? "text-grey-35" : ""}`}
              >
                <button onClick={() => setSettingsOpen((s) => !s)}>
                  <SettingsOutline height={32} width={32} />
                </button>
                <div className="w-[1px] border-l border-white" />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (inCall) return call?.leave();
                  }}
                >
                  <CloseFilledTiny height={24} width={24} />
                </button>
              </div>
            </div>
          </div>
          {settingsOpen && (
            <MediaDeviceSettings onSelect={() => setSettingsOpen(false)} />
          )}
        </div>
      )}
    </div>
  );
}

const MediaDeviceSettings = (props: { onSelect: () => void }) => {
  let { setMicrophone, setSpeaker, currentMic, microphones, speakers } =
    useDevices();
  let [view, setView] = useState<"microphone" | "speakers">("microphone");
  let devices = view === "microphone" ? microphones : speakers;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-2">
        <button
          className={`${view === "microphone" ? "text-accent-blue underline" : ""
            } hover:underline`}
          onClick={() => setView("microphone")}
        >
          microphone
        </button>
        <button
          className={`${view === "speakers" ? "text-accent-blue underline" : ""
            } hover:underline`}
          onClick={() => setView("speakers")}
        >
          speaker
        </button>
      </div>
      <RadioGroup
        className="flex flex-col gap-2 rounded-lg border border-grey-80 p-2 text-grey-35"
        value={currentMic?.device.deviceId}
        onChange={(deviceId) => {
          if (view === "microphone") setMicrophone(deviceId);
          else setSpeaker(deviceId);
          props.onSelect();
        }}
      >
        {devices.map((d) => {
          return (
            <RadioGroup.Option
              value={d.device.deviceId}
              key={d.device.deviceId}
            >
              {({ checked }) => {
                return (
                  <button className="grid grid-cols-[max-content,auto] gap-2 text-left text-sm">
                    <div
                      className={`mt-0.5 h-4 w-4 rounded-full ${checked ? "border-2 border-accent-blue" : "border"
                        }`}
                    >
                      {checked && (
                        <div className="mt-[2px] ml-[2px] h-2 w-2 rounded-full bg-accent-blue" />
                      )}
                    </div>
                    <div>{d.device.label}</div>
                  </button>
                );
              }}
            </RadioGroup.Option>
          );
        })}
      </RadioGroup>
    </div>
  );
};
