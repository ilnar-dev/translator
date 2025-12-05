import * as React from "react";
import { cn } from "@/utils/cn";

type ContainerProps = React.HTMLAttributes<HTMLDivElement>;

export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-6 md:px-8", className)}
      {...props}
    />
  );
}



