import Link from "next/link";
import LoginForm from "./components/LoginForm";
import SocialAuth from "./components/SocialAuth";
import LoonCharacter from "./components/LoonCharacter";

export const metadata = {
  title: "Login | UCEY",
  description: "Sign in to your UCEY account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0b] relative overflow-hidden font-sans selection:bg-[#c8891e] selection:text-[#0d0d0b]">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[rgba(200,137,30,0.06)] rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[rgba(200,137,30,0.04)] rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3" />

      <div className="w-full max-w-[440px] px-6 py-12 relative z-10 flex flex-col items-center">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block text-[#c8891e] text-7xl font-bold tracking-tight mb-2 hover:text-[#d9991e] transition-colors">
            UCEY
          </Link>
          <div className="mt-2">
            <LoonCharacter />
          </div>
          <h1 className="text-[#e8d9c0] text-2xl font-semibold mb-1 mt-5">
            Welcome back
          </h1>
          <p className="text-[#7a6a52] text-sm">
            Please enter your details to sign in
          </p>
        </div>

        <div className="w-full bg-[#0d0d0b] backdrop-blur-sm relative z-20">
          {/* Main Form Box */}
          <LoginForm />

          {/* Divider — make it obvious you can scroll for Google */}
          <div className="my-6">
            <div className="flex items-center">
              <div className="flex-grow h-px bg-[#2a2520]"></div>
              <span className="px-4 py-2 text-sm text-[#b8a88a] bg-[#0d0d0b] font-semibold tracking-wide">
                Or continue with
              </span>
              <div className="flex-grow h-px bg-[#2a2520]"></div>
            </div>
            <p className="text-center text-xs text-[#8a7a62] mt-2 flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#c8891e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Scroll down for Google sign-in
            </p>
          </div>

          <SocialAuth />
        </div>

        {/* Footer actions */}
        <div className="mt-8 text-center space-y-4 w-full">
          <p className="text-sm text-[#b8a88a]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#c8891e] font-medium hover:text-[#d9991e] transition-colors">
              Sign up today
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

