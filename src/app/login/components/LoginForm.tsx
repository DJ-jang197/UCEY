"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        credentials: 'same-origin',
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        window.location.replace(data.redirectTo || '/');
      } else {
        setError(data.error || "Login failed. Please verify your credentials.");
      }
    } catch {
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
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            className="w-full bg-[#141410] border border-[#222218] rounded-xl px-4 py-3 pr-12 text-[#e8d9c0] text-sm outline-none transition-all placeholder:text-[#2a2820] focus:border-[#c8891e] focus:ring-1 focus:ring-[rgba(200,137,30,0.07)]"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#8a7a62] hover:text-[#e8d9c0] transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-1.554c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
                <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
                <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
              </svg>
            )}
          </button>
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
