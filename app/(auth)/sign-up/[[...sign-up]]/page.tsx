import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp
        routing="hash"
        appearance={{
          variables: {
            colorPrimary: "#7c3aed",
          },
        }}
      />
    </div>
  );
}