"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export function UpdateSpaceNameURL(props: { display_name: string }) {
  let router = useRouter();
  let params = useParams<{
    studio: string;
    space: string;
    display_name: string;
  }>();

  useEffect(() => {
    if (!params) return;
    let display_name = decodeURIComponent(params.display_name);
    let new_display_name = props.display_name;

    if (display_name !== new_display_name) {
      router.replace(
        `/s/${params.studio}/s/${params.space}/${new_display_name}`
      );
    }
  }, [params, props.display_name]);
  return <></>;
}
