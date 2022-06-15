let doorImages: string[] = [
  "/doors/door-clouds-256.jpg",
  "/doors/door-chicken-256.jpg",
  "/doors/door-field-256.jpg",
  "/doors/door-windowseat-256.jpg",
];

export const DoorSelector = (props: {
  onSelect: (s: string) => void;
  selected?: string;
}) => {
  return (
    <div>
      <p>Select the Scenery</p>
      {doorImages.map((f) => {
        return (
          <button
            onClick={() => {
              props.onSelect(f);
            }}
          >
            <img
              className={`-scale-x-100 ${
                props.selected === f ? "" : "opacity-30"
              }`}
              src={f}
              width={64}
            />
          </button>
        );
      })}
    </div>
  );
};
