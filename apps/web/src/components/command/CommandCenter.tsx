import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mic, Send } from "lucide-react";

/* ---------------- MOCK HOOK ---------------- */
const useCommand = () => {
  const [value, setValue] = React.useState("");
  return {
    value,
    setValue,
    isTyping: value.length > 0,
  };
};

/* ---------------- SUGGESTION CHIPS ---------------- */
const suggestions = ["Find Jobs", "Pay Telebirr", "Verify ID"];

const chipVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.3 },
  }),
};

/* ---------------- COMPONENT ---------------- */
const CommandCenter: React.FC = () => {
  const { value, setValue, isTyping } = useCommand();
  const [focused, setFocused] = React.useState(false);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* Floating Input */}
      <motion.div
        className={`w-full max-w-2xl flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-2xl bg-white/5 border transition-all
        ${
          focused
            ? "border-teal-400/50 shadow-[0_0_20px_rgba(20,184,166,0.4)]"
            : "border-white/10"
        }`}
        layout
      >
        {/* Left Icon */}
        <Search className="w-5 h-5 text-white/60" />

        {/* Input */}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask GETE anything..."
          className="flex-1 bg-transparent outline-none text-white placeholder:text-white/40 text-sm"
        />

        {/* Right Icon Morph */}
        <div className="relative w-5 h-5">
          <AnimatePresence mode="wait">
            {isTyping ? (
              <motion.div
                key="send"
                initial={{ opacity: 0, scale: 0.6, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <Send className="w-5 h-5 text-teal-300" />
              </motion.div>
            ) : (
              <motion.div
                key="mic"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.2 }}
              >
                <Mic className="w-5 h-5 text-white/60" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Suggestion Chips */}
      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
        {suggestions.map((text, i) => (
          <motion.button
            key={text}
            custom={i}
            variants={chipVariants}
            initial="hidden"
            animate="visible"
            className="px-3 py-1.5 rounded-full text-xs backdrop-blur-xl bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition whitespace-nowrap"
          >
            {text}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default CommandCenter;
