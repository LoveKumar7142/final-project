import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const { userId, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!userId || !token) {
      toast.error("Invalid reset link");
      return;
    }

    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/api/auth/reset-password", { userId, token, password });
      toast.success("Password reset successfully");
      navigate("/login");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Reset password failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card className="rounded-[36px] p-7 sm:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Reset password</p>
        <h1 className="section-title mt-3">Set a new password for your account.</h1>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <FiLock className="absolute left-4 top-4 text-[var(--muted)]" />
            <input type={showPassword ? "text" : "password"} className="w-full rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] py-3 pl-11 pr-12 outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-400/70" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="absolute right-4 top-4 text-[var(--muted)]" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <div className="relative">
            <FiLock className="absolute left-4 top-4 text-[var(--muted)]" />
            <input type={showConfirmPassword ? "text" : "password"} className="w-full rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] py-3 pl-11 pr-12 outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-400/70" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <button type="button" className="absolute right-4 top-4 text-[var(--muted)]" onClick={() => setShowConfirmPassword((value) => !value)}>
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/login" className="text-sm text-[var(--muted)] underline-offset-4 hover:underline">Back to login</Link>
          <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Update Password"}</Button>
        </div>
      </Card>
    </div>
  );
}

