import * as Icons from "components/Icons";

export default function IconsPage() {
  return (
    <div className="grid grid-cols-2 gap-16 sm:grid-cols-3 md:grid-cols-4">
      {Object.values(Icons).map((Icon, index) => (
        <div key={index} className="flex flex-col gap-2">
          <svg key={index} width="32" height="32">
            <title>{Icon.name}</title>
            <Icon key={index} />
          </svg>
          <p className="text-sm text-grey-55">{Icon.name}</p>
        </div>
      ))}
    </div>
  );
}
