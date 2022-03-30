import { Bindings } from "backend";

export class SpaceDurableObject implements DurableObject {
  constructor(
    private readonly state: DurableObjectState,
    private readonly env: Bindings
  ) {}
  async fetch(_request: Request) {
    return new Response("hello world");
  }
}
