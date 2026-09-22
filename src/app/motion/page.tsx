import type { Metadata } from "next";
import { GigxomiMotionGraphicsWorkspace } from "@/components/public/gigxomi-motion-graphics-workspace";

export const metadata: Metadata = {
  title: "Gigxomi 3D Motion Graphics Explainer Showreel",
  description: "B2B SaaS motion graphics walkthrough for Gigxomi - Video Editing Agency Management Software.",
};

export default function MotionPage() {
  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        backgroundColor: "#06080B",
        overflow: "hidden",
      }}
    >
      <GigxomiMotionGraphicsWorkspace forceFullscreen={true} />
    </main>
  );
}
