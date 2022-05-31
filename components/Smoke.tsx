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
export const SmokeProvider: React.FC = (props) => {
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

const Smoke: React.FC<{ x: number; y: number }> = (props) => {
  return (
    <div className="toast">
      <style jsx>{`
        .toast {
          position: absolute;
          left: ${props.x}px;
          z-index: 20;
          border: 1px solid;
          border-radius: 64px;
          color: white;
          padding: 4px 8px;
          animation-name: fadeout;
          animation-duration: 2s;
          pointer-events: none;
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
