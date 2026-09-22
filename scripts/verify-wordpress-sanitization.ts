import assert from "node:assert/strict";

import { sanitizeWordPressEditorialHtml } from "../src/lib/seo/wordpress-editorial";

const unsafe = `
  <script>alert("xss")</script>
  <p onclick="steal()">Safe paragraph</p>
  <iframe src="https://attacker.example/embed"></iframe>
  <a href="javascript:alert(1)">unsafe link</a>
  <a href="http://gigxomi.com/pricing">mixed content</a>
  <a href="https://example.com/research">external source</a>
  <img src="https://blog.gigxomi.com/wp-content/uploads/2026/08/hero.png" onerror="steal()" alt="Hero">
`;

const sanitized = sanitizeWordPressEditorialHtml(unsafe);
assert(!sanitized.includes("<script"));
assert(!sanitized.includes("<iframe"));
assert(!sanitized.includes("onclick"));
assert(!sanitized.includes("onerror"));
assert(!sanitized.includes("javascript:"));
assert(!sanitized.includes("http://"));
assert(sanitized.includes('href="https://www.gigxomi.com/pricing"'));
assert(sanitized.includes('href="https://example.com/research" rel="noopener noreferrer" target="_blank"'));
assert(sanitized.includes('src="https://blog.gigxomi.com/wp-content/uploads/2026/08/hero.png"'));
assert(sanitized.includes('loading="lazy"'));

console.log("WordPress sanitization verification passed.");
