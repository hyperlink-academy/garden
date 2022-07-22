import { query as q } from "faunadb";
import { IndexDefinition } from "../types";
import { FileUploadsCollectionName } from "./file_uploads_collection";

export const DeletedFileUploadsIndexName = "deleted_file_uploads";
const Definition: IndexDefinition = {
  name: DeletedFileUploadsIndexName,
  source: q.Collection(FileUploadsCollectionName),
  terms: [{ field: ["data", "deleted"] }],
  values: [],
};
export default q.CreateIndex(Definition);
