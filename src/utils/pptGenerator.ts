import type { PPTSlide } from '../types';

const REVEAL_CSS_CDN = 'https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css';
const REVEAL_THEME_CDN = 'https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/white.css';
const REVEAL_JS_CDN = 'https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSlideHtml(slide: PPTSlide): string {
  const keywords = slide.keywords
    .map((kw) => `<span class="keyword">${escapeHtml(kw)}</span>`)
    .join(' ');

  const contentLines = slide.content
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => `<li>${escapeHtml(l.trim())}</li>`)
    .join('\n            ');

  return `
        <section data-notes="${escapeHtml(slide.speakerNotes)}">
          <h2>${escapeHtml(slide.title)}</h2>
          <ul>
            ${contentLines}
          </ul>
          <div class="keywords">${keywords}</div>
        </section>`;
}

export function generateRevealHtml(slides: PPTSlide[], title?: string): string {
  const slidesHtml = slides
    .sort((a, b) => a.slideNumber - b.slideNumber)
    .map(buildSlideHtml)
    .join('\n');

  const pageTitle = title ? escapeHtml(title) : 'Presentation';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <link rel="stylesheet" href="${REVEAL_CSS_CDN}" />
  <link rel="stylesheet" href="${REVEAL_THEME_CDN}" />
  <style>
    .keyword {
      display: inline-block;
      background: #e0e7ff;
      color: #3730a3;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.7em;
      margin: 4px 2px;
    }
    .keywords { margin-top: 1.5em; }
    .reveal ul { text-align: left; }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
${slidesHtml}
    </div>
  </div>
  <script src="${REVEAL_JS_CDN}"><\/script>
  <script>
    Reveal.initialize({ hash: true, slideNumber: true });
  <\/script>
</body>
</html>`;
}

export function downloadPptHtml(html: string, filename = 'presentation.html'): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
