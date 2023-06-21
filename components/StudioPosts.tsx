import { useAuth } from "hooks/useAuth";
import { useStudioData } from "hooks/useStudioData";
import { Textarea } from "./Textarea";

export function StudioPosts(props: { id: string }) {
  let { data } = useStudioData(props.id);
  let { session } = useAuth();
  return (
    <div>
      {data?.members_in_studios.find((m) => m.member === session?.user?.id) && (
        <div className="flex h-10 rounded-md border border-dotted">
          <Textarea />
        </div>
      )}
    </div>
  );
}
