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
        return;
      }
      key++;
      output.push(input.slice(lastTokenPosition, position));
      output.push(render(input.slice(position, end + endToken.length)));
      lastTokenPosition = end + endToken.length;
      position = end + endToken.length;
    }
  };
  while (position < input.length) {
    // bold
    matchPairedToken("**", "**", (content) => (
      <strong key={key}>{content}</strong>
    ));

    // italic
    matchPairedToken("*", "*", (content) => <em key={key}>{content}</em>);

    // highlight
    matchPairedToken("==", "==", (content) => (
      <span className="bg-bg-gold" key={key}>
        {content}
      </span>
    ));

    // strikethrough
    matchPairedToken("~~", "~~", (content) => (
      <span className="text-grey-55 line-through decoration-grey-80" key={key}>
        {content}
      </span>
    ));

    // inline code
    matchPairedToken("`", "`", (content) => (
      <span className="bg-grey-90" key={key}>
        {content}
      </span>
    ));

    // inline wiki-style card links
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
