import { animated, useTransition } from "@react-spring/web";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { CloseLinedTiny } from "./Icons";

type Toast = {
  text: string;
  type: "info" | "error" | "success";
  icon?: React.ReactNode;
};

type Smoke = {
  position: { x: number; y: number };
  text: string;
  error?: boolean;
};

type Smokes = Array<Smoke & { key: string }>;

let SmokeContext = createContext({
  setSmokeState: (_f: (t: Smokes) => Smokes) => {},
  setToastState: (_t: Toast | null) => {},
});

export const useSmoker = () => {
  let { setSmokeState: setState } = useContext(SmokeContext);
  return (smoke: Smoke) => {
    let key = Date.now().toString();
    setState((smokes) => smokes.concat([{ ...smoke, key }]));
    setTimeout(() => {
      setState((smokes) => smokes.filter((t) => t.key !== key));
    }, 2000);
  };
};
export const useToaster = () => {
  let { setToastState: toaster } = useContext(SmokeContext);
  return toaster;
};
export const SmokeProvider: React.FC<React.PropsWithChildren<unknown>> = (
  props
) => {
  let [state, setState] = useState<Smokes>([]);
  let [toastState, setToastState] = useState<Toast | null>(null);
  let toastTimeout = useRef<number | null>(null);
  let toaster = useCallback(
    (toast: Toast | null) => {
      if (toastTimeout.current) {
        window.clearTimeout(toastTimeout.current);
        toastTimeout.current = null;
      }
      setToastState(toast);
      toastTimeout.current = window.setTimeout(() => {
        setToastState(null);
      }, 2000);
    },
    [setToastState]
  );
  return (
    <SmokeContext.Provider
      value={{ setSmokeState: setState, setToastState: toaster }}
    >
      {props.children}
      {state.map((toast) => (
        <Smoke {...toast.position} error={toast.error} key={toast.key}>
          {toast.text}
        </Smoke>
      ))}
      <Toast toast={toastState} setToast={setToastState} />
    </SmokeContext.Provider>
  );
};

const Toast = (props: {
  toast: Toast | null;
  setToast: (t: Toast | null) => void;
}) => {
  console.log(props.toast);
  let transitions = useTransition(props.toast ? [props.toast] : [], {
    from: { bottom: -32 },
    enter: { bottom: 38 },
    leave: { bottom: -32 },
    trail: 250,
    config: {
      mass: 8,
      friction: 150,
      tension: 2000,
    },
  });

  return transitions((style, item) => {
    return item ? (
      <animated.div
        style={style}
        className={`fixed bottom-0 left-0 right-0 z-50 h-4 w-full`}
      >
        <div
          className={`mx-3 flex max-w-7xl flex-row gap-2 rounded-full border px-3 py-1 text-center italic sm:mx-4 ${
            props.toast?.type === "error"
              ? "bg-accent-red text-white"
              : props.toast?.type === "success"
              ? "bg-accent-green text-white"
              : "border border-grey-80 bg-bg-blue  text-grey-55"
          }`}
        >
          <div className="flex grow justify-center font-bold">
            <div className="flex gap-2">
              {item.icon} {item.text}
            </div>
          </div>
          <button
            className="shrink-0"
            onClick={() => {
              props.setToast(null);
            }}
          >
            <CloseLinedTiny />
          </button>
        </div>
      </animated.div>
    ) : null;
  });
};

const Smoke: React.FC<
  React.PropsWithChildren<{ x: number; y: number; error?: boolean }>
> = (props) => {
  return (
    <div
      className={`smoke pointer-events-none absolute z-50 rounded-full px-2 py-1 text-sm  ${
        props.error
          ? "border border-accent-red bg-white text-accent-red"
          : "bg-accent-blue text-white"
      }`}
    >
      <style jsx>{`
        .smoke {
          left: ${props.x}px;
          animation-name: fadeout;
          animation-duration: 2s;
        }

        @keyframes fadeout {
          from {
            top: ${props.y - 20}px;
            opacity: 100%;
          }

          to {
            top: ${props.y - 60}px;
            opacity: 0%;
          }
        }
      `}</style>
      {props.children}
    </div>
  );
};
