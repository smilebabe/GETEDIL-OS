import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MorphTransitionProps<T> {
  items: T[];
  getId: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
  renderDetail: (item: T) => React.ReactNode;
}

const spring = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

function MorphTransition<T>({
  items,
  getId,
  renderCard,
  renderDetail,
}: MorphTransitionProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeItem = items.find((i) => getId(i) === activeId) || null;

  return (
    <div className="relative w-full h-full">
      {/* GRID / CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {items.map((item) => {
          const id = getId(item);
          return (
            <motion.div
              key={id}
              layoutId={`card-${id}`}
              onClick={() => setActiveId(id)}
              transition={spring}
              className="cursor-pointer rounded-[24px] backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl overflow-hidden relative group"
            >
              {/* VisionOS light reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-20 pointer-events-none" />
              <div className="relative z-10">{renderCard(item)}</div>
            </motion.div>
          );
        })}
      </div>

      {/* DETAIL VIEW */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Background Blur */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-xl"
              onClick={() => setActiveId(null)}
            />

            {/* MORPHED CARD */}
            <motion.div
              layoutId={`card-${getId(activeItem)}`}
              transition={spring}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-[32px] backdrop-blur-2xl bg-white/10 border border-white/20 shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
            >
              {/* Ambient glow */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -left-20 w-72 h-72 bg-cyan-400/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-400/10 blur-[120px] rounded-full" />
              </div>

              {/* Light reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-20 pointer-events-none rounded-[32px]" />

              {/* Close Button */}
              <button
                onClick={() => setActiveId(null)}
                className="absolute top-4 right-4 z-20 px-3 py-1.5 text-xs rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20"
              >
                Close
              </button>

              {/* Content */}
              <div className="relative z-10 p-6">
                {renderDetail(activeItem)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MorphTransition;
