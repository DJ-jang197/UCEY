"use client";

import { useState, FormEvent, ChangeEvent } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      setMessage("");
      return;
    } 

    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Failed to send reset email");
      }

      setMessage("If an account exists for that email, we have sent password reset instructions.");
    } catch (err: any) {
      setError("There was a problem sending the reset link. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      {error && (
        <div className="p-3 rounded-lg border bg-[rgba(200,60,60,0.08)] border-[rgba(200,60,60,0.2)] text-[#c87070] text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {message && (
        <div className="p-3 rounded-lg border bg-[rgba(60,200,100,0.08)] border-[rgba(60,200,100,0.2)] text-[#70c88a] text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          {message}
        </div>
      )}

      {/* Email Field */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#5a4e3c]" htmlFor="email">
          Email address
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="w-full bg-[#141410] border border-[#222218] rounded-xl px-4 py-3 text-[#e8d9c0] text-sm outline-none transition-all placeholder:text-[#2a2820] focus:border-[#c8891e] focus:ring-1 focus:ring-[rgba(200,137,30,0.07)]"
            placeholder="name@company.com"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full bg-[#c8891e] hover:bg-[#d9991e] disabled:opacity-50 disabled:cursor-not-allowed text-[#0d0d0b] font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(200,137,30,0.1)] hover:shadow-[0_0_20px_rgba(200,137,30,0.2)] active:scale-[0.98]"
      >
        {isLoading ? "Sending..." : "Send reset link"}
      </button>
      
      {/* Features List visualization block requested by user colors */}
      <ul className="mt-4 flex flex-col gap-2">
        <li className="flex items-center text-xs text-[#8a7a62]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c8891e] shadow-[0_0_6px_rgba(200,137,30,0.5)] mr-2" />
          Secure Auth0 Authentication
        </li>
      </ul>
    </form>
  );
}
