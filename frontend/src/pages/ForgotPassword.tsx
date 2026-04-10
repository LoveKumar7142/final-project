import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail } from "react-icons/fi";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [resetPath, setResetPath] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Email enter karo");
      return;
    }

    try {
      setIsSubmitting(true);
      const { data } = await api.post("/api/auth/forgot-password", { email });
      setResetPath(data.resetUrl);
      toast.success("Reset link generate ho gaya");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Forgot password failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card className="rounded-[36px] p-7 sm:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Forgot password</p>
        <h1 className="section-title mt-3">Generate a secure reset link.</h1>
        <p className="section-copy mt-4">Enter your email and the backend will generate a reset URL for the password flow.</p>

        <div className="relative mt-6">
          <FiMail className="absolute left-4 top-4 text-[var(--muted)]" />
          <input type="email" className="w-full rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] py-3 pl-11 pr-4 outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-400/70" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        {resetPath ? (
          <div className="mt-5 rounded-[24px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm break-all">
            <p className="font-semibold">Reset link</p>
            <Link to={resetPath} className="mt-2 block text-emerald-700 underline dark:text-emerald-300">
              {window.location.origin}
              {resetPath}
            </Link>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/login" className="text-sm text-[var(--muted)] underline-offset-4 hover:underline">Back to login</Link>
          <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Generating..." : "Generate Reset Link"}</Button>
        </div>
      </Card>
    </div>
  );
}

