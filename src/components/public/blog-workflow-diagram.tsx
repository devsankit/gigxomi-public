export function BlogWorkflowDiagram() {
  const steps = [
    {
      num: "01",
      title: "Omnichannel Inbound",
      desc: "WhatsApp & Instagram DM leads arrive in Unified Inbox",
      accent: "#38BDF8",
      tag: "Lead Intake",
    },
    {
      num: "02",
      title: "Qualification & Quote",
      desc: "Manager scores scope, prices deal & sends quote link",
      accent: "#F59E0B",
      tag: "Stage Board",
    },
    {
      num: "03",
      title: "Two-Lane Masked Chat",
      desc: "Editor receives brief; client phone is 100% encrypted",
      accent: "#818CF8",
      tag: "Anti-Poaching",
    },
    {
      num: "04",
      title: "Review & Approval",
      desc: "Client approves rough cut with gated revision limits",
      accent: "#EC4899",
      tag: "Quality Gate",
    },
    {
      num: "05",
      title: "0% Commission Payout",
      desc: "Agency keeps 100% of fees; auto-renewal locked",
      accent: "#D7FF2F",
      tag: "Retainer Secured",
    },
  ];

  return (
    <figure className="gx-diagram-container">
      <figcaption className="gx-diagram-header">
        <div className="gx-diagram-badge">OPERATIONAL ARCHITECTURE</div>
        <h3 className="gx-diagram-title">The Video Editing Agency Delivery Engine</h3>
        <p className="gx-diagram-subtitle">
          How modern studios scale client capacity without founder micro-management or poaching risk:
        </p>
      </figcaption>

      <div className="gx-diagram-grid">
        {steps.map((step, idx) => (
          <div key={idx} className="gx-diagram-step" style={{ borderColor: `${step.accent}33` }}>
            <div className="gx-diagram-step-top">
              <span className="gx-step-num" style={{ color: step.accent }}>
                {step.num}
              </span>
              <span className="gx-step-tag" style={{ background: `${step.accent}1A`, color: step.accent }}>
                {step.tag}
              </span>
            </div>
            <h4 className="gx-step-heading">{step.title}</h4>
            <p className="gx-step-desc">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="gx-diagram-callout">
        <span className="gx-diagram-lock-icon">🔒</span>
        <p>
          <strong>Anti-Poaching Guarantee:</strong> Editors never see raw client phone numbers or direct payment links. 
          All communication is relayed via encrypted tokens, protecting your agency's client equity permanently.
        </p>
      </div>
    </figure>
  );
}
