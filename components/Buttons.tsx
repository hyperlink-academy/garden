type ButtonProps = JSX.IntrinsicElements["button"];
export function ButtonPrimary(
  props: {
    content: string;
    icon?: React.ReactElement;
  } & ButtonProps
) {
  return (
    <button
      {...props}
      {...{ content: undefined, icon: undefined }}
      className="p-2 m-0 text-white font-bold
bg-accent-blue border rounded-md border-accent-blue flex justify-center
items-center gap-4 max-w-max hover:text-accent-blue hover:bg-bg-blue active:text-white
active:bg-accent-blue  disabled:bg-grey-35 disabled:border-grey-35 disabled:hover:text-white"
    >
      {props.icon ? <span className="">{props.icon}</span> : null}
      <span className="">{props.content}</span>
    </button>
  );
}

export function ButtonSecondary(
  props: {
    content: string;
    icon?: React.ReactElement;
  } & ButtonProps
) {
  return (
    <button
      {...props}
      {...{ content: undefined, icon: undefined }}
      className="p-2 m-0 text-accent-blue
font-bold bg-white border rounded-md border-accent-blue flex justify-center
items-center gap-4 max-w-max hover:bg-bg-blue active:text-white active:bg-accent-blue disabled:border-grey-35 disabled:bg-white disabled:text-grey-35"
    >
      {props.icon ? <span className="">{props.icon}</span> : null}
      <span className="">{props.content}</span>
    </button>
  );
}

export function ButtonTertiary(
  props: {
    content: string;
    icon?: React.ReactElement;
  } & ButtonProps
) {
  return (
    <button
      {...props}
      {...{ content: undefined, icon: undefined }}
      className="p-2 m-0 text-grey-35
  bg-white border rounded-md border-grey-55 flex justify-center items-center
  gap-4 max-w-max hover:text-accent-blue hover:bg-bg-blue active:text-white
  active:bg-accent-blue disabled:border-grey-35 disabled:bg-white disabled:text-grey-35"
    >
      {props.icon ? <span className="">{props.icon}</span> : null}
      <span className="">{props.content}</span>
    </button>
  );
}

export function ButtonLink(
  props: {
    content: string;
    icon?: React.ReactElement;
  } & ButtonProps
) {
  return (
    <button
      {...props}
      {...{ content: undefined, icon: undefined }}
      className="m-0 text-accent-blue font-bold flex
  justify-center items-center gap-4 max-w-max disabled:text-grey-35"
    >
      {props.icon ? <span className="">{props.icon}</span> : null}
      <span className="">{props.content}</span>
    </button>
  );
}
