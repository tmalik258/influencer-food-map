"use client";

import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";
import { LoginForm } from "./login-form";

const LoginPage = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      // Decode the error message
      const decodedError = decodeURIComponent(error);
      console.error("Login error:", decodedError);
      toast.error(`${decodedError}`);
    }
  }, [error]);

  return <LoginForm />;
};

export default LoginPage;
