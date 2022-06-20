import { Client, query as q, values } from "faunadb";
import { FunctionDefinition } from "backend/fauna/types";
import { CreateFileUpload } from "../file_uploads_collection";
import { getSessionByIdFunctionName } from "./get_session_by_id";
export const CreateFileUploadFunctionName = "create_file_upload";

type Args = {
  createdAt: string;
  hash: string;
  token: string;
  space: string;
};

export const createFileUpload = (c: Client, args: Args) =>
  c.query(q.Call(q.Function(CreateFileUploadFunctionName), args)) as Promise<
    | {
        success: false;
      }
    | { success: true; data: values.Ref }
  >;

const definition: FunctionDefinition = {
  name: CreateFileUploadFunctionName,
  role: "server",
  body: q.Query(
    q.Lambda((a) => {
      let args = (value: keyof Args) => q.Select(value, a);
      return q.Let(
        {
          session: q.Call(q.Function(getSessionByIdFunctionName), {
            id: args("token"),
          }),
        },
        q.If(
          q.IsNull(q.Var("user")),
          { success: false },
          {
            success: true,
            data: q.Select(
              "ref",
              CreateFileUpload({
                hash: args("hash"),
                user: q.Select("user", q.Var("session")),
                createdAt: args("createdAt"),
                space: args("space"),
              })
            ),
          }
        )
      );
    })
  ),
};

export default q.CreateFunction(definition);
