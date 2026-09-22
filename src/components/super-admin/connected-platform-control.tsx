"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type ApiState = { loading: boolean; message: string };
const idle: ApiState = { loading: false, message: "" };
import { LearningContentEditor, LearningOrderControls, type LearningEditSelection, type LearningPackage, type LearningPlaylist } from "./learning-content-editor";
type LearningAnalytics = { learnerCount: number; sessionCount: number; watchedSeconds: number; dropOffLessons: unknown[] };

async function postJson(path: string, payload: Record<string, unknown>) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.message || result.error || "The change could not be saved.");
}

async function deleteJson(path: string) {
  const response = await fetch(path, { method: "DELETE" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.message || result.error || "The content could not be deleted.");
}

function Status({ state }: { state: ApiState }) {
  return state.message ? <p className="muted-copy" role="status">{state.message}</p> : null;
}

function audienceChecks() {
  return (
    <div className="dashboard-inline-actions">
      <label><input name="audiences" type="checkbox" value="CRM" /> CRM</label>
      <label><input name="audiences" type="checkbox" value="AGENCY" /> Agency</label>
      <label><input name="audiences" type="checkbox" value="FREELANCER" /> Freelancer</label>
    </div>
  );
}

export function ConnectedPlatformControl() {
  const [overview, setOverview] = useState({ courses: 0, coupons: 0, drips: 0 });
  const [courses, setCourses] = useState<LearningPlaylist[]>([]);
  const [learningPackages, setLearningPackages] = useState<LearningPackage[]>([]);
  const [learningAnalytics, setLearningAnalytics] = useState<LearningAnalytics>({ learnerCount: 0, sessionCount: 0, watchedSeconds: 0, dropOffLessons: [] });
  const [courseState, setCourseState] = useState(idle);
  const [chapterState, setChapterState] = useState(idle);
  const [lessonState, setLessonState] = useState(idle);
  const [contentState, setContentState] = useState(idle);
  const [editing, setEditing] = useState<LearningEditSelection | null>(null);
  const [libraryError, setLibraryError] = useState("");
  const [couponState, setCouponState] = useState(idle);
  const [dripState, setDripState] = useState(idle);
  const [trustState, setTrustState] = useState(idle);

  const refresh = useCallback(async () => {
    const [lms, coupons, drips] = await Promise.all([
      fetch("/api/super-admin/lms").then(async response => { const data = await response.json(); if (!response.ok || !data.ok) throw new Error("Learning Studio could not load. Please retry."); return data; }),
      fetch("/api/super-admin/coupons").then((response) => response.json()),
      fetch("/api/super-admin/drip-campaigns").then((response) => response.json()),
    ]);
    setLibraryError("");
    setOverview({
      courses: Array.isArray(lms.catalogs) ? lms.catalogs.reduce((sum: number, catalog: { courses?: unknown[] }) => sum + (catalog.courses?.length || 0), 0) : 0,
      coupons: coupons.campaigns?.length || 0,
      drips: drips.campaigns?.length || 0,
    });
    if (Array.isArray(lms.catalogs)) {
      const unique = new Map<string, LearningPlaylist>();
      for (const catalog of lms.catalogs as Array<{ playlists?: LearningPlaylist[]; courses?: LearningPlaylist[] }>) {
        for (const course of catalog.playlists || catalog.courses || []) unique.set(course.id, course);
      }
      setCourses([...unique.values()].sort((left, right) => left.sortOrder - right.sortOrder));
    }
    setLearningPackages(Array.isArray(lms.packages) ? lms.packages : []);
    if (lms.analytics) setLearningAnalytics(lms.analytics);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh().catch(error => setLibraryError(error instanceof Error ? error.message : "Learning Studio could not load.")); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function moveLearning(entity: "playlist" | "chapter" | "lesson", siblings: Array<{id: string}>, index: number, direction: -1 | 1) {
    const next = [...siblings]; const target = index + direction;
    if (target < 0 || target >= next.length || contentState.loading) return;
    [next[index], next[target]] = [next[target], next[index]];
    setContentState({ loading: true, message: "" });
    try {
      await postJson("/api/super-admin/lms", { entity: "reorder", target: entity, items: next.map((item, sortOrder) => ({id: item.id, sortOrder})) });
      await refresh(); setContentState({ loading: false, message: "Learning order updated." });
    } catch (error) { setContentState({ loading: false, message: error instanceof Error ? error.message : "Could not update order." }); }
  }

  async function removeLearning(entity: "playlist" | "chapter" | "lesson", id: string) {
    if (!window.confirm("Delete this content? Learner progress linked to it may also be removed.")) return;
    setContentState({ loading: true, message: "" });
    try {
      await deleteJson(`/api/super-admin/lms?entity=${entity}&id=${encodeURIComponent(id)}`);
      await refresh();
      setContentState({ loading: false, message: "Learning content deleted." });
    } catch (error) {
      setContentState({ loading: false, message: error instanceof Error ? error.message : "Unable to delete content." });
    }
  }

  async function runForm(
    event: FormEvent<HTMLFormElement>,
    path: string,
    build: (form: FormData) => Record<string, unknown>,
    setState: (state: ApiState) => void,
    done: string,
  ) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setState({ loading: true, message: "" });
    try {
      await postJson(path, build(new FormData(formElement)));
      formElement.reset();
      await refresh();
      setState({ loading: false, message: done });
    } catch (error) {
      setState({ loading: false, message: error instanceof Error ? error.message : "Unable to save." });
    }
  }

  return (
    <div className="stack-list">
      <div className="dashboard-shell compact">
        <p className="eyebrow">Connected platform controls</p>
        <h2 className="section-heading">Build guided learning journeys that turn stronger skills into better client outcomes.</h2>
        <p className="muted-copy">{overview.courses} playlist records · {learningAnalytics.learnerCount} learners · {Math.round(learningAnalytics.watchedSeconds / 360) / 10} watched hours · {overview.coupons} coupon campaigns · {overview.drips} drip rules</p>
      </div>

      <div className="dashboard-grid two-column">
        <form className="surface-card stack-list" onSubmit={(event) => void runForm(event, "/api/super-admin/lms", (form) => ({
          title: form.get("title"), description: form.get("description"), audiences: form.getAll("audiences"),
          isRequired: form.get("required") === "on", isPublished: form.get("published") === "on",
        }), setCourseState, "Course saved.")}>
          <h3>Create a learning playlist</h3>
          <p className="muted-copy">Group related chapters into a clear outcome, such as “Win better video clients”.</p>
          <input className="internal-input" name="title" placeholder="Playlist title" required />
          <textarea className="internal-input" name="description" placeholder="What will learners achieve?" />
          {audienceChecks()}
          <label><input name="required" type="checkbox" /> Required learning</label>
          <label><input name="published" type="checkbox" /> Publish now</label>
          <button className="freelancer-primary-button" disabled={courseState.loading}>Save playlist</button>
          <Status state={courseState} />
        </form>

        <form className="surface-card stack-list" onSubmit={(event) => void runForm(event, "/api/super-admin/lms", (form) => ({
          entity: "chapter", courseId: form.get("courseId"), title: form.get("title"), description: form.get("description"),
          thumbnailUrl: form.get("thumbnailUrl"), tags: String(form.get("tags") || "").split(",").map((value) => value.trim()).filter(Boolean),
          accessMode: form.get("accessMode"), packageIds: form.getAll("packageIds"), isPublished: form.get("published") === "on",
          sortOrder: Number(form.get("sortOrder")) || 0,
        }), setChapterState, "Chapter saved.")}>
          <h3>Add a chapter</h3>
          <p className="muted-copy">Keep the preview visible to everyone, then choose which packages can watch its lessons.</p>
          <select className="internal-input" name="courseId" required><option value="">Choose playlist</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select>
          <input className="internal-input" name="title" placeholder="Chapter title" required />
          <textarea className="internal-input" name="description" placeholder="Benefit learners will get from this chapter" />
          <input className="internal-input" name="thumbnailUrl" placeholder="Thumbnail image URL" type="url" />
          <input className="internal-input" name="tags" placeholder="Topics, comma separated" />
          <select className="internal-input" name="accessMode" defaultValue="ALL_MATCHING_PACKAGES">
            <option value="ALL_MATCHING_PACKAGES">Included for every matching package</option>
            <option value="SELECTED_PACKAGES">Only selected packages</option>
          </select>
          <div className="stack-list">
            {learningPackages.map((pkg) => <label key={pkg.id}><input name="packageIds" type="checkbox" value={pkg.id} /> {pkg.name}{pkg.isFree ? " · Free" : ""}</label>)}
          </div>
          <input className="internal-input" name="sortOrder" placeholder="Chapter order" type="number" />
          <label><input defaultChecked name="published" type="checkbox" /> Visible in the app</label>
          <button className="freelancer-primary-button" disabled={chapterState.loading}>Save chapter</button>
          <Status state={chapterState} />
        </form>

        <form className="surface-card stack-list" onSubmit={(event) => void runForm(event, "/api/super-admin/lms", (form) => ({
          entity: "lesson", courseId: form.get("courseId"), moduleId: form.get("moduleId"), title: form.get("title"), description: form.get("description"),
          tags: String(form.get("tags") || "").split(",").map((value) => value.trim()).filter(Boolean),
          youtubeUrl: form.get("youtubeUrl"), estimatedDuration: Number(form.get("estimatedDuration")) || 0,
          completionThreshold: Number(form.get("completionThreshold")) || 90, isRequired: form.get("required") === "on", isPublished: form.get("published") === "on",
        }), setLessonState, "Lesson saved.")}>
          <h3>Add a YouTube lesson</h3>
          <p className="muted-copy">Public or unlisted YouTube videos stay lightweight while Gigxomi securely controls access.</p>
          <select className="internal-input" name="courseId" required><option value="">Choose playlist</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select>
          <select className="internal-input" name="moduleId" required><option value="">Choose chapter</option>{courses.flatMap((course) => course.chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{course.title} → {chapter.title}</option>))}</select>
          <input className="internal-input" name="title" placeholder="Lesson title" required />
          <textarea className="internal-input" name="description" placeholder="What should the learner notice or practise?" />
          <input className="internal-input" name="tags" placeholder="Topics, comma separated" />
          <input className="internal-input" name="youtubeUrl" placeholder="Unlisted YouTube URL" required type="url" />
          <input className="internal-input" min="0" name="estimatedDuration" placeholder="Duration in seconds" type="number" />
          <input className="internal-input" defaultValue="90" max="100" min="50" name="completionThreshold" type="number" />
          <label><input defaultChecked name="required" type="checkbox" /> Required lesson</label>
          <label><input defaultChecked name="published" type="checkbox" /> Visible in the app</label>
          <button className="freelancer-primary-button" disabled={lessonState.loading}>Save lesson</button>
          <Status state={lessonState} />
        </form>
      </div>

      <section className="dashboard-shell compact stack-list">
        <div>
          <p className="eyebrow">Learning Studio library</p>
          <h2 className="section-heading">Playlists → chapters → lessons</h2>
          <p className="muted-copy">Locked chapters still advertise their outcome, but the app never receives their video URL until the learner has an eligible active package.</p>
        </div>
        {libraryError ? <div role="alert"><p>{libraryError}</p><button type="button" className="secondary-button" onClick={() => void refresh().catch(error => setLibraryError(error instanceof Error ? error.message : "Could not load."))}>Retry Learning Studio</button></div> : null}
        <Status state={contentState} />
        {editing ? <LearningContentEditor key={editing.entity + editing.content.id} selection={editing} packages={learningPackages} onClose={() => setEditing(null)} onSave={async payload => { await postJson("/api/super-admin/lms", payload); await refresh(); setContentState({loading:false,message:"Learning content updated."}); }} /> : null}
        {!libraryError && courses.length === 0 ? <p className="muted-copy">Create your first playlist to begin.</p> : courses.map((playlist, playlistIndex) => (
          <article className="surface-card stack-list" key={playlist.id}>
            <div className="dashboard-inline-actions">
              <div>
                <h3>{playlist.title}</h3>
                <p className="muted-copy">{playlist.audiences.join(" · ")} · {playlist.isPublished ? "Published" : "Draft"} · {playlist.chapters.length} chapters</p>
              </div>
              <button className="secondary-button" disabled={contentState.loading} type="button" onClick={() => setEditing({entity:"playlist", content:playlist})}>Edit playlist</button>
              <LearningOrderControls label={playlist.title} index={playlistIndex} count={courses.length} busy={contentState.loading} onMove={direction => void moveLearning("playlist", courses, playlistIndex, direction)} />
              <button className="secondary-button" disabled={contentState.loading} onClick={() => void removeLearning("playlist", playlist.id)} type="button">Delete playlist</button>
            </div>
            {playlist.chapters.map((chapter, chapterIndex) => (
              <div className="surface-card stack-list" key={chapter.id}>
                <div className="dashboard-inline-actions">
                  <div>
                    <strong>{chapter.title}</strong>
                    <p className="muted-copy">{chapter.isPublished ? "Published" : "Draft"} · {chapter.lessons.length} lessons · {chapter.accessMode === "SELECTED_PACKAGES" ? chapter.requiredPackages.map((pkg) => pkg.name).join(", ") || "No package selected" : "All matching packages"}</p>
                  </div>
                  <button className="secondary-button" disabled={contentState.loading} type="button" onClick={() => setEditing({entity:"chapter", content:chapter, courseId:playlist.id})}>Edit chapter & access</button>
                  <LearningOrderControls label={chapter.title} index={chapterIndex} count={playlist.chapters.length} busy={contentState.loading} onMove={direction => void moveLearning("chapter", playlist.chapters, chapterIndex, direction)} />
                  <button className="secondary-button" disabled={contentState.loading} onClick={() => void removeLearning("chapter", chapter.id)} type="button">Delete chapter</button>
                </div>
                {chapter.lessons.map((lesson, lessonIndex) => (
                  <div className="dashboard-inline-actions" key={lesson.id}>
                    <span>{lesson.title} · {lesson.completionThreshold}% completion threshold · {lesson.isPublished ? "Published" : "Draft"}</span>
                    <button className="secondary-button" disabled={contentState.loading} type="button" onClick={() => setEditing({entity:"lesson", content:lesson, courseId:playlist.id, moduleId:chapter.id})}>Edit lesson</button>
                    <LearningOrderControls label={lesson.title} index={lessonIndex} count={chapter.lessons.length} busy={contentState.loading} onMove={direction => void moveLearning("lesson", chapter.lessons, lessonIndex, direction)} />
                    <button className="secondary-button" disabled={contentState.loading} onClick={() => void removeLearning("lesson", lesson.id)} type="button">Delete</button>
                  </div>
                ))}
              </div>
            ))}
          </article>
        ))}
      </section>

      <div className="dashboard-grid two-column">
        <form className="surface-card stack-list" onSubmit={(event) => void runForm(event, "/api/super-admin/coupons", (form) => ({
          name: form.get("name"), discountType: form.get("discountType"), discountValue: Number(form.get("discountValue")), discountDuration: form.get("discountDuration"),
          eligiblePackageIds: String(form.get("packages") || "").split(",").map((value) => value.trim()).filter(Boolean),
          maxRedemptions: Number(form.get("maxRedemptions")) || null, perUserLimit: Number(form.get("perUserLimit")) || 1,
          expiresAt: form.get("expiresAt"), isActive: form.get("active") === "on",
        }), setCouponState, "Coupon campaign saved.")}>
          <h3>Create coupon campaign</h3>
          <input className="internal-input" name="name" placeholder="Campaign name" required />
          <select className="internal-input" name="discountType"><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed amount</option></select>
          <input className="internal-input" min="1" name="discountValue" placeholder="Discount value" required type="number" />
          <select className="internal-input" name="discountDuration"><option value="FIRST_CYCLE">First billing cycle only</option><option value="RECURRING">Every renewal</option></select>
          <input className="internal-input" name="packages" placeholder="Eligible package IDs, comma separated" />
          <input className="internal-input" min="1" name="maxRedemptions" placeholder="Maximum uses" type="number" />
          <input className="internal-input" defaultValue="1" min="1" name="perUserLimit" type="number" />
          <input className="internal-input" name="expiresAt" type="datetime-local" />
          <label><input name="active" type="checkbox" /> Active</label>
          <button className="freelancer-primary-button" disabled={couponState.loading}>Save campaign</button>
          <Status state={couponState} />
        </form>

        <form className="surface-card stack-list" onSubmit={(event) => void runForm(event, "/api/super-admin/drip-campaigns", (form) => ({
          name: form.get("name"), trigger: form.get("trigger"), audiences: form.getAll("audiences"),
          delayMinutes: Number(form.get("delayMinutes")), cooldownMinutes: Number(form.get("cooldownMinutes")),
          maxSendsPerUser: Number(form.get("maxSendsPerUser")), threshold: Number(form.get("threshold")) || null,
          titleTemplate: form.get("titleTemplate"), bodyTemplate: form.get("bodyTemplate"), destination: form.get("destination"),
          isActive: form.get("active") === "on",
        }), setDripState, "Drip rule saved.")}>
          <h3>Create drip rule</h3>
          <input className="internal-input" name="name" placeholder="Rule name" required />
          <select className="internal-input" name="trigger"><option value="PROFILE_INCOMPLETE">Incomplete profile</option><option value="REQUIRED_LEARNING_INCOMPLETE">Incomplete required learning</option><option value="SLOW_REPLY">Slow reply</option><option value="MISSED_WORK">Missed work</option><option value="TRUST_SCORE_BELOW">Trust score below</option></select>
          {audienceChecks()}
          <input className="internal-input" defaultValue="1440" name="delayMinutes" type="number" />
          <input className="internal-input" defaultValue="1440" name="cooldownMinutes" type="number" />
          <input className="internal-input" defaultValue="3" min="1" name="maxSendsPerUser" type="number" />
          <input className="internal-input" name="threshold" placeholder="Optional trust threshold" type="number" />
          <input className="internal-input" name="titleTemplate" placeholder="Push title" required />
          <textarea className="internal-input" name="bodyTemplate" placeholder="Push message" required />
          <input className="internal-input" name="destination" placeholder="App destination" />
          <label><input name="active" type="checkbox" /> Active</label>
          <button className="freelancer-primary-button" disabled={dripState.loading}>Save drip rule</button>
          <Status state={dripState} />
        </form>

        <form className="surface-card stack-list" onSubmit={(event) => void runForm(event, "/api/super-admin/trust-rules", (form) => ({
          key: form.get("key"), label: form.get("label"), weight: Number(form.get("weight")), isActive: true,
        }), setTrustState, "Trust-score weight saved.")}>
          <h3>Trust score weight</h3>
          <select className="internal-input" name="key"><option>RESPONSE</option><option>RELIABILITY</option><option>ON_TIME</option><option>RATING</option><option>PROFILE</option><option>IDENTITY</option><option>ASSESSMENT</option><option>PORTFOLIO</option><option>UPDATES</option></select>
          <input className="internal-input" name="label" placeholder="Display label" required />
          <input className="internal-input" max="100" min="0" name="weight" required type="number" />
          <button className="freelancer-primary-button" disabled={trustState.loading}>Save weight</button>
          <Status state={trustState} />
        </form>
      </div>
    </div>
  );
}
