import { createContext, useContext, useState } from "react";

type Smoke = { position: { x: number; y: number }; text: string };
type Smokes = Array<Smoke & { key: string }>;
let SmokeContext = createContext({
  setState: (_f: (t: Smokes) => Smokes) => {},
});
export const useSmoker = () => {
  let { setState } = useContext(SmokeContext);
  return (toast: Smoke) => {
    let key = Date.now().toString();
    setState((toasts) => toasts.concat([{ ...toast, key }]));
    setTimeout(() => {
      setState((toasts) => toasts.filter((t) => t.key !== key));
    }, 2000);
  };
};
export const SmokeProvider: React.FC<React.PropsWithChildren<unknown>> = (props) => {
  let [state, setState] = useState<Smokes>([]);
  return (
    <SmokeContext.Provider value={{ setState }}>
      {props.children}
      {state.map((toast) => (
        <Smoke {...toast.position} key={toast.key}>
          {toast.text}
        </Smoke>
      ))}
    </SmokeContext.Provider>
  );
};

const Smoke: React.FC<React.PropsWithChildren<{ x: number; y: number }>> = (props) => {
  return (
    <div
      className={`smoke absolute z-20 rounded-full bg-accent-blue text-white py-1 px-2 pointer-events-none `}
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
