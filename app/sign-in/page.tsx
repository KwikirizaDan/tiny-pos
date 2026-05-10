import { LoginForm } from "@/components/login-form";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}