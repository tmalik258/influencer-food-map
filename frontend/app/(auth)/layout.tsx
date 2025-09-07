import type React from "react";
import Image from "next/image";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen">
      <div className="min-h-[calc(100vh-5.05em)] flex items-center justify-center max-md:bg-sky-ice">
        <div className="w-full lg:w-2/6 p-4 md:p-10 md:bg-white rounded-md shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;