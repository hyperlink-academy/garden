export const FloatingContainer: React.FC<{ className?: string }> = (props) => {
  return (
    <div
      className={`
        px-3 py-4
        border border-grey-80 rounded-md 
        shadow-drop
        bg-white
        ${props.className}
        `}
    >
      {props.children}
    </div>
  );
};
