import * as Icons from "components/Icons";

export default function IconsPage() {
  return (
    <div className="flex flex-wrap gap-4 p-4">
      {Object.values(Icons).map((Icon, index) => (
        <svg width="64" height="64">
          <title>{Icon.name}</title>
          <Icon key={index} />
        </svg>
      ))}
    </div>
  );
}
