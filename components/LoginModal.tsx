import { useAuth } from "hooks/useAuth";
import React, { useEffect, useState } from "react";
import { ButtonLink, ButtonPrimary, ButtonTertiary } from "./Buttons";
import { Modal } from "./Layout";

export const LogInModal = (props: { isOpen: boolean; onClose: () => void }) => {
  let [data, setData] = useState({
    username: "",
    password: "",
  });
  let [status, setStatus] = useState<"normal" | "incorrect">("normal");
  useEffect(() => {
    setStatus("normal");
  }, [data.username, data.password]);

  let { login } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let result = await login(data);
    if (!result.success) setStatus("incorrect");
  };

  return (
    <Modal open={props.isOpen} onClose={props.onClose}>
      <form className="grid gap-4 w-full" onSubmit={onSubmit}>
        {status === "normal" ? null : (
          <div className="text-accent-red">
            Your username or password is incorrect
          </div>
        )}
        <label className="grid grid-flow-rows gap-2 font-bold">
          Username
          <input
            className="w-[100%]]"
            type="text"
            value={data.username}
            onChange={(e) =>
              setData({ ...data, username: e.currentTarget.value })
            }
          />
        </label>
        <label className="grid grid-flow-rows gap-2 font-bold">
          Password
          <input
            type="password"
            value={data.password}
            onChange={(e) =>
              setData({ ...data, password: e.currentTarget.value })
            }
          />
        </label>

        <div className={`grid grid-cols-[max-content_auto_max-content] gap-4`}>
          <ButtonTertiary content="Nevermind" onClick={() => props.onClose()} />
          <ButtonPrimary type="submit" content="Log In!" />
        </div>
      </form>
    </Modal>
  );
};
