"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill out both email and password.");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const res = await fetch('/api/auth/custom-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Redirect to main UI
        window.location.href = '/';
      } else {
        setError(data.error || "Login failed. Please verify your credentials.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
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

      {/* Password Field */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-[#5a4e3c]" htmlFor="password">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs text-[#c8891e] hover:text-[#d9991e] transition-colors">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            className="w-full bg-[#141410] border border-[#222218] rounded-xl px-4 py-3 text-[#e8d9c0] text-sm outline-none transition-all placeholder:text-[#2a2820] focus:border-[#c8891e] focus:ring-1 focus:ring-[rgba(200,137,30,0.07)]"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full bg-[#c8891e] hover:bg-[#d9991e] text-[#0d0d0b] font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(200,137,30,0.1)] hover:shadow-[0_0_20px_rgba(200,137,30,0.2)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
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
