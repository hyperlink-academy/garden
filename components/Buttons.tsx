type ButtonProps = Omit<JSX.IntrinsicElements["button"], "content">;
export function ButtonPrimary(
  props: {
    content?: string | React.ReactNode;
    icon?: React.ReactElement;
    destructive?: boolean;
  } & ButtonProps
) {
  return (
    <button
      {...props}
      {...{ content: undefined, icon: undefined }}
      className={`
      m-0  
      box-border flex w-max
      shrink-0 items-center
      justify-center gap-2
      rounded-md border px-2 
      py-1 font-bold 
      text-white

      outline-offset-[-2px] active:outline active:outline-2 disabled:border-grey-90 
      disabled:bg-grey-90 disabled:text-grey-80 disabled:hover:text-grey-80 
      ${
        props.destructive
          ? `
          border-accent-red
          bg-accent-red hover:bg-white hover:text-accent-red 
          active:bg-bg-red active:text-accent-red `
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
  } & ButtonProps
) {
  return (
    <button
      {...props}
      {...{ content: undefined, icon: undefined }}
      className={`
      m-0 flex w-max 
      items-center justify-center 
      gap-2
      rounded-md border border-accent-blue 
      bg-white px-2 py-1 font-bold 
      text-accent-blue       
      outline-offset-[-2px] hover:bg-bg-blue 
      hover:text-accent-blue active:bg-bg-blue active:text-accent-blue active:outline active:outline-2 
      disabled:border-grey-90 disabled:bg-grey-90 
      disabled:text-grey-80 disabled:hover:text-grey-80
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
  } & ButtonProps
) {
  return (
    <button
      {...props}
      {...{ content: undefined, icon: undefined }}
      className={`m-0 flex w-max
  items-center justify-center gap-2 rounded-md border border-grey-55 bg-white
  px-2 py-1 text-grey-35 hover:border-accent-blue hover:bg-bg-blue hover:text-accent-blue active:bg-accent-blue
  active:text-white disabled:border-grey-90 disabled:bg-white disabled:text-grey-80 disabled:hover:text-grey-80 ${props.className} `}
    >
      {props.icon ? <span className="">{props.icon}</span> : null}
      {props.content !== "" ? <span className="">{props.content}</span> : null}
    </button>
  );
}

export function ButtonLink(
  props: {
    content: string;
    onDark?: false | boolean;
    icon?: React.ReactElement;
  } & ButtonProps
) {
  return (
    <button
      {...props}
      {...{ content: undefined, icon: undefined }}
      className={`${props.className} m-0 ${
        props.onDark ? "text-white" : "text-accent-blue"
      } flex items-center justify-center gap-2 font-bold outline-none disabled:text-grey-80`}
    >
      {props.icon ? <span className="">{props.icon}</span> : null}
      {props.content ? <span className="">{props.content}</span> : null}
    </button>
  );
}
