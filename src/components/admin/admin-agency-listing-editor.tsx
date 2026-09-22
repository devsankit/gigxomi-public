"use client";

import { useMemo, useState, useTransition } from "react";
import { BadgeCheck, Building2, MapPin, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppSelect } from "@/components/ui/app-select";
import type { AgencyListingProfile, AgencyShowcaseEditorOption } from "@/lib/gigxomi/agency-listing-types";

type AdminAgencyListingEditorProps = {
  initialProfile: AgencyListingProfile;
  editorOptions: AgencyShowcaseEditorOption[];
  mode: "showcase" | "settings";
};

type OfferDraft = {
  title: string;
  priceLabel: string;
  summary: string;
};

function buildOfferDrafts(profile: AgencyListingProfile) {
  const offers = profile.serviceOffers.slice(0, 3).map((offer) => ({
    title: offer.title,
    priceLabel: offer.priceLabel,
    summary: offer.summary,
  }));

  while (offers.length < 3) {
    offers.push({ title: "", priceLabel: "", summary: "" });
  }

  return offers;
}

function buildFormState(profile: AgencyListingProfile) {
  return {
    publicName: profile.publicName,
    slug: profile.slug,
    contactEmail: profile.contactEmail,
    whatsappNumber: profile.whatsappNumber,
    logoUrl: profile.logoUrl ?? "",
    coverUrl: profile.coverUrl ?? "",
    tagline: profile.tagline,
    description: profile.description,
    niche: profile.niche,
    categoriesText: profile.categories.join(", "),
    specialtiesText: profile.specialties.join(", "),
    ctaLabel: profile.ctaLabel,
    hiringStatus: profile.hiringStatus,
    city: profile.office.city,
    state: profile.office.state,
    country: profile.office.country,
    hasOffice: profile.office.hasOffice,
    officeVerified: profile.office.officeVerified,
    isAddressPublic: profile.office.isAddressPublic,
    publicOfficeAddress: profile.office.publicOfficeAddress,
    officeHours: profile.office.officeHours,
    showcaseEditorIds: profile.showcaseEditors.map((editor) => editor.editorId),
    serviceOffers: buildOfferDrafts(profile),
    isPublished: profile.isPublished,
  };
}

function splitList(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function AdminAgencyListingEditor({ editorOptions, initialProfile, mode }: AdminAgencyListingEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentProfile, setCurrentProfile] = useState(initialProfile);
  const [formState, setFormState] = useState(() => buildFormState(initialProfile));
  const [status, setStatus] = useState<string | null>(null);

  const selectedEditors = useMemo(
    () => editorOptions.filter((option) => formState.showcaseEditorIds.includes(option.editorId)),
    [editorOptions, formState.showcaseEditorIds],
  );

  const publicPath = `/agency/${formState.slug || currentProfile.slug}`;
  const isSetupRequired = !currentProfile.isSetupComplete;
  const isShowcaseMode = mode === "showcase";

  function updateField<Key extends keyof typeof formState>(key: Key, value: (typeof formState)[Key]) {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }

  function updateOffer(index: number, key: keyof OfferDraft, value: string) {
    setFormState((prev) => ({
      ...prev,
      serviceOffers: prev.serviceOffers.map((offer, offerIndex) => (offerIndex === index ? { ...offer, [key]: value } : offer)),
    }));
  }

  function toggleShowcaseEditor(editorId: string) {
    setFormState((prev) => ({
      ...prev,
      showcaseEditorIds: prev.showcaseEditorIds.includes(editorId)
        ? prev.showcaseEditorIds.filter((item) => item !== editorId)
        : [...prev.showcaseEditorIds, editorId].slice(0, 4),
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicName: formState.publicName,
          slug: formState.slug,
          contactEmail: formState.contactEmail,
          whatsappNumber: formState.whatsappNumber,
          logoUrl: formState.logoUrl,
          coverUrl: formState.coverUrl,
          tagline: formState.tagline,
          description: formState.description,
          niche: formState.niche,
          categories: splitList(formState.categoriesText),
          specialties: splitList(formState.specialtiesText),
          ctaLabel: formState.ctaLabel,
          hiringStatus: formState.hiringStatus,
          office: {
            city: formState.city,
            state: formState.state,
            country: formState.country,
            hasOffice: formState.hasOffice,
            officeVerified: formState.officeVerified,
            isAddressPublic: formState.isAddressPublic,
            publicOfficeAddress: formState.publicOfficeAddress,
            officeHours: formState.officeHours,
          },
          showcaseEditorIds: formState.showcaseEditorIds,
          serviceOffers: formState.serviceOffers,
          isPublished: formState.isPublished,
        }),
      });

      const payload = await response.json();
      if (!payload.ok || !payload.profile) {
        setStatus(payload.error ?? "Unable to save agency listing.");
        return;
      }

      setCurrentProfile(payload.profile as AgencyListingProfile);
      setFormState(buildFormState(payload.profile as AgencyListingProfile));
      setStatus(
        payload.profile.isPublished
          ? "Agency listing saved and published."
          : payload.profile.isSetupComplete
            ? "Agency listing saved. It is ready to publish."
            : "Agency listing saved as draft. Complete all required fields to publish.",
      );
      router.refresh();
    });
  }

  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">{isShowcaseMode ? "Showcase page" : "Agency settings"}</p>
      <h2 className="section-heading">
        {isShowcaseMode
          ? "Build a Google Business-style agency listing with trust signals, editor showcases, and client-ready proof."
          : "Control office visibility, contact identity, hiring posture, and the public publishing state for your agency page."}
      </h2>

      {isSetupRequired ? (
        <div className="admin-setup-callout">
          <div>
            <p className="section-label">Setup required</p>
            <h3>Complete your agency listing before the page can go live.</h3>
            <p>
              Fill the public brand profile, office details, service offers, and showcase editors. Gigxomi will keep the page in draft until the listing is complete.
            </p>
            <div style={{ marginTop: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
              <Link
                href="/admin/chat"
                className="freelancer-secondary-button"
                style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", fontSize: "13px" }}
              >
                Skip for now · Go to workspace →
              </Link>
            </div>
          </div>
          <div className="admin-setup-metrics">
            <span className="meta-pill">{currentProfile.completionPercent}% complete</span>
            <span className="meta-pill">{currentProfile.publishStage}</span>
          </div>
        </div>
      ) : null}

      <div className="dashboard-grid admin-agency-listing-grid">
        <section className="board-card">
          <div className="board-header">
            <div>
              <p className="section-label">Public preview</p>
              <h3 className="app-section-title">{currentProfile.publicName}</h3>
            </div>
            <span className="status-pill">{currentProfile.reputation.band} · {currentProfile.reputation.score}/100</span>
          </div>

          <div className="admin-agency-preview-card">
            <div className="admin-agency-preview-cover">
              <div className="admin-agency-preview-logo">{currentProfile.publicName.slice(0, 2).toUpperCase()}</div>
              <div className="admin-agency-preview-copy">
                <strong>{currentProfile.tagline || "Add a public tagline for your listing."}</strong>
                <span>{publicPath}</span>
              </div>
            </div>

            <div className="brief-grid three-up">
              <div className="brief-card">
                <span className="meta-pill"><MapPin size={13} strokeWidth={1.8} /> Location</span>
                <strong>{currentProfile.office.city || "City pending"}</strong>
                <p className="muted-copy">{currentProfile.office.state || "State pending"}{currentProfile.office.country ? `, ${currentProfile.office.country}` : ""}</p>
              </div>
              <div className="brief-card">
                <span className="meta-pill"><Star size={13} strokeWidth={1.8} /> Reviews</span>
                <strong>{currentProfile.stats.averageRating || 0}/5 · {currentProfile.stats.reviewCount} reviews</strong>
                <p className="muted-copy">{currentProfile.stats.completedOrders} completed orders visible publicly.</p>
              </div>
              <div className="brief-card">
                <span className="meta-pill"><ShieldCheck size={13} strokeWidth={1.8} /> Publish state</span>
                <strong>{currentProfile.publishStage}</strong>
                <p className="muted-copy">{currentProfile.isPublished ? "Public listing is live." : "Draft or ready state until publish is enabled."}</p>
              </div>
            </div>

            <div className="board-list">
              {currentProfile.reputation.reasons.map((reason) => (
                <article className="lead-row" key={reason.label}>
                  <h3>{reason.label}</h3>
                  <p>{reason.value}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <aside className="board-stack">
          <div className="brief-card admin-agency-sidebar-card">
            <span className="meta-pill"><Building2 size={13} strokeWidth={1.8} /> Listing health</span>
            <strong>{currentProfile.completionPercent}% complete</strong>
            <p className="muted-copy">Required fields include brand copy, location, at least one offer, and at least one showcase editor.</p>
          </div>
          <div className="brief-card admin-agency-sidebar-card">
            <span className="meta-pill"><BadgeCheck size={13} strokeWidth={1.8} /> Trust snapshot</span>
            <strong>{currentProfile.stats.responseSlaMinutes} min avg reply</strong>
            <p className="muted-copy">{currentProfile.stats.repeatClientPercent}% repeat clients and {currentProfile.stats.activeEditors} active editors are feeding the current karma score.</p>
          </div>
          <div className="brief-card admin-agency-sidebar-card">
            <span className="meta-pill">Showcase editors</span>
            <strong>{selectedEditors.length} selected</strong>
            <p className="muted-copy">Choose up to 4 editors to highlight on the public page.</p>
          </div>
        </aside>
      </div>

      <form className="admin-agency-form" onSubmit={handleSubmit}>
        <div className="freelancer-form-grid">
          <label className="freelancer-field">
            <span>Public agency name</span>
            <input value={formState.publicName} onChange={(event) => updateField("publicName", event.target.value)} />
          </label>
          <label className="freelancer-field">
            <span>Public slug</span>
            <input value={formState.slug} onChange={(event) => updateField("slug", event.target.value)} />
          </label>
          <label className="freelancer-field">
            <span>Contact email</span>
            <input value={formState.contactEmail} onChange={(event) => updateField("contactEmail", event.target.value)} />
          </label>
          <label className="freelancer-field">
            <span>WhatsApp number</span>
            <input value={formState.whatsappNumber} onChange={(event) => updateField("whatsappNumber", event.target.value)} />
          </label>
          <label className="freelancer-field freelancer-field-full">
            <span>Tagline</span>
            <input value={formState.tagline} onChange={(event) => updateField("tagline", event.target.value)} />
          </label>
          <label className="freelancer-field freelancer-field-full">
            <span>Description</span>
            <textarea rows={4} value={formState.description} onChange={(event) => updateField("description", event.target.value)} />
          </label>
          <label className="freelancer-field">
            <span>Primary niche</span>
            <input value={formState.niche} onChange={(event) => updateField("niche", event.target.value)} />
          </label>
          <label className="freelancer-field">
            <span>Categories</span>
            <input placeholder="Creator growth, Podcast production" value={formState.categoriesText} onChange={(event) => updateField("categoriesText", event.target.value)} />
          </label>
          <label className="freelancer-field freelancer-field-full">
            <span>Specialties</span>
            <input placeholder="Long-form editing, Webinar repurposing, UGC ads" value={formState.specialtiesText} onChange={(event) => updateField("specialtiesText", event.target.value)} />
          </label>
          <label className="freelancer-field">
            <span>CTA label</span>
            <input value={formState.ctaLabel} onChange={(event) => updateField("ctaLabel", event.target.value)} />
          </label>
          <label className="freelancer-field">
            <span>Hiring status</span>
            <AppSelect value={formState.hiringStatus} onChange={(nextValue) => updateField("hiringStatus", nextValue as AgencyListingProfile["hiringStatus"])}>
              <option value="Actively hiring">Actively hiring</option>
              <option value="Selective hiring">Selective hiring</option>
              <option value="Invite only">Invite only</option>
            </AppSelect>
          </label>
          <label className="freelancer-field">
            <span>Logo image URL</span>
            <input value={formState.logoUrl} onChange={(event) => updateField("logoUrl", event.target.value)} />
          </label>
          <label className="freelancer-field">
            <span>Cover image URL</span>
            <input value={formState.coverUrl} onChange={(event) => updateField("coverUrl", event.target.value)} />
          </label>
        </div>

        <div className="board-card admin-agency-form-section">
          <div className="board-header">
            <div>
              <p className="section-label">Office and location</p>
              <h3 className="app-section-title">Show city/state on every agency. Turn on the office block only if the agency has a real public office.</h3>
            </div>
          </div>

          <div className="freelancer-form-grid">
            <label className="freelancer-field">
              <span>City</span>
              <input value={formState.city} onChange={(event) => updateField("city", event.target.value)} />
            </label>
            <label className="freelancer-field">
              <span>State</span>
              <input value={formState.state} onChange={(event) => updateField("state", event.target.value)} />
            </label>
            <label className="freelancer-field">
              <span>Country</span>
              <input value={formState.country} onChange={(event) => updateField("country", event.target.value)} />
            </label>
            <label className="freelancer-field freelancer-checkbox-field">
              <input checked={formState.hasOffice} onChange={(event) => updateField("hasOffice", event.target.checked)} type="checkbox" />
              <span>Agency has a physical office</span>
            </label>
            <label className="freelancer-field freelancer-checkbox-field">
              <input checked={formState.officeVerified} onChange={(event) => updateField("officeVerified", event.target.checked)} type="checkbox" />
              <span>Mark office as verified</span>
            </label>
            <label className="freelancer-field freelancer-checkbox-field">
              <input checked={formState.isAddressPublic} onChange={(event) => updateField("isAddressPublic", event.target.checked)} type="checkbox" />
              <span>Show full public office address</span>
            </label>
            <label className="freelancer-field freelancer-field-full">
              <span>Public office address</span>
              <input disabled={!formState.hasOffice} value={formState.publicOfficeAddress} onChange={(event) => updateField("publicOfficeAddress", event.target.value)} />
            </label>
            <label className="freelancer-field freelancer-field-full">
              <span>Office hours</span>
              <input disabled={!formState.hasOffice} value={formState.officeHours} onChange={(event) => updateField("officeHours", event.target.value)} />
            </label>
          </div>
        </div>

        <div className="board-card admin-agency-form-section">
          <div className="board-header">
            <div>
              <p className="section-label">Top service offers</p>
              <h3 className="app-section-title">Add up to three offer blocks for the public page and directory context.</h3>
            </div>
          </div>

          <div className="brief-grid three-up">
            {formState.serviceOffers.map((offer, index) => (
              <div className="brief-card admin-offer-card" key={`offer-${index + 1}`}>
                <span className="meta-pill">Offer {index + 1}</span>
                <label className="freelancer-field">
                  <span>Title</span>
                  <input value={offer.title} onChange={(event) => updateOffer(index, "title", event.target.value)} />
                </label>
                <label className="freelancer-field">
                  <span>Price label</span>
                  <input value={offer.priceLabel} onChange={(event) => updateOffer(index, "priceLabel", event.target.value)} />
                </label>
                <label className="freelancer-field">
                  <span>Summary</span>
                  <textarea rows={3} value={offer.summary} onChange={(event) => updateOffer(index, "summary", event.target.value)} />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="board-card admin-agency-form-section">
          <div className="board-header">
            <div>
              <p className="section-label">Editor showcase</p>
              <h3 className="app-section-title">Select the editors you want to highlight publicly on the agency page.</h3>
            </div>
          </div>

          <div className="brief-grid two-up">
            {editorOptions.map((editor) => (
              <label className="brief-card admin-showcase-editor-option" key={editor.editorId}>
                <input checked={formState.showcaseEditorIds.includes(editor.editorId)} onChange={() => toggleShowcaseEditor(editor.editorId)} type="checkbox" />
                <div>
                  <strong>{editor.displayName}</strong>
                  <p className="muted-copy">{editor.publicAlias} · {editor.specialties.join(", ")}</p>
                  <p className="muted-copy">
                    {editor.isAgencyMember ? `${editor.membershipStatus ?? "Active"} team member` : "Available from network pool"}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="board-card admin-agency-form-section">
          <div className="board-header">
            <div>
              <p className="section-label">Publish controls</p>
              <h3 className="app-section-title">Only active and complete listings go live publicly. Drafts stay private even after saving.</h3>
            </div>
          </div>

          <label className="freelancer-field freelancer-checkbox-field">
            <input checked={formState.isPublished} onChange={(event) => updateField("isPublished", event.target.checked)} type="checkbox" />
            <span>Publish this agency page publicly when the listing is complete</span>
          </label>

          <div className="freelancer-inline-list admin-agency-form-actions">
            <button className="freelancer-primary-button" disabled={isPending} type="submit">
              {isPending ? "Saving..." : isShowcaseMode ? "Save showcase page" : "Save agency settings"}
            </button>
            <Link
              href="/admin/chat"
              className="freelancer-secondary-button"
              style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
            >
              Skip for now · Go to workspace →
            </Link>
            {status ? <span className="meta-pill">{status}</span> : null}
          </div>
        </div>
      </form>
    </div>
  );
}
