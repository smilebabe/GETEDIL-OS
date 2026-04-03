import React, { MouseEventHandler } from "react";
import { Link } from "react-router-dom";

/**
 * PillarLink
 * - Prefetches the lazy-loaded Pillar on hover
 * - Smooth UX for instant navigation
 */
interface PillarLinkProps {
  to: string;               // Route path
  label: string;            // Display text
  pillarImport: () => Promise<any>; // Lazy import function
  className?: string;
}

const PillarLink: React.FC<PillarLinkProps> = ({
  to,
  label,
  pillarImport,
  className,
}) => {
  // Prefetch the pillar chunk on hover
  const handleMouseEnter: MouseEventHandler<HTMLAnchorElement> = () => {
    pillarImport();
  };

  return (
    <Link
      to={to}
      onMouseEnter={handleMouseEnter}
      className={`relative inline-block px-4 py-2 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg transition-transform hover:scale-105 ${className}`}
    >
      {label}
    </Link>
  );
};

export default PillarLink;
