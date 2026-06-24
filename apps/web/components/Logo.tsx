"use client";

import { useState } from "react";
import { getLogoUrl } from "@/lib/utils";

interface LogoProps {
  name: string;
  className?: string;
}

export function Logo({ name, className = "" }: LogoProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <img
        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
          name
        )}&background=random&color=fff&rounded=true&bold=true`}
        alt={name}
        className={className}
      />
    );
  }

  return (
    <img
      src={getLogoUrl(name)}
      alt={name}
      className={className}
      onError={() => setError(true)}
    />
  );
}
