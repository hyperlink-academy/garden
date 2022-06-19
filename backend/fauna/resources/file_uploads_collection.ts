import { query as q, Expr, values } from "faunadb";

export const FileUploadsCollectionName = "file_uploads";
export type FileUpload = {
  hash: string;
  createdAt: string;
  user: values.Ref;
  space: string;
};

export const CreateFileUpload = (S: { [k in keyof FileUpload]: Expr }) =>
  q.Create(q.Collection(FileUploadsCollectionName), {
    data: S,
    ttl: q.TimeAdd(q.Now(), 7, "days"),
  });

export default q.CreateCollection({
  name: FileUploadsCollectionName,
});
