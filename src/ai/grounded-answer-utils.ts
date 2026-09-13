// Pure string-based HTML formatting for the essayChapters storage format. Reimplemented
// from the admin page's browser-based equivalents (which rely on document.createElement),
// since this runs server-side. Matches the existing .qa-item/.qa-question/.qa-answer
// structure exactly, so answers generated this way display correctly in the existing
// long-answer viewer with no changes needed there.
//
// Now handles real Markdown structure (tables, headers, numbered lists, bold), since
// answers are generated with a per-question format choice (Comparison Table, Process/
// Mechanism Flowchart, Clinical Vignette Card, etc.) rather than flat paragraphs for
// every question - a comparison question renders a real <table>, not prose describing one.

function inlineFormat(text: string): string {
  // **bold** -> <strong>, leaving everything else as plain text (no other inline
  // Markdown is requested of the model, so nothing else needs handling here).
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function isTableSeparatorRow(line: string): boolean {
  // A row of the form | --- | :--- | ---: | with only dashes, colons, pipes, spaces.
  return /^\|?[\s:|-]+\|?$/.test(line) && line.includes('-');
}

function parseTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim());
}

export function answerTextToHtml(text: string): string {
  const lines = text.split('\n').map((l) => l.trim());
  const htmlParts: string[] = [];

  let i = 0;
  let listBuffer: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  function flushList() {
    if (listBuffer.length > 0 && listType) {
      htmlParts.push(`<${listType}>${listBuffer.map((l) => `<li>${inlineFormat(l)}</li>`).join('')}</${listType}>`);
    }
    listBuffer = [];
    listType = null;
  }

  while (i < lines.length) {
    const line = lines[i];

    if (!line) {
      flushList();
      i++;
      continue;
    }

    // Markdown table: a line with a pipe, followed by a separator row of dashes.
    if (line.includes('|') && i + 1 < lines.length && isTableSeparatorRow(lines[i + 1])) {
      flushList();
      const headerCells = parseTableRow(line);
      i += 2; // skip header + separator
      const bodyRows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        bodyRows.push(parseTableRow(lines[i]));
        i++;
      }
      const headHtml = `<thead><tr>${headerCells.map((c) => `<th>${inlineFormat(c)}</th>`).join('')}</tr></thead>`;
      const bodyHtml = `<tbody>${bodyRows.map((row) => `<tr>${row.map((c) => `<td>${inlineFormat(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
      htmlParts.push(`<table>${headHtml}${bodyHtml}</table>`);
      continue;
    }

    // Sub-header: ### Section Name
    const headerMatch = line.match(/^#{1,4}\s+(.+)/);
    if (headerMatch) {
      flushList();
      htmlParts.push(`<h4>${inlineFormat(headerMatch[1])}</h4>`);
      i++;
      continue;
    }

    // Numbered list item: 1. text
    const numberedMatch = line.match(/^\d+\.\s+(.+)/);
    if (numberedMatch) {
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listBuffer.push(numberedMatch[1]);
      i++;
      continue;
    }

    // Bulleted list item: - text or • text
    const bulletMatch = line.match(/^[-•]\s+(.+)/);
    if (bulletMatch) {
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listBuffer.push(bulletMatch[1]);
      i++;
      continue;
    }

    // Plain paragraph line.
    flushList();
    htmlParts.push(`<p>${inlineFormat(line)}</p>`);
    i++;
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
