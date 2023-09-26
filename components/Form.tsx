import { useState, createContext, useContext, useEffect } from "react";
import { ButtonPrimary, ButtonTertiary } from "./Buttons";
import { DotLoader } from "./DotLoader";

type State = "normal" | "loading" | "success" | "disabled";
let FormContext = createContext<{
  state: State;
}>({
  state: "normal",
});

export function Form<T>(props: {
  children: React.ReactNode;
  className?: string;
  validate: () => undefined | T;
  onSubmit: (data: T) => Promise<void>;
}) {
  let [state, setState] = useState<State>("normal");
  let invalid = !props.validate();
  useEffect(() => {
    if (invalid) setState("disabled");
    if (state === "disabled") setState("normal");
  }, [invalid]);

  return (
    <FormContext.Provider value={{ state }}>
      <form
        className={props.className}
        onSubmit={async (e) => {
          e.preventDefault();
          if (state !== "normal") return;
          let data = props.validate();
          if (!data) return;
          setState("loading");
          let result = await props.onSubmit(data);
          setState("success");
        }}
      >
        {props.children}
      </form>
    </FormContext.Provider>
  );
}

export function SubmitButton(props: {
  content: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onClose: () => void;
}) {
  let { state } = useContext(FormContext);
  return (
    <div className="mt-4 flex justify-end gap-2">
      <ButtonTertiary
        type="reset"
        onClick={() => props.onClose()}
        content="nevermind"
      />
      <ButtonPrimary
        destructive={props.destructive}
        type="submit"
        disabled={state === "disabled"}
        content={state === "loading" ? <DotLoader /> : props.content}
      />
    </div>
  );
}
