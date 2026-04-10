import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { editorialImages } from "../lib/editorialImages";
import { getSiteAssetUrl, useSiteAssets } from "../hooks/useSiteAssets";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const { data: siteAssets } = useSiteAssets();
  const loginImage = getSiteAssetUrl(siteAssets, "login_image", editorialImages.codingDesk);
  const redirect = new URLSearchParams(location.search).get("redirect") || "/";

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      toast.error("Email aur password dono chahiye");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/api/auth/login", { email, password });
      login(res.data.token, res.data.user);
      toast.success("Welcome back");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Invalid credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) return <Navigate to={redirect} replace />;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-8">
      <Card className="rounded-[32px] p-6 sm:rounded-[36px] sm:p-10 lg:min-h-[280px]">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Login</p>
        <h1 className="section-title mt-3">Welcome back to your premium portfolio workspace.</h1>
        <p className="section-copy mt-4">
          Visitors can browse freely, but sign in is required when you purchase a project, access downloads, or create paid hiring flows.
        </p>
        <div className="mt-6 overflow-hidden rounded-[28px] border border-[var(--border)]">
          <img src={loginImage} alt="Modern developer workspace" className="h-52 w-full object-cover" />
        </div>
      </Card>

      <Card className="rounded-[32px] p-6 sm:rounded-[36px] sm:p-10">
        <div className="space-y-4">
          <div className="relative">
            <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input type="email" className="w-full rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] py-4 pl-12 pr-4 outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-400/70" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="relative">
            <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input type={show ? "text" : "password"} className="w-full rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] py-4 pl-12 pr-12 outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-400/70" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--muted)]" onClick={() => setShow((current) => !current)}>
              {show ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <Button className="w-full" size="lg" onClick={handleLogin} disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
          <p className="text-center text-sm text-[var(--muted)]">
            <Link to="/forgot-password" className="text-[var(--text)] underline-offset-4 hover:underline">Forgot password?</Link>
          </p>
          <p className="text-center text-sm text-[var(--muted)]">
            Don&apos;t have an account? <Link to={`/register${location.search}`} className="text-[var(--text)] underline-offset-4 hover:underline">Register</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
