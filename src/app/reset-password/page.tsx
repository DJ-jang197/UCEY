"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const ticket = searchParams.get("ticket"); // Or 'state', 'email', etc. depending on their template
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      // NOTE: Creating a custom password reset form requires Auth0 Management API or a specific setup.
      // Often, the ticket is just exchanged via Auth0's internal endpoint or native API.
      // If the user wants to handle it manually:
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, ticket }),
      });

      if (!res.ok) {
        throw new Error("Failed to reset password. The link may have expired.");
      }

      setMessage("Your password has been successfully reset! You can now log in.");
    } catch (err: any) {
      setError(err.message || "There was a problem resetting your password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (message) {
    return (
      <div className="w-full bg-[#0d0d0b] backdrop-blur-sm relative z-20 flex flex-col items-center">
        <div className="p-4 rounded-lg border bg-[rgba(60,200,100,0.08)] border-[rgba(60,200,100,0.2)] text-[#70c88a] text-sm mb-6 text-center">
          {message}
        </div>
        <Link 
          href="/login" 
          className="w-full bg-[#c8891e] hover:bg-[#d9991e] text-[#0d0d0b] text-center font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(200,137,30,0.1)] hover:shadow-[0_0_20px_rgba(200,137,30,0.2)]"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      {error && (
        <div className="p-3 rounded-lg border bg-[rgba(200,60,60,0.08)] border-[rgba(200,60,60,0.2)] text-[#c87070] text-sm flex items-center gap-2">
          {error}
        </div>
      )}

      {/* Password Field */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#5a4e3c]" htmlFor="password">
          New Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#141410] border border-[#222218] rounded-xl px-4 py-3 text-[#e8d9c0] text-sm outline-none transition-all placeholder:text-[#2a2820] focus:border-[#c8891e] focus:ring-1 focus:ring-[rgba(200,137,30,0.07)]"
          placeholder="••••••••"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#5a4e3c]" htmlFor="confirm-password">
          Confirm New Password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-[#141410] border border-[#222218] rounded-xl px-4 py-3 text-[#e8d9c0] text-sm outline-none transition-all placeholder:text-[#2a2820] focus:border-[#c8891e] focus:ring-1 focus:ring-[rgba(200,137,30,0.07)]"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full bg-[#c8891e] hover:bg-[#d9991e] disabled:opacity-50 disabled:cursor-not-allowed text-[#0d0d0b] font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(200,137,30,0.1)] hover:shadow-[0_0_20px_rgba(200,137,30,0.2)] active:scale-[0.98]"
      >
        {isLoading ? "Updating..." : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
            Create New Password
          </h1>
          <p className="text-[#7a6a52] text-sm">
            Enter your new password below
          </p>
        </div>

        <div className="w-full bg-[#0d0d0b] backdrop-blur-sm relative z-20">
          <Suspense fallback={<div className="text-[#e8d9c0] text-center">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        {/* Footer actions */}
        <div className="mt-8 text-center space-y-4 w-full">
          <p className="text-sm text-[#3d3428]">
            <Link href="/login" className="text-[#c8891e] font-medium hover:text-[#d9991e] transition-colors">
              &larr; Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
