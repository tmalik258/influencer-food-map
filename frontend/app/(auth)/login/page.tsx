import { Suspense } from "react";
import LoginPage from "./_components/login-page";
import { DashedSpinner } from "@/components/dashed-spinner";

const LoginPageWrapper = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center h-full">
        <DashedSpinner />
      </div>
    }
  >
    <LoginPage />
  </Suspense>
);

export default LoginPageWrapper;
