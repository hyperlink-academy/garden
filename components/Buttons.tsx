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
items-center gap-2 w-max hover:text-accent-blue hover:bg-bg-blue active:text-white
active:bg-accent-blue  disabled:bg-grey-90 disabled:border-grey-90 disabled:text-grey-80 disabled:hover:text-grey-80"
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
items-center gap-2 w-max hover:bg-bg-blue active:text-white active:bg-accent-blue disabled:bg-grey-90 disabled:border-grey-80 disabled:text-grey-80 disabled:hover:text-grey-80"
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
  gap-2 w-max hover:text-accent-blue hover:bg-bg-blue active:text-white
  active:bg-accent-blue disabled:bg-white disabled:border-grey-90 disabled:text-grey-80 disabled:hover:text-grey-80"
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
  justify-center items-center gap-2 w-max disabled:text-grey-80"
    >
      {props.icon ? <span className="">{props.icon}</span> : null}
      <span className="">{props.content}</span>
    </button>
  );
}
