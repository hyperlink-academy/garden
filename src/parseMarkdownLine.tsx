export const parseLine = (
  input: string,
  config: { openLink: (name: string) => void; renderLinks?: boolean }
) => {
  let output: Array<string | React.ReactNode> = [];
  let lastTokenPosition = 0;
  let position = 0;

  let key = 0;
  const matchPairedToken = (
    startToken: string,
    endToken: string,
    render: (content: string) => React.ReactNode
  ) => {
    if (input.slice(position, position + startToken.length) === startToken) {
      let end = input.indexOf(endToken, position + endToken.length);
      if (end === -1) {
        end = input.length;
      }
      key++;
      output.push(input.slice(lastTokenPosition, position));
      output.push(render(input.slice(position, end + endToken.length)));
      lastTokenPosition = end + endToken.length;
      position = end + endToken.length;
    }
  };
  while (position < input.length) {
    matchPairedToken("**", "**", (content) => (
      <strong key={key}>{content}</strong>
    ));
    matchPairedToken("*", "*", (content) => <em key={key}>{content}</em>);
    if (config.renderLinks)
      matchPairedToken("[[", "]]", (content) =>
        content === "[[]]" ? (
          content
        ) : (
          <span
            role="link"
            key={key}
            className="inline text-accent-blue hover:cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              config.openLink(content);
            }}
          >
            {content}
          </span>
        )
      );
    position++;
  }
  output.push(input.slice(lastTokenPosition, position));
  output.push("\n");
  return output;
};
