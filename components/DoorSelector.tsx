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
    <div className="w-full flex flex-col gap-0">
      <p className="font-bold">Set the Scenery</p>
      <div className="grid grid-cols-[repeat(auto-fill,96px)] gap-0">
        {doorImages.map((f) => {
          return (
            <button
              onClick={() => {
                props.onSelect(f);
              }}
            >
              <img
                className={`-scale-x-100 ${
                  props.selected === f ? "" : "opacity-50"
                }`}
                src={f}
                width={96}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
