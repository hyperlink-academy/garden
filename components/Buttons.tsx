type ButtonProps = JSX.IntrinsicElements["button"];
export function ButtonPrimary(
  props: {
    content: string | React.ReactElement;
    icon?: React.ReactElement;
    destructive?: boolean;
  } & ButtonProps
) {
  return (
    <button
      {...props}
      {...{ content: undefined, icon: undefined }}
      className={`
      m-0 box-border py-1 
      px-2
      font-bold text-white
      ${
        props.destructive
          ? `
          active:bg-bg-red border-accent-red
          bg-accent-red hover:bg-white
          hover:text-accent-red active:text-accent-red `
          : `
          border-accent-blue bg-accent-blue 
          hover:bg-bg-blue hover:text-accent-blue
          active:bg-bg-blue active:text-accent-blue 
          `
      }
      flex w-max  
      items-center justify-center gap-2 rounded-md 
      border
      outline-offset-[-2px] active:outline active:outline-2 
      disabled:border-grey-90 disabled:bg-grey-90 
      disabled:text-grey-80 disabled:hover:text-grey-80
      `}
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
      className={`
      m-0 flex w-max 
      items-center justify-center 
      gap-2
      rounded-md border border-accent-blue 
      bg-white py-1 px-2 font-bold 
      text-accent-blue       
      outline-offset-[-2px] hover:bg-bg-blue 
      hover:text-accent-blue active:bg-bg-blue active:text-accent-blue active:outline active:outline-2 
      disabled:border-grey-90 disabled:bg-grey-90 
      disabled:text-grey-80 disabled:hover:text-grey-80`}
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
      className="m-0 flex w-max
  items-center justify-center gap-2 rounded-md border border-grey-55 bg-white
  p-2 text-grey-35 hover:bg-bg-blue hover:text-accent-blue active:bg-accent-blue
  active:text-white disabled:border-grey-90 disabled:bg-white disabled:text-grey-80 disabled:hover:text-grey-80"
    >
      {props.icon ? <span className="">{props.icon}</span> : null}
      <span className="">{props.content}</span>
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
      } flex items-center justify-center gap-2 font-bold disabled:text-grey-80`}
    >
      {props.icon ? <span className="">{props.icon}</span> : null}
      <span className="">{props.content}</span>
    </button>
  );
}
