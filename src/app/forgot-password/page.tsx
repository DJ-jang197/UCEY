import Link from "next/link";
import ForgotPasswordForm from "./components/ForgotPasswordForm";

export const metadata = {
  title: "Reset Password | ZonaViva",
  description: "Reset your ZonaViva account password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0b] relative overflow-hidden font-sans selection:bg-[#c8891e] selection:text-[#0d0d0b]">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[rgba(200,137,30,0.06)] rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[rgba(200,137,30,0.04)] rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3" />

      <div className="w-full max-w-[440px] px-6 py-12 relative z-10 flex flex-col items-center">
        
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block text-[#c8891e] text-3xl font-bold tracking-tight mb-2 hover:text-[#d9991e] transition-colors">
            ZonaViva
          </Link>
          <h1 className="text-[#e8d9c0] text-2xl font-semibold mb-1">
            Reset Password
          </h1>
          <p className="text-[#7a6a52] text-sm">
            Enter your email to receive a reset link
          </p>
        </div>

        <div className="w-full bg-[#0d0d0b] backdrop-blur-sm relative z-20">
          {/* Main Form Box */}
          <ForgotPasswordForm />
        </div>

        {/* Footer actions */}
        <div className="mt-8 text-center space-y-4 w-full">
          <p className="text-sm text-[#3d3428]">
            Remember your password?{" "}
            <Link href="/login" className="text-[#c8891e] font-medium hover:text-[#d9991e] transition-colors">
              Back to log in
            </Link>
          </p>
          <p className="text-xs text-[#2e2820] mt-12">
            API: https://dev-gu8jzunz8mgxow8a.ca.auth0.com/api/v2/
          </p>
          <p className="text-xs text-[#2e2820] mt-12">
            &copy; {new Date().getFullYear()} ZonaViva. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
