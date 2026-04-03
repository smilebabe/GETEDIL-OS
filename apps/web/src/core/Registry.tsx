import React, { Suspense } from "react";

/* ---------------- LOADING SKELETON ---------------- */
const LoadingSkeleton: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-64 h-32 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 animate-pulse" />
  </div>
);

/* ---------------- ERROR BOUNDARY ---------------- */
class PillarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.error("Pillar load failed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center text-white/70">
          Failed to load module.
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------------- PILLAR LOADER ---------------- */
const PillarLoader: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <PillarErrorBoundary>
      <Suspense fallback={<LoadingSkeleton />}>{children}</Suspense>
    </PillarErrorBoundary>
  );
};

/* ---------------- LAZY IMPORTS ---------------- */
const P0_Onboarding = React.lazy(() => import("@/pillars/P0_Onboarding"));
const P1_GetConsultancy = React.lazy(
  () => import("@/pillars/P1_GetConsultancy")
);
const P2_GetHome = React.lazy(() => import("@/pillars/P2_GetHome"));
const P3_GetVerified = React.lazy(() => import("@/pillars/P3_GetVerified"));
const P4_GetHired = React.lazy(() => import("@/pillars/P4_GetHired"));
const P5_GetSkills = React.lazy(() => import("@/pillars/P5_GetSkills"));
const P6_GetPaid = React.lazy(() => import("@/pillars/P6_GetPaid"));
const P7_GetConnected = React.lazy(
  () => import("@/pillars/P7_GetConnected")
);

/* ---------------- REGISTRY ---------------- */
type PillarKey =
  | "P0"
  | "P1"
  | "P2"
  | "P3"
  | "P4"
  | "P5"
  | "P6"
  | "P7";

const registry: Record<PillarKey, React.LazyExoticComponent<any>> = {
  P0: P0_Onboarding,
  P1: P1_GetConsultancy,
  P2: P2_GetHome,
  P3: P3_GetVerified,
  P4: P4_GetHired,
  P5: P5_GetSkills,
  P6: P6_GetPaid,
  P7: P7_GetConnected,
};

/* ---------------- RENDER HELPER ---------------- */
export const renderPillar = (key: PillarKey) => {
  const Component = registry[key];
  if (!Component) return null;

  return (
    <PillarLoader>
      <Component />
    </PillarLoader>
  );
};

export default registry;
