import { Client, query as q } from "faunadb";
import { FileUploadsCollectionName } from "../file_uploads/file_uploads_collection";
import { getSessionByIdFunctionName } from "./get_session_by_id";

export const deleteFileUploadFunctionName = "delete_file_upload";

type Args = { id: string; token: string };
export const deleteFileUpload = (c: Client, args: Args) =>
  c.query(
    q.Call(q.Function(deleteFileUploadFunctionName), args)
  ) as Promise<void>;

export default q.CreateFunction({
  name: deleteFileUploadFunctionName,
  role: "server",
  body: q.Query(
    q.Lambda((a) => {
      let args = (value: keyof Args) => q.Select(value, a);
      let ref = q.Ref(q.Collection(FileUploadsCollectionName), args("id"));
      return q.Let(
        {
          user: q.Call(q.Function(getSessionByIdFunctionName), {
            id: args("token"),
          }),
        },
        q.If(
          q.IsNull(q.Var("user")),
          { success: false },
          q.If(
            q.Exists(ref),
            q.Update(ref, { data: { deleted: true, deletedAt: q.Now() } }),
            null
          )
        )
      );
    })
  ),
});
