"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

export type LearningPackage = { id: string; name: string; slug: string; isFree: boolean; packageType: string };
type CommonContent = { id: string; title: string; description?: string | null; isPublished: boolean; sortOrder: number; thumbnailUrl?: string | null; tags?: string[] };
export type LearningLesson = CommonContent & { youtubeVideoId?: string | null; videoUrl?: string | null; estimatedDuration?: number | null; isRequired: boolean; completionThreshold: number };
export type LearningChapter = CommonContent & { locked: boolean; accessMode: string; packageIds?: string[]; requiredPackages: LearningPackage[]; lessons: LearningLesson[] };
export type LearningPlaylist = CommonContent & { isRequired: boolean; audiences: string[]; chapters: LearningChapter[] };
export type LearningEditSelection = { entity: "playlist"; content: LearningPlaylist } | { entity: "chapter"; content: LearningChapter; courseId: string } | { entity: "lesson"; content: LearningLesson; courseId: string; moduleId: string };

export function LearningContentEditor({ selection, packages, onSave, onClose }: { selection: LearningEditSelection; packages: LearningPackage[]; onSave(payload: Record<string, unknown>): Promise<void>; onClose(): void }) {
  const { content, entity } = selection;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [access, setAccess] = useState(selection.entity === "chapter" ? selection.content.accessMode : "ALL_MATCHING_PACKAGES");
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { formRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }); formRef.current?.querySelector<HTMLInputElement>('input[name="title"]')?.focus({ preventScroll: true }); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const checked = (name: string) => form.get(name) === "on";
    const value = (name: string) => String(form.get(name) ?? "").trim();
    const payload: Record<string, unknown> = { entity, id: content.id, title: value("title"), description: value("description"), isPublished: checked("published"), sortOrder: Number(form.get("sortOrder")) };
    if (selection.entity === "playlist") Object.assign(payload, { audiences: form.getAll("audiences"), isRequired: checked("required"), thumbnailUrl: value("thumbnailUrl") });
    if (selection.entity === "chapter") Object.assign(payload, { courseId: selection.courseId, accessMode: access, packageIds: form.getAll("packageIds"), tags: value("tags").split(",").map(t => t.trim()).filter(Boolean), thumbnailUrl: value("thumbnailUrl") });
    if (selection.entity === "lesson") Object.assign(payload, { courseId: selection.courseId, moduleId: selection.moduleId, youtubeUrl: value("youtubeUrl"), estimatedDuration: Number(form.get("estimatedDuration")), completionThreshold: Number(form.get("completionThreshold")), isRequired: checked("required"), tags: value("tags").split(",").map(t => t.trim()).filter(Boolean) });
    setBusy(true); setError("");
    try { await onSave(payload); onClose(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save. Please try again."); } finally { setBusy(false); }
  }
  const selectedPackages = selection.entity === "chapter" ? selection.content.packageIds ?? selection.content.requiredPackages.map(p => p.id) : [];
  return <form ref={formRef} aria-label={"Edit " + entity} className="surface-card stack-list" onSubmit={event => void submit(event)}>
    <h3>Edit {entity}</h3><p className="muted-copy">Update this content without deleting learner progress.</p>
    <label>Title<input className="internal-input" name="title" defaultValue={content.title} required maxLength={200} /></label>
    <label>Description<textarea className="internal-input" name="description" defaultValue={content.description ?? ""} /></label>
    {entity !== "lesson" ? <label>Thumbnail URL<input className="internal-input" name="thumbnailUrl" type="url" defaultValue={content.thumbnailUrl ?? ""} /></label> : null}
    {entity !== "playlist" ? <label>Topics, separated by commas<input className="internal-input" name="tags" defaultValue={content.tags?.join(", ") ?? ""} /></label> : null}
    {selection.entity === "playlist" ? <fieldset><legend>Available to</legend>{["AGENCY", "FREELANCER", "CRM"].map(audience => <label key={audience}><input type="checkbox" name="audiences" value={audience} defaultChecked={selection.content.audiences.includes(audience)} /> {audience}</label>)}</fieldset> : null}
    {selection.entity === "chapter" ? <>
      <label>Chapter access<select className="internal-input" name="accessMode" value={access} onChange={e => setAccess(e.target.value)}><option value="ALL_MATCHING_PACKAGES">Every matching package</option><option value="SELECTED_PACKAGES">Selected packages only</option></select></label>
      <fieldset><legend>Packages that can watch this chapter</legend>{packages.map(pkg => <label key={pkg.id} style={{ display: "block" }}><input type="checkbox" name="packageIds" value={pkg.id} defaultChecked={selectedPackages.includes(pkg.id)} disabled={access !== "SELECTED_PACKAGES"} /> {pkg.name}{pkg.isFree ? " · Free" : ""}</label>)}{selectedPackages.filter(id => !packages.some(pkg => pkg.id === id)).map(id => <label key={id}><input type="checkbox" name="packageIds" value={id} defaultChecked disabled={access !== "SELECTED_PACKAGES"} /> Unavailable package ({id})</label>)}</fieldset>
    </> : null}
    {selection.entity === "lesson" ? <>
      <label>YouTube URL<input className="internal-input" type="url" name="youtubeUrl" required defaultValue={selection.content.videoUrl ?? (selection.content.youtubeVideoId ? "https://www.youtube.com/watch?v=" + selection.content.youtubeVideoId : "")} /></label>
      <label>Duration in seconds<input className="internal-input" type="number" min="0" max="604800" name="estimatedDuration" defaultValue={selection.content.estimatedDuration ?? 0} /></label>
      <label>Watch percentage required<input className="internal-input" type="number" min="50" max="100" required name="completionThreshold" defaultValue={selection.content.completionThreshold} /></label>
    </> : null}
    {selection.entity !== "chapter" ? <label><input name="required" type="checkbox" defaultChecked={selection.content.isRequired} /> Required learning</label> : null}
    <label>Display order<input className="internal-input" type="number" name="sortOrder" min="0" max="100000" required defaultValue={content.sortOrder ?? 0} /></label>
    <label><input name="published" type="checkbox" defaultChecked={content.isPublished} /> Published</label>
    {error ? <p role="alert">{error}</p> : null}
    <div className="dashboard-inline-actions"><button className="freelancer-primary-button" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button><button className="secondary-button" type="button" disabled={busy} onClick={onClose}>Cancel</button></div>
  </form>;
}

export function LearningOrderControls({ label, index, count, busy, onMove }: { label: string; index: number; count: number; busy: boolean; onMove(direction: -1 | 1): void }) {
  return <span className="dashboard-inline-actions"><button type="button" className="secondary-button" aria-label={"Move " + label + " up"} disabled={busy || index === 0} onClick={() => onMove(-1)}>↑ Up</button><button type="button" className="secondary-button" aria-label={"Move " + label + " down"} disabled={busy || index === count - 1} onClick={() => onMove(1)}>↓ Down</button></span>;
}
