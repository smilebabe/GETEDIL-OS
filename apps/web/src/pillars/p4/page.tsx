import React from "react";
import { motion } from "framer-motion";
import JobCard from "@/components/jobs/JobCard";
import CommandCenter from "@/components/command/CommandCenter";
import TiletBackground from "@/components/animations/TiletBackground";

/* ---------------- MOCK HOOK ---------------- */
interface Job {
  id: string;
  title: string;
  budget_min: number;
  budget_max: number;
  match_score: number;
}

const useJobs = () => {
  const [jobs, setJobs] = React.useState<Job[]>([]);

  React.useEffect(() => {
    setJobs([
      {
        id: "1",
        title: "Frontend Developer (React)",
        budget_min: 8000,
        budget_max: 15000,
        match_score: 92,
      },
      {
        id: "2",
        title: "Mobile App Developer (Flutter)",
        budget_min: 10000,
        budget_max: 18000,
        match_score: 85,
      },
      {
        id: "3",
        title: "UI/UX Designer",
        budget_min: 6000,
        budget_max: 12000,
        match_score: 78,
      },
      {
        id: "4",
        title: "Backend Developer (Node.js)",
        budget_min: 9000,
        budget_max: 16000,
        match_score: 88,
      },
      {
        id: "5",
        title: "Data Analyst",
        budget_min: 7000,
        budget_max: 13000,
        match_score: 81,
      },
    ]);
  }, []);

  return { jobs };
};

/* ---------------- ANIMATIONS ---------------- */
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

/* ---------------- PAGE ---------------- */
const GetHiredPage: React.FC = () => {
  const { jobs } = useJobs();

  return (
    <div className="relative min-h-screen text-white overflow-hidden bg-gradient-to-br from-black via-[#0a0a0a] to-black">
      {/* Soft Glow Layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-yellow-400/10 blur-[120px] rounded-full" />
      </div>

      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none">
        <TiletBackground />
      </div>

      {/* Sticky Glass Header */}
      <div className="sticky top-0 z-50 backdrop-blur-2xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-2 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <CommandCenter placeholder="Search opportunities, skills, or intent..." />
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-5"
      >
        {jobs.map((job, index) => {
          const isHero = index % 5 === 0;

          return (
            <motion.div
              key={job.id}
              variants={itemVariants}
              className={`group relative ${
                isHero
                  ? "md:col-span-2 md:row-span-2"
                  : "md:col-span-1 md:row-span-1"
              }`}
            >
              {/* VisionOS Glass Layer */}
              <div className="absolute inset-0 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.35)] group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all duration-300" />

              {/* Subtle Inner Glow */}
              <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 pointer-events-none" />

              {/* Content */}
              <div className="relative h-full">
                <JobCard job={job} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default GetHiredPage;
