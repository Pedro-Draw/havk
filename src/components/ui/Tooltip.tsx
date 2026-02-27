import { ReactNode } from "react";

export default function Tooltip({
  children,
  text,
}: {
  children: ReactNode;
  text: string;
}) {
  return (
    <div className="relative group inline-block">
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white">
        {text}
      </span>
    </div>
  );
}