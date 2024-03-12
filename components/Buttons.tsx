type ButtonProps = Omit<JSX.IntrinsicElements["button"], "content">;
export function ButtonPrimary(
  props: {
    content?: string | React.ReactNode;
    icon?: React.ReactElement;
    destructive?: boolean;
    small?: boolean;
  } & ButtonProps
) {
  return (
    <button
      {...props}
      {...{ content: undefined, icon: undefined }}
      className={`
      disabled:border-grey-90
      disabled:bg-grey-90 disabled:text-grey-80 disabled:hover:text-grey-80
      m-0 box-border
      flex w-max
      shrink-0 items-center justify-center
      gap-2
      rounded-md
      border px-2 font-bold text-white
      outline-offset-[-2px] active:outline active:outline-2
      ${props.small ? "py-0.5 text-sm" : "py-1 text-base"}
      ${
        props.destructive
          ? `
          border-accent-red
          bg-accent-red hover:text-accent-red active:bg-bg-red
          active:text-accent-red hover:bg-white `
          : `
          border-accent-blue
          bg-accent-blue hover:bg-bg-blue hover:text-accent-blue
          active:bg-bg-blue active:text-accent-blue

          `
      }
      ${props.className}

      `}
    >
      {props.icon ? <span className="">{props.icon}</span> : null}
      {props.content ? <span className="">{props.content}</span> : null}
    </button>
  );
}

export function ButtonSecondary(
  props: {
    content?: React.ReactNode;
    icon?: React.ReactElement;
    small?: boolean;
  } & ButtonProps
) {
  return (
    <button
      {...props}
      {...{ content: undefined, icon: undefined }}
      className={`
      border-accent-blue text-accent-blue hover:bg-bg-blue
      hover:text-accent-blue active:bg-bg-blue
      active:text-accent-blue
      disabled:border-grey-90 disabled:bg-grey-90 disabled:text-grey-80
      disabled:hover:text-grey-80 m-0 flex w-max
      items-center
      justify-center gap-2
      rounded-md border bg-white px-2
      font-bold outline-offset-[-2px]
      active:outline active:outline-2
      ${props.small ? "py-0.5 text-sm" : "py-1 text-base"}

      ${props.className}`}
    >
      {props.icon ? <span className="">{props.icon}</span> : null}
      {props.content ? <span className="">{props.content}</span> : null}
    </button>
  );
}

export function ButtonTertiary(
  props: {
    content: React.ReactNode;
    icon?: React.ReactElement;
    small?: boolean;
  } & ButtonProps
) {
  return (
    <button
      {...props}
      {...{ content: undefined, icon: undefined }}
      className={`border-grey-55 text-grey-35 hover:border-accent-blue
  hover:bg-bg-blue hover:text-accent-blue active:bg-accent-blue disabled:border-grey-90 disabled:text-grey-80 disabled:hover:text-grey-80 m-0
  flex w-max items-center justify-center gap-2 rounded-md border
  bg-white px-2  active:text-white disabled:bg-white ${
    props.small ? "py-0.5 text-sm" : "py-1 text-base"
  }
${props.className} `}
    >
      {props.icon ? <span className="">{props.icon}</span> : null}
      {props.content !== "" ? <span className="">{props.content}</span> : null}
    </button>
  );
}

export function ButtonLink(
  props: {
    small?: boolean;
    content: string | React.ReactNode;
    onDark?: false | boolean;
    icon?: React.ReactElement;
  } & ButtonProps
) {
  return (
    <button
      {...props}
      {...{ content: undefined, icon: undefined }}
      className={`disabled:text-grey-80 m-0 flex items-center justify-center gap-2 font-bold outline-none
      ${props.className} ${props.onDark ? "text-white" : "text-accent-blue"} ${
        props.small ? "text-sm" : "text-base"
      }`}
    >
      {props.icon ? <span className="">{props.icon}</span> : null}
      {props.content ? <span className="">{props.content}</span> : null}
    </button>
  );
}
