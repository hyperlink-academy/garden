import { Bindings } from "backend";

declare global {
  function getMiniflareBindings(): Bindings;
  function getMiniflareDurableObjectStorage(
    id: DurableObjectId
  ): Promise<DurableObjectStorage>;
}

export {};
