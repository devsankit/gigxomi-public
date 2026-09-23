import type { ReactNode } from "react";

type BlogKeyTakeawaysProps = {
  title?: string;
  excerpt: string;
  checkpoints: string[];
  readingTimeMinutes: number;
};

export function BlogKeyTakeaways({
  title = "In a Hurry? Key Takeaways",
  excerpt,
  checkpoints,
  readingTimeMinutes,
}: BlogKeyTakeawaysProps) {
  return (
    <section className="gx-blog-takeaways" aria-labelledby="takeaways-heading">
      <div className="gx-takeaways-header">
        <div className="gx-takeaways-badge">
          <span className="gx-badge-pulse" />
          <span>EXECUTIVE SUMMARY</span>
        </div>
        <span className="gx-reading-pill">{readingTimeMinutes} min read • Actionable Blueprint</span>
      </div>

      <h2 id="takeaways-heading" className="gx-takeaways-title">
        {title}
      </h2>

      <p className="gx-takeaways-lead">{excerpt}</p>

      <div className="gx-takeaways-grid">
        {checkpoints.slice(0, 4).map((point, index) => (
          <div key={index} className="gx-takeaway-item">
            <span className="gx-takeaway-num">0{index + 1}</span>
            <p>{point}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
