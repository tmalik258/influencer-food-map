import { Suspense } from "react";
import LoginPage from "./_components/login-page";
import { LumaSpin } from "@/components/luma-spin";

const LoginPageWrapper = () => (
  <Suspense fallback={<div className="flex items-center justify-center h-full"><LumaSpin /></div>}>
    <LoginPage />
  </Suspense>
);

export default LoginPageWrapper;