import { Client, query as q } from "faunadb";
import { UploadsBySpaceIndexName } from "../uploads_by_space_index";
import { getSessionByIdFunctionName } from "./get_session_by_id";

export const deleteFileUploadsBySpaceFunctionName =
  "delete_file_upload_by_space";
type Args = { spaceID: string; token: string };
export const deleteFileUploadBySpace = (c: Client, args: Args) =>
  c.query(
    q.Call(q.Function(deleteFileUploadsBySpaceFunctionName), args)
  ) as Promise<void>;

export default q.CreateFunction({
  name: deleteFileUploadsBySpaceFunctionName,
  role: "server",
  body: q.Query(
    q.Lambda((a) => {
      let args = (value: keyof Args) => q.Select(value, a);
      return q.Let(
        {
          user: q.Call(q.Function(getSessionByIdFunctionName), {
            id: args("token"),
          }),
          files: q.Select(
            "data",
            q.Paginate(
              q.Match(q.Index(UploadsBySpaceIndexName), args("spaceID"))
            )
          ),
        },
        q.If(
          q.IsNull(q.Var("user")),
          { success: false },
          q.Foreach(
            q.Var("files"),
            q.Lambda((f) =>
              q.Update(f, { data: { deleted: true, deletedAt: q.Now() } })
            )
          )
        )
      );
    })
  ),
});
