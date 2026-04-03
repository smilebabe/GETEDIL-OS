import React from "react";
import { motion } from "framer-motion";

export interface Job {
  id: string;
  title: string;
  budget_min: number;
  budget_max: number;
  match_score: number; // 0 - 100
}

interface JobCardProps {
  job: Job;
  onApply?: (jobId: string) => void;
}

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const JobCard: React.FC<JobCardProps> = ({ job, onApply }) => {
  const progress = Math.min(Math.max(job.match_score, 0), 100);
  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative p-5 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-white overflow-hidden"
    >
      {/* Gradient Definition */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan */}
            <stop offset="100%" stopColor="#FFD700" /> {/* Gold */}
          </linearGradient>
        </defs>
      </svg>

      {/* Match Score Circle */}
      <div className="absolute top-4 right-4">
        <svg width="50" height="50">
          <circle
            cx="25"
            cy="25"
            r={RADIUS}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="4"
            fill="transparent"
          />
          <motion.circle
            cx="25"
            cy="25"
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
            className="text-xs fill-white font-semibold"
          >
            {progress}%
          </text>
        </svg>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold leading-tight pr-12">
          {job.title}
        </h3>

        <p className="text-sm text-white/80">
          ETB {job.budget_min.toLocaleString()} -{" "}
          {job.budget_max.toLocaleString()}
        </p>

        <button
          onClick={() => onApply?.(job.id)}
          className="mt-3 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition backdrop-blur-md text-sm font-medium"
        >
          Quick Apply
        </button>
      </div>
    </motion.div>
  );
};

export default JobCard;
