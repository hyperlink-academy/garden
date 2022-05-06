import { query as q } from "faunadb";
import { RoleDefinition } from "../types";
import { CreateIdentityFunctionName } from "./functions/create_identity";
import { CreateSessionFunctionName } from "./functions/create_new_session";
import { deleteSessionFunctionName } from "./functions/delete_session";
import { getIdentityByUsernameFunctionName } from "./functions/get_identity_by_username";
import { getSessionByIdFunctionName } from "./functions/get_session_by_id";
import { ValidateNewIdentityFunctionName } from "./functions/validate_new_identity";
import { getSignupTokenFunctionName } from "./functions/get_signup_token";
import {
  getPhysicalCardById,
  getPhysicalCardByIdFunctionName,
} from "./functions/get_physical_card_by_id";
import { CreatePhysicalCardFunctionName } from "./functions/create_physical_card";

const Functions = [
  deleteSessionFunctionName,
  getSignupTokenFunctionName,
  getSessionByIdFunctionName,
  getIdentityByUsernameFunctionName,
  CreateSessionFunctionName,
  CreateIdentityFunctionName,
  ValidateNewIdentityFunctionName,
  getPhysicalCardByIdFunctionName,
  CreatePhysicalCardFunctionName,
];
const definition: RoleDefinition = {
  name: "server_role",
  privileges: Functions.map((f) => {
    return {
      resource: q.Function(f),
      actions: { call: true },
    };
  }),
};
export default q.CreateRole(definition);
