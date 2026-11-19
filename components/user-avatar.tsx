"use client";

import { useState } from "react";
import Image from "next/image";

export function UserAvatar({
  name,
  image,
  className,
}: {
  name?: string | null;
  image?: string | null;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`h-9 w-9 shrink-0 rounded-full overflow-hidden bg-amber-500/20 border border-amber-500/40 flex items-center justify-center ${className ?? ""}`}
    >
      {image && !imgError ? (
        <Image
          src={image}
          alt={name || "User avatar"}
          width={36}
          height={36}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-sm font-semibold uppercase text-gray-900 dark:text-white">
          {name?.charAt(0) || "?"}
        </span>
      )}
    </div>
  );
}
