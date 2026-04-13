import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Card from "../components/ui/Card";
import api from "../api/axios";

export default function Refunds() {
  const { data, isLoading } = useQuery({
    queryKey: ["legal", "refunds"],
    queryFn: async () => {
      const response = await api.get("/api/content/legal");
      return response.data?.refunds;
    },
  });

  if (isLoading) {
    return <div className="text-center p-20 animate-pulse text-[var(--muted)]">Syncing content from database...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-4xl space-y-8"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{data?.title || "Refunds & Cancellations"}</h1>
        <p className="mt-3 text-[var(--muted)]">Last updated: {data?.last_updated ? new Date(data.last_updated).toLocaleDateString() : '2026'}</p>
      </div>
      <Card className="rounded-[32px] p-6 sm:p-10 text-sm leading-relaxed text-[var(--muted)] space-y-6 whitespace-pre-wrap">
        {typeof data?.content === "string" ? (
          <div dangerouslySetInnerHTML={{ __html: data.content }} className="space-y-4" />
        ) : data?.content?.sections?.length > 0 ? (
          data.content.sections.map((sec: any, idx: number) => (
            <div key={idx}>
              <h2 className="text-xl font-semibold text-[var(--text)] mb-2">{sec.title}</h2>
              <p>{sec.body}</p>
            </div>
          ))
        ) : (
          <p>The refunds policy is currently being updated by the administrator in the database.</p>
        )}
      </Card>
    </motion.div>
  );
}
