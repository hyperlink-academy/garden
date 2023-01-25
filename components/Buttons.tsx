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
      py-1 px-2 m-0 
      box-border
      text-white font-bold
      ${
        props.destructive
          ? `
          hover:text-accent-red hover:bg-white
          bg-accent-red border-accent-red
          active:text-accent-red active:bg-bg-red `
          : `
          hover:text-accent-blue hover:bg-bg-blue 
          bg-accent-blue border-accent-blue
          active:text-accent-blue active:bg-bg-blue 
          `
      }
      border rounded-md  
      flex justify-center items-center gap-2 
      w-max
      active:outline outline-offset-[-2px] active:outline-2 
      disabled:bg-grey-90 disabled:border-grey-90 
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
      py-1 px-2 m-0 
      text-accent-blue font-bold 
      bg-white
      border rounded-md border-accent-blue 
      flex justify-center items-center gap-2 
      w-max       
      hover:text-accent-blue hover:bg-bg-blue 
      active:text-accent-blue active:bg-bg-blue active:outline outline-offset-[-2px] active:outline-2 
      disabled:bg-grey-90 disabled:border-grey-90 
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
      } font-bold flex
  justify-center items-center gap-2 w-max disabled:text-grey-80`}
    >
      {props.icon ? <span className="">{props.icon}</span> : null}
      <span className="">{props.content}</span>
    </button>
  );
}
