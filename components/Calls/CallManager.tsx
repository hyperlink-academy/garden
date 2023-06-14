import { DailyParticipant } from "@daily-co/daily-js";
import { useContext, useEffect, useMemo, useState } from "react";
import { CallContext } from "./CallProvider";
import Router from "next/router";
import { ButtonSecondary } from "components/Buttons";
import { useMutations } from "hooks/useReplicache";

export function CallManager(props: { roomID: string }) {
  let { call, devices, setInputDevices, joinCall, leaveCall } =
    useContext(CallContext);
  let { authorized } = useMutations();

  let [loading, setLoading] = useState(false);

  let inCall = call && call.id === props.roomID;

  if (!authorized) return null;
  return (
    <div className="w-full">
      {!inCall ? (
        <ButtonSecondary
          content="Join Call"
          onClick={async (e) => {
            e.preventDefault();
            console.log({ loading, inCall });
            if (loading || inCall) return;
            setLoading(true);
            await joinCall({ id: props.roomID });
            setLoading(false);
          }}
        />
      ) : (
        <div>
          <ButtonSecondary
            content="Leave Call"
            onClick={(e) => {
              e.preventDefault();
              if (inCall) return leaveCall();
            }}
          />
          <div>
            <label className=" text-textOnDark" htmlFor="choose mic">
              Set Mic
            </label>
            <MediaDeviceList
              devices={devices.filter((f) => f.kind === "audioinput")}
              onChange={(d) => setInputDevices({ audioDeviceId: d })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const MediaDeviceList = (props: {
  devices: MediaDeviceInfo[];
  onChange: (v: string) => void;
}) => {
  return (
    <select
      className="interactive text-textOnDark bg-transparent bg-none font-bold focus:outline-none"
      style={{ maxWidth: "64px" }}
      name="choose mic"
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        props.onChange(e.currentTarget.value);
      }}
    >
      {props.devices.map((d) => (
        <option
          value={d.deviceId}
          key={d.deviceId}
          className="text-textPrimary"
        >
          {d.label}
        </option>
      ))}
    </select>
  );
};
