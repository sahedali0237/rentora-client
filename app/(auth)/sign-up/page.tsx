"use client";

import Link from "next/link";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { authClient } from "@/lib/auth-client";
import { SocialLoginButtons } from "@/components/social-login-buttons";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = (formData.get("name") as string).trim();
    const email = (formData.get("email") as string).trim();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (signUpError) {
        setError(signUpError.message || "Sign up failed. Please try again.");
        toast.error(signUpError.message || "Sign up failed.");
        return;
      }

      toast.success("Account created successfully! Signing you in...");

      // Automatically sign in after successful registration
      try {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        });

        if (signInError) {
          setError(
            "Account created, but sign-in failed. Please sign in manually.",
          );
          toast.error("Account created, but automatic sign-in failed.");
          return;
        }

        toast.success("Welcome to Rentora!");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Sign-in failed.";
        setError(message);
        toast.error(message);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <div className="flex flex-col space-y-2 text-center lg:text-left">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Create an account
        </h1>
        <p className="text-sm text-zinc-400">
          Join Rentora to start renting premium equipment today
        </p>
      </div>

      {error && (
        <div className="w-full px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSignUp} className="flex flex-col space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-300" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            required
            autoComplete="name"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-300" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1 relative">
          <div className="flex items-center justify-between">
            <label
              className="text-sm font-medium text-zinc-300"
              htmlFor="password"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full px-3 py-2 pr-10 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              required
              autoComplete="new-password"
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m-5.858-.908a3 3 0 11-4.243-4.243m0 0l-3.29 3.29"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1 relative">
          <div className="flex items-center justify-between">
            <label
              className="text-sm font-medium text-zinc-300"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
          </div>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full px-3 py-2 pr-10 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              required
              autoComplete="new-password"
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m-5.858-.908a3 3 0 11-4.243-4.243m0 0l-3.29 3.29"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-zinc-950 px-2 text-zinc-500">
            Or continue with
          </span>
        </div>
      </div>

      <SocialLoginButtons />

      <p className="text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-blue-500 hover:text-blue-400 font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
