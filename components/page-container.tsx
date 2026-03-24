import { type ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <main
      className={`mx-auto w-full px-4 pb-24 pt-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </main>
  );
}
