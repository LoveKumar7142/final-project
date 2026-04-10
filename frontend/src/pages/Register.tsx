import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser } from "react-icons/fi";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { editorialImages } from "../lib/editorialImages";
import { getSiteAssetUrl, useSiteAssets } from "../hooks/useSiteAssets";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [show, setShow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);

  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const { data: siteAssets } = useSiteAssets();
  const registerImage = getSiteAssetUrl(siteAssets, "register_image", editorialImages.clientMeeting);
  const redirect = new URLSearchParams(location.search).get("redirect") || "/";

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      toast.error("Saare fields fill karo");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/api/auth/register", { name, email, password });
      setIsOtpStep(true);
      toast.success("OTP email par bhej diya gaya hai");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!email.trim() || !otp.trim()) {
      toast.error("Email aur OTP chahiye");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/api/auth/register/verify-otp", { email, otp });
      login(res.data.token, res.data.user);
      toast.success("Account verified successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "OTP verify nahi hua");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      toast.error("Name, email aur password dobara fill karo");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/api/auth/register/resend-otp", { name, email, password });
      toast.success("Naya OTP bhej diya gaya");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "OTP resend nahi hua");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) return <Navigate to={redirect} replace />;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-8">
      <Card className="rounded-[32px] p-6 sm:rounded-[36px] sm:p-10 lg:min-h-[280px]">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Register</p>
        <h1 className="section-title mt-3">Create an account to unlock purchases, downloads, and hiring flows.</h1>
        <p className="section-copy mt-4">
          Registration ke baad email par OTP jayega, aur verify hone ke baad hi account active hoga.
        </p>
        <div className="mt-6 overflow-hidden rounded-[28px] border border-[var(--border)]">
          <img src={registerImage} alt="Professional project planning workspace" className="h-52 w-full object-cover" />
        </div>
      </Card>

      <Card className="rounded-[32px] p-6 sm:rounded-[36px] sm:p-10">
        <div className="space-y-4">
          <div className="relative">
            <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input className="w-full rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] py-4 pl-12 pr-4 outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-400/70" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} disabled={isOtpStep} />
          </div>
          <div className="relative">
            <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input type="email" className="w-full rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] py-4 pl-12 pr-4 outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-400/70" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isOtpStep} />
          </div>
          <div className="relative">
            <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input type={show ? "text" : "password"} className="w-full rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] py-4 pl-12 pr-12 outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-400/70" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isOtpStep} />
            <button type="button" className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--muted)]" onClick={() => setShow((current) => !current)}>
              {show ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {isOtpStep ? (
            <div className="relative">
              <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input className="w-full rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] py-4 pl-12 pr-4 outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-400/70" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
            </div>
          ) : null}
        </div>

        <div className="mt-6 space-y-4">
          {isOtpStep ? (
            <>
              <Button className="w-full" size="lg" onClick={handleVerifyOtp} disabled={isSubmitting}>
                {isSubmitting ? "Verifying..." : "Verify OTP"}
              </Button>
              <button type="button" className="w-full rounded-[24px] border border-[var(--border)] px-4 py-3 text-sm" onClick={handleResendOtp} disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : "Resend OTP"}
              </button>
            </>
          ) : (
            <Button className="w-full" size="lg" onClick={handleRegister} disabled={isSubmitting}>
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </Button>
          )}
          <p className="text-center text-sm text-[var(--muted)]">
            Already have an account? <Link to={`/login${location.search}`} className="text-[var(--text)] underline-offset-4 hover:underline">Login</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
