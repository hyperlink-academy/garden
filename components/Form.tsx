import { useState, createContext, useContext, useEffect } from "react";
import { ButtonPrimary } from "./Buttons";
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
  let valid = props.validate();
  useEffect(() => {
    if (!valid) setState("disabled");
    if (state === "disabled") setState("normal");
  }, [!valid]);

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
}) {
  let { state } = useContext(FormContext);
  return (
    <ButtonPrimary
      destructive={props.destructive}
      type="submit"
      disabled={state === "disabled"}
      content={state === "loading" ? <DotLoader /> : props.content}
    />
  );
}
