// Pure string-based HTML formatting for the essayChapters storage format. Reimplemented
// from the admin page's browser-based equivalents (which rely on document.createElement),
// since this runs server-side. Matches the existing .qa-item/.qa-question/.qa-answer
// structure exactly, so answers generated this way display correctly in the existing
// long-answer viewer with no changes needed there.

export function answerTextToHtml(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const htmlParts: string[] = [];
  let listBuffer: string[] = [];
  function flushList() {
    if (listBuffer.length > 0) {
      htmlParts.push(`<ul>${listBuffer.map((l) => `<li>${l}</li>`).join('')}</ul>`);
      listBuffer = [];
    }
  }
  for (const line of lines) {
    if (line.startsWith('-') || line.startsWith('•')) {
      listBuffer.push(line.replace(/^[-•]\s*/, ''));
    } else {
      flushList();
      htmlParts.push(`<p>${line}</p>`);
    }
  }
  flushList();
  return htmlParts.join('\n');
}

export function rebuildQaHtml(items: { questionHtml: string; answerHtml: string }[]): string {
  return items.map((item, i) => `<div class="qa-item">
  <div class="qa-question">
    <span class="qa-number">${i + 1}.</span>
    ${item.questionHtml}
  </div>
  <div class="qa-answer">
    ${item.answerHtml}
  </div>
</div>`).join('\n');
}
