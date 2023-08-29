import { DailyParticipant } from "@daily-co/daily-js";
import { useContext, useEffect, useMemo, useState } from "react";
import { CallContext } from "./CallProvider";
import Router from "next/router";
import { ButtonSecondary } from "components/Buttons";
import { useMutations } from "hooks/useReplicache";
import { CloseFilledTiny, Settings, SettingsOutline } from "components/Icons";
import { RadioGroup } from "@headlessui/react";

export function CallManager(props: { roomID: string }) {
  let {
    call,
    devices,
    setInputDevices,
    joinCall,
    leaveCall,
    muted,
    setLocalAudio,
  } = useContext(CallContext);
  let { authorized } = useMutations();

  let [settingsOpen, setSettingsOpen] = useState(false);

  let [loading, setLoading] = useState(false);

  let inCall = call && call.id === props.roomID;

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
            await joinCall({ id: props.roomID });
            setLoading(false);
          }}
        >
          join call
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <div
              className={`w-full rounded-t-lg ${muted ? "bg-grey-55" : "bg-[#005B00]"
                } px-2 py-1 text-white`}
            >
              calling...
            </div>
            <div
              className={`flex w-full  flex-row justify-between gap-1 rounded-b-lg ${muted ? "bg-grey-80" : "bg-accent-green"
                } px-2 py-1 text-white`}
            >
              <button
                onClick={() => setLocalAudio(muted)}
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
                    if (inCall) return leaveCall();
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
  let { devices, setInputDevices, activeDevice } = useContext(CallContext);
  return (
    <RadioGroup
      className="rounded-lg border border-grey-80 p-2 text-grey-35"
      value={activeDevice?.deviceId}
      onChange={(deviceId) => {
        setInputDevices({ audioDeviceId: deviceId });
        props.onSelect();
      }}
    >
      {devices
        .filter((f) => f.kind === "audioinput")
        .map((d) => {
          return (
            <RadioGroup.Option value={d.deviceId}>
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
                    <div>{d.label}</div>
                  </button>
                );
              }}
            </RadioGroup.Option>
          );
        })}
    </RadioGroup>
  );
};
