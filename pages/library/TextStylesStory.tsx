import { ComponentViewer, Props, Stories } from ".";
export { getStaticProps } from ".";

const TextStyleStory = (props: Props) => {
	return (
		<ComponentViewer components={props.components} stories={{}}>
			<h1>Header 1</h1>
			<h2>Header 2</h2>
			<h3>Header 3</h3>
			<h4>Header 4</h4>
			<p>base text</p>
			<small>small text</small>
			<p className="tiny">tiny text</p>
		</ComponentViewer>
	);
};

TextStyleStory.metadata = {
	name: "Text Styles",
};

export default TextStyleStory;
