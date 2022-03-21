export default {
  fetch: handleRequest,
};

async function handleRequest(_request: Request) {
  return new Response("hello world");
}
