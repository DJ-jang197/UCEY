"use client";

import { useState, FormEvent, ChangeEvent } from "react";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill out all fields.");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const res = await fetch('/api/auth/custom-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Auto-login after signup
        const loginRes = await fetch('/api/auth/custom-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        if (loginRes.ok) {
          window.location.href = '/';
        } else {
          // If auto-login fails, send to login page
          window.location.href = '/login?registered=true';
        }
      } else {
        // Auth0 sometimes returns validation errors as objects (e.g. { rules, verified } or other formats)
        let errorMsg = "Signup failed. Please try again.";
        if (typeof data.error === 'string') {
          // If the custom-signup API returned the raw stringified array of rules:
          if (data.error.startsWith('[{"rules":') || data.error.startsWith('{"rules":')) {
             try {
                const parsed = JSON.parse(data.error);
                const rulesObj = Array.isArray(parsed) ? parsed[0] : parsed;
                if (rulesObj && rulesObj.rules) {
                   errorMsg = "Password must: " + rulesObj.rules
                     .filter((r: any) => !r.verified)
                     .map((r: any) => {
                        if (r.code === 'lengthAtLeast') return `be at least ${r.format[0]} characters`;
                        if (r.code === 'containsAtLeast') {
                           const requiredItems = r.items.filter((i: any) => !i.verified).map((i: any) => i.message);
                           return `contain ${requiredItems.join(', ')}`;
                        }
                        return r.message;
                     }).join('; ');
                } else {
                   errorMsg = 'Password does not meet the minimum requirements.';
                }
             } catch(e) {
                errorMsg = 'Password does not meet the minimum requirements.';
             }
          } else {
             errorMsg = data.error;
          }
        } else if (data.error && typeof data.error === 'object') {
          errorMsg = 'Password does not meet the minimum requirements.';
        }
        setError(errorMsg);
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

      {/* Name Field */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#5a4e3c]" htmlFor="name">
          Full Name
        </label>
        <div className="relative">
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            className="w-full bg-[#141410] border border-[#222218] rounded-xl px-4 py-3 text-[#e8d9c0] text-sm outline-none transition-all placeholder:text-[#2a2820] focus:border-[#c8891e] focus:ring-1 focus:ring-[rgba(200,137,30,0.07)]"
            placeholder="John Doe"
          />
        </div>
      </div>

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
        <label className="text-xs font-medium text-[#5a4e3c]" htmlFor="password">
          Password
        </label>
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
        {isLoading ? 'Creating account...' : 'Create account'}
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
