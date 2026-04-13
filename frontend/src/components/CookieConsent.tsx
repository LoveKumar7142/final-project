import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Button from "./ui/Button";
import api from "../api/axios";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["cookie-settings"],
    queryFn: async () => {
      const response = await api.get("/api/consent/settings");
      return response.data as { title: string; text: string };
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setTimeout(() => setShow(true), 1500); // 1.5s delay for smooth entry
    }
  }, []);

  const handleAccept = async (type: "all" | "essential") => {
    localStorage.setItem("cookie_consent", type);
    setShow(false);

    try {
      // Secretly log IP to database for government compliance
      await api.post("/api/consent/accept", { type });
    } catch (e) {
      console.error("Could not record consent via API", e);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-5 left-4 right-4 z-50 sm:left-auto sm:right-8 sm:w-[380px]"
        >
          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)]/90 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍪</span>
              <h3 className="text-base font-semibold text-[var(--text)]">
                {settings?.title || "We value your privacy"}
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              {settings?.text || "We use cookies to improve your browsing experience and analyze our traffic. Please choose your preference."}
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <Button size="sm" onClick={() => handleAccept("all")} className="w-full justify-center">
                Accept All
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleAccept("essential")} className="w-full justify-center">
                Essential Only
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
