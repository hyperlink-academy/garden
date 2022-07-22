import { query as q } from "faunadb";
import { IndexDefinition } from "../types";
import { FileUploadsCollectionName } from "./file_uploads_collection";

export const UploadsBySpaceIndexName = "file_uploads_by_space";
const Definition: IndexDefinition = {
  name: UploadsBySpaceIndexName,
  source: q.Collection(FileUploadsCollectionName),
  terms: [{ field: ["data", "space"] }],
  values: [],
};
export default q.CreateIndex(Definition);
