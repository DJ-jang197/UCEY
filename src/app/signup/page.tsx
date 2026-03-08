import Link from "next/link";
import SignupForm from "./components/SignupForm";
import SocialAuth from "@/app/login/components/SocialAuth";

export const metadata = {
  title: "Sign Up | UCEY",
  description: "Create your UCEY account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0b] relative overflow-hidden font-sans selection:bg-[#c8891e] selection:text-[#0d0d0b]">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[rgba(200,137,30,0.06)] rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[rgba(200,137,30,0.04)] rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3" />

      <div className="w-full max-w-[440px] px-6 py-12 relative z-10 flex flex-col items-center">
        
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block text-[#c8891e] text-3xl font-bold tracking-tight mb-2 hover:text-[#d9991e] transition-colors">
            UCEY
          </Link>
          <h1 className="text-[#e8d9c0] text-2xl font-semibold mb-1">
            Create an account
          </h1>
          <p className="text-[#7a6a52] text-sm">
            Please enter your details to sign up
          </p>
        </div>

        <div className="w-full bg-[#0d0d0b] backdrop-blur-sm relative z-20">
          {/* Main Form Box */}
          <SignupForm />

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-[#1e1e18]"></div>
            <span className="px-4 py-1 text-xs text-[#5a4e3c] bg-[#0d0d0b] uppercase tracking-widest font-medium">Or register with</span>
            <div className="flex-grow h-px bg-[#1e1e18]"></div>
          </div>

          <SocialAuth />
        </div>

        {/* Footer actions */}
        <div className="mt-8 text-center space-y-4 w-full">
          <p className="text-sm text-[#3d3428]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#c8891e] font-medium hover:text-[#d9991e] transition-colors">
              Log in
            </Link>
          </p>
          <p className="text-xs text-[#2e2820] mt-12">
            API: https://dev-gu8jzunz8mgxow8a.ca.auth0.com/api/v2/
          </p>
          <p className="text-xs text-[#2e2820] mt-12">
            &copy; {new Date().getFullYear()} UCEY. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
