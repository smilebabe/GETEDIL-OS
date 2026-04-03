import React from "react";
import { motion } from "framer-motion";
import { Job } from "@getedil/types/p4-jobs";

interface JobCardProps {
  job: Job;
  onApply?: (jobId: string) => void;
}

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const JobCard: React.FC<JobCardProps> = ({ job, onApply }) => {
  const progress = Math.min(Math.max(job.match_score ?? 0, 0), 100);
  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative rounded-3xl p-5 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl overflow-hidden text-white"
    >
      {/* Soft VisionOS Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-400/10 blur-3xl rounded-full" />
      </div>

      {/* Gradient Def */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan */}
            <stop offset="100%" stopColor="#facc15" /> {/* Gold */}
          </linearGradient>
        </defs>
      </svg>

      {/* Match Score Circle */}
      <div className="absolute top-4 right-4">
        <svg width="54" height="54">
          <circle
            cx="27"
            cy="27"
            r={RADIUS}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="4"
            fill="transparent"
          />
          <motion.circle
            cx="27"
            cy="27"
            r={RADIUS}
            stroke="url(#matchGradient)"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
            strokeLinecap="round"
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            className="fill-white text-[11px] font-medium"
          >
            {progress}%
          </text>
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="pr-12">
          <h3 className="text-lg font-semibold leading-snug tracking-tight">
            {job.title}
          </h3>
          <p className="mt-2 text-sm text-white/70">
            ETB {job.budget_min?.toLocaleString()} –{" "}
            {job.budget_max?.toLocaleString()}
          </p>
        </div>

        <button
          onClick={() => onApply?.(job.id)}
          className="mt-5 w-full py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-md text-sm font-medium transition-all"
        >
          Quick Apply
        </button>
      </div>

      {/* Subtle Inner Border Glow */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 pointer-events-none" />
    </motion.div>
  );
};

export default JobCard;
