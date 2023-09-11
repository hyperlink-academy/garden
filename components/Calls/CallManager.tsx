import { useState } from "react";
import { RadioGroup } from "@headlessui/react";
import { useDevices } from "@daily-co/daily-react";

export const MediaDeviceSettings = (props: { onSelect: () => void }) => {
  let {
    setMicrophone,
    setSpeaker,
    currentMic,
    microphones,
    speakers,
    currentSpeaker,
  } = useDevices();
  let [view, setView] = useState<"microphone" | "speakers">("microphone");
  let devices = view === "microphone" ? microphones : speakers;
  let currentDevice = view === "microphone" ? currentMic : currentSpeaker;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-2">
        <button
          className={`${
            view === "microphone" ? "text-accent-blue underline" : ""
          } hover:underline`}
          onClick={() => setView("microphone")}
        >
          microphone
        </button>
        <button
          className={`${
            view === "speakers" ? "text-accent-blue underline" : ""
          } hover:underline`}
          onClick={() => setView("speakers")}
        >
          speaker
        </button>
      </div>
      <RadioGroup
        className="flex flex-col gap-2 rounded-lg border border-grey-80 p-2 text-grey-35"
        value={currentDevice?.device.deviceId}
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
                      className={`mt-0.5 h-4 w-4 rounded-full ${
                        checked ? "border-2 border-accent-blue" : "border"
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
