const args = process.argv.slice(2);
const command = args[0] || "status";
const apply = args.includes("--apply");
const token = process.env.PINTEREST_ACCESS_TOKEN?.trim();
const apiBase = (process.env.PINTEREST_API_BASE || "https://api.pinterest.com/v5").replace(/\/$/, "");

if (!token) {
  throw new Error("PINTEREST_ACCESS_TOKEN is required. Keep it in a local environment variable, never in source control.");
}

function argument(name, fallback = "") {
  const index = args.indexOf(name);
  return index >= 0 ? String(args[index + 1] || "").trim() : fallback;
}

function trackedBlogUrl(value, content) {
  const url = new URL(value);
  if (url.origin !== "https://www.gigxomi.com" || !url.pathname.startsWith("/blog/")) {
    throw new Error("Pinterest destination links must use the canonical https://www.gigxomi.com/blog/ host and path.");
  }
  url.searchParams.set("utm_source", "pinterest");
  url.searchParams.set("utm_medium", "organic_social");
  url.searchParams.set("utm_campaign", "seo_growth_2026");
  if (content) url.searchParams.set("utm_content", content);
  return url.toString();
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = body?.message || body?.error || `HTTP ${response.status}`;
    throw new Error(`Pinterest ${options.method || "GET"} ${path} failed: ${message}`);
  }
  return body;
}

async function listBoards() {
  const response = await request("/boards?page_size=100");
  return response?.items || [];
}

if (command === "status") {
  const [account, boards] = await Promise.all([request("/user_account"), listBoards()]);
  console.log(JSON.stringify({
    connected: true,
    environment: apiBase.includes("api-sandbox.") ? "sandbox" : "production",
    username: account.username,
    accountType: account.account_type,
    boardCount: boards.length,
  }, null, 2));
} else if (command === "ensure-board") {
  const name = argument("--name", "Gigxomi Video Editing Growth");
  const description = argument("--description", "Practical video editing client acquisition, pricing, outreach, and agency growth guides from Gigxomi.");
  const existing = (await listBoards()).find((board) => board.name?.toLowerCase() === name.toLowerCase());
  if (existing) {
    console.log(JSON.stringify({ created: false, id: existing.id, name: existing.name }, null, 2));
  } else if (!apply) {
    console.log(JSON.stringify({ dryRun: true, action: "create-board", name, description, privacy: "PUBLIC" }, null, 2));
  } else {
    const board = await request("/boards", {
      method: "POST",
      body: JSON.stringify({ name, description, privacy: "PUBLIC" }),
    });
    console.log(JSON.stringify({ created: true, id: board.id, name: board.name }, null, 2));
  }
} else if (command === "create-pin") {
  const boardId = argument("--board-id");
  const title = argument("--title");
  const description = argument("--description");
  const altText = argument("--alt-text", title);
  const imageUrl = argument("--image-url");
  const content = argument("--content");
  const link = trackedBlogUrl(argument("--link"), content);

  if (!boardId || !title || !description || !imageUrl) {
    throw new Error("create-pin requires --board-id, --title, --description, --link, and --image-url.");
  }
  if (title.length > 100) throw new Error("Pinterest titles must be 100 characters or fewer.");
  if (description.length > 500 || altText.length > 500) throw new Error("Pinterest descriptions and alt text must be 500 characters or fewer.");
  if (!/^https:\/\//i.test(imageUrl)) throw new Error("Pinterest image URLs must use HTTPS.");

  const payload = {
    board_id: boardId,
    title,
    description,
    alt_text: altText,
    link,
    media_source: { source_type: "image_url", url: imageUrl, is_standard: true },
  };

  if (!apply) {
    console.log(JSON.stringify({ dryRun: true, action: "create-pin", payload }, null, 2));
  } else {
    const existing = await request(`/boards/${encodeURIComponent(boardId)}/pins?page_size=100`);
    const duplicate = (existing?.items || []).find((pin) => pin.link === link && pin.title === title);
    if (duplicate) {
      console.log(JSON.stringify({ created: false, duplicate: true, id: duplicate.id, link }, null, 2));
    } else {
      const pin = await request("/pins", { method: "POST", body: JSON.stringify(payload) });
      console.log(JSON.stringify({ created: true, id: pin.id, link: pin.link }, null, 2));
    }
  }
} else {
  throw new Error(`Unknown command: ${command}. Use status, ensure-board, or create-pin.`);
}
