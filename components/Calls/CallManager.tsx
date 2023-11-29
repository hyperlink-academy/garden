import { useState } from "react";
import { RadioGroup } from "@headlessui/react";
import { useDevices } from "@daily-co/daily-react";
import { CloseLinedTiny } from "components/Icons";

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
    <div className="flex flex-col pt-2 text-sm">
      <div className="flex justify-between">
        <div className="-mb-[1px] flex flex-row gap-1">
          <button
            className={` rounded-t-md border border-grey-80 px-2 pt-0 ${
              view === "microphone"
                ? "z-10 border-b-bg-blue bg-bg-blue pb-0 font-bold text-accent-blue"
                : "-mb-2 pb-2"
            } `}
            onClick={() => setView("microphone")}
          >
            mic
          </button>
          <button
            className={` rounded-t-md border border-grey-80 px-2 pt-0 ${
              view === "speakers"
                ? "z-10 border-b-bg-blue bg-bg-blue pb-0 font-bold text-accent-blue"
                : ""
            } `}
            onClick={() => setView("speakers")}
          >
            speaker
          </button>
        </div>
        <button className="mr-1" onClick={() => props.onSelect()}>
          {" "}
          <CloseLinedTiny />
        </button>
      </div>
      <RadioGroup
        className={`flex flex-col gap-2 rounded-lg border border-grey-80 bg-bg-blue p-2 text-grey-35 ${
          view === "microphone" ? "rounded rounded-tl-none " : ""
        }`}
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
                        <div className="ml-[2px] mt-[2px] h-2 w-2 rounded-full bg-accent-blue" />
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
