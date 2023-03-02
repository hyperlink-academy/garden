export const parseLine = (input: string) => {
  let output: Array<string | React.ReactNode> = [];
  let lastTokenPosition = 0;
  let position = 0;

  let key = 0;
  const matchPairedToken = (
    token: string,
    render: (content: string) => React.ReactNode
  ) => {
    if (input.slice(position, position + token.length) === token) {
      let end = input.indexOf(token, position + token.length);
      if (end === -1) {
        end = input.length;
      }
      key++;
      output.push(input.slice(lastTokenPosition, position));
      output.push(render(input.slice(position, end + token.length)));
      lastTokenPosition = end + token.length;
      position = end + token.length;
    }
  };
  while (position < input.length) {
    matchPairedToken("**", (content) => <strong key={key}>{content}</strong>);
    matchPairedToken("__", (content) => <strong key={key}>{content}</strong>);
    matchPairedToken("*", (content) => <em key={key}>{content}</em>);
    matchPairedToken("_", (content) => <em key={key}>{content}</em>);
    position++;
  }
  output.push(input.slice(lastTokenPosition, position));
  output.push("\n");
  return output;
};
