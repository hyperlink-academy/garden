export function ButtonPrimary(props: { content: string; icon?: React.ReactElement }) {
  return (
	<button className="p-2 m-0 text-white font-bold bg-accent-blue border rounded-md border-accent-blue flex justify-center items-center gap-4 hover:text-accent-blue hover:bg-bg-blue active:text-white active:bg-accent-blue">
		{ props.icon ? <span className="">{props.icon}</span> : null}
		<span className="">{props.content}</span>
	</button>
  );
}

export function ButtonSecondary(props: { content: string; icon?: React.ReactElement }) {
	return (
	  <button className="p-2 m-0 text-accent-blue font-bold bg-white border rounded-md border-accent-blue flex justify-center items-center gap-4 hover:bg-bg-blue active:text-white active:bg-accent-blue">
		  { props.icon ? <span className="">{props.icon}</span> : null}
		  <span className="">{props.content}</span>
	  </button>
	);
  }
  
  export function ButtonTertiary(props: { content: string; icon?: React.ReactElement }) {
	return (
	  <button className="p-2 m-0 text-grey-35 bg-white border rounded-md border-grey-55 flex justify-center items-center gap-4 hover:text-accent-blue hover:bg-bg-blue active:text-white active:bg-accent-blue">
		  { props.icon ? <span className="">{props.icon}</span> : null}
		  <span className="">{props.content}</span>
	  </button>
	);
  }
  
  export function ButtonLink(props: { content: string; icon?: React.ReactElement }) {
	return (
	  <button className="m-0 text-accent-blue font-bold flex justify-center items-center gap-4">
		  { props.icon ? <span className="">{props.icon}</span> : null}
		  <span className="">{props.content}</span>
	  </button>
	);
  }
  