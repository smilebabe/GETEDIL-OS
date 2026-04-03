import React from "react";

/* 
  Ultra-optimized Meskel-inspired tiled background
  - React.memo prevents re-renders
  - content-visibility + will-change boosts paint performance
  - flattened SVG path (no nested groups)
*/

const TiletBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none opacity-[0.05] [content-visibility:auto] [will-change:transform]">
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Meskel-inspired geometric tile (flattened path) */}
          <pattern
            id="meskelPattern"
            x="0"
            y="0"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M60 10 L70 40 L100 50 L70 60 L60 90 L50 60 L20 50 L50 40 Z
                 M60 30 L65 45 L80 50 L65 55 L60 70 L55 55 L40 50 L55 45 Z"
              fill="white"
              fillOpacity="0.8"
            />
          </pattern>
        </defs>

        {/* Background fill */}
        <rect width="100%" height="100%" fill="url(#meskelPattern)" />
      </svg>
    </div>
  );
};

export default React.memo(TiletBackground);
