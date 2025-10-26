"use client";

import { FC, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import TechTags from "./TechTags";

export interface TechTagsClientProps {
  items: string[];
}

const TechTagsClient: FC<TechTagsClientProps> = ({ items }) => {
  const router = useRouter();
  const onTagClick = useCallback(
    (tag: string) => {
      router.push(`/search?tag=${encodeURIComponent(tag)}`);
    },
    [router],
  );
  return <TechTags items={items} onTagClick={onTagClick} />;
};

export default memo(TechTagsClient);
