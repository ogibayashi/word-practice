import type { PropsWithChildren } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

interface MainLayoutProps {
  className?: string;
}

export function MainLayout({ children, className = "" }: PropsWithChildren<MainLayoutProps>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={`flex-1 ${className}`}>{children}</main>
      <Footer />
    </div>
  );
}
