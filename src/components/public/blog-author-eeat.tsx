import Link from "next/link";

type BlogAuthorEEATProps = {
  authorName?: string;
  updatedAt: string;
  publishedAt: string;
};

export function BlogAuthorEEAT({
  authorName = "Ankit Rathore",
  updatedAt,
  publishedAt,
}: BlogAuthorEEATProps) {
  const formattedUpdated = new Date(updatedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <aside className="gx-author-box" aria-label="Author and editorial review details">
      <div className="gx-author-avatar-wrap">
        <div className="gx-author-avatar">
          <span>AR</span>
        </div>
        <div className="gx-author-verified-badge" title="Verified Video Agency Operations Architect">
          ✓
        </div>
      </div>

      <div className="gx-author-content">
        <div className="gx-author-top-row">
          <div>
            <h4 className="gx-author-name">{authorName}</h4>
            <p className="gx-author-role">Founder, Gigxomi • Video Agency Systems Architect</p>
          </div>
          <div className="gx-author-meta">
            <span>Reviewed &amp; Updated: <strong>{formattedUpdated}</strong></span>
          </div>
        </div>

        <p className="gx-author-bio">
          Ankit Rathore is the founder of Gigxomi, building operating software for video editors and production studios. 
          His frameworks on client acquisition, anti-poaching two-lane communication, and 0% commission business models have 
          helped hundreds of editors scale into profitable agency owners.
        </p>

        <div className="gx-author-links">
          <Link href="/about" className="gx-author-link">
            About Gigxomi &rarr;
          </Link>
          <Link href="/blog/editorial-methodology" className="gx-author-link">
            Editorial Methodology &rarr;
          </Link>
          <Link href="/pricing" className="gx-author-link">
            Agency Workspace &rarr;
          </Link>
          <a
            href="https://www.linkedin.com/in/ankit-rathore-gigxomi"
            target="_blank"
            rel="noopener noreferrer"
            className="gx-author-link"
          >
            LinkedIn Profile &rarr;
          </a>
        </div>
      </div>
    </aside>
  );
}
