"use client";

import { useMemo } from "react";

/**
 * Minimal markdown renderer — supports headings, bold, lists, and links.
 * Deliberately dependency-free. Assumes sanitized AI/local content.
 */
export function Markdown({ text }: { text: string }) {
  const html = useMemo(() => render(text), [text]);
  return <div className="chat-md" dangerouslySetInnerHTML={{ __html: html }} />;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(s: string): string {
  let out = esc(s);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  return out;
}

function render(text: string): string {
  const lines = text.split("\n");
  let html = "";
  let inList = false;
  let inOl = false;

  const closeLists = () => {
    if (inList) { html += "</ul>"; inList = false; }
    if (inOl) { html += "</ol>"; inOl = false; }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { closeLists(); continue; }

    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      closeLists();
      const level = h[1].length;
      const size = ["", "text-lg", "text-base", "text-sm", "text-sm"][level];
      html += `<p class="${size} font-bold my-2">${inline(h[2])}</p>`;
      continue;
    }

    const ul = line.match(/^[-*]\s+(.*)/);
    if (ul) {
      if (inOl) { html += "</ol>"; inOl = false; }
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${inline(ul[1])}</li>`;
      continue;
    }

    const ol = line.match(/^\d+[.)]\s+(.*)/);
    if (ol) {
      if (inList) { html += "</ul>"; inList = false; }
      if (!inOl) { html += "<ol>"; inOl = true; }
      html += `<li>${inline(ol[1])}</li>`;
      continue;
    }

    closeLists();
    html += `<p>${inline(line)}</p>`;
  }
  closeLists();
  return html;
}
