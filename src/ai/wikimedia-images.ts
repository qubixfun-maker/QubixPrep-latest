// Searches Wikimedia Commons for a usable, copyright-free image to illustrate a notes
// topic. Commons requires no API key and its entire catalog is CC0/public-domain/CC-BY(-SA)
// licensed, which is exactly the "copyright free" requirement - and it has real depth on
// anatomy/histology/pathology/clinical images, unlike generic stock-photo APIs.
//
// Wikimedia's API etiquette policy expects a descriptive User-Agent identifying the
// calling application - requests without one can get rate-limited/blocked.
const USER_AGENT = 'QubixPrep-NotesGenerator/1.0 (https://qubixprep.com; educational notes image search)';

// Licenses that are safe to embed with attribution. Excludes anything with a
// non-commercial (NC) restriction, since this is a paid platform, and anything with no
// license metadata at all (skip rather than guess).
const ACCEPTABLE_LICENSE_PATTERN = /(cc0|public domain|cc[\s-]?by(?!.*nc)(-sa)?)/i;
const REJECT_LICENSE_PATTERN = /nc|noncommercial|non-commercial/i;

export type WikimediaImage = {
  url: string;
  title: string;
  license: string;
  artist: string | null;
  // CC0/public domain need no credit line; CC BY/BY-SA legally require one.
  needsAttribution: boolean;
};

export async function searchWikimediaImage(query: string): Promise<WikimediaImage | null> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: query,
      gsrnamespace: '6', // File: namespace
      gsrlimit: '6',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|mime',
      iiurlwidth: '900',
      format: 'json',
    });
    const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;

    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();

    const pages = data?.query?.pages;
    if (!pages) return null;

    const candidates = Object.values(pages) as any[];
    for (const page of candidates) {
      const info = page?.imageinfo?.[0];
      if (!info) continue;
      if (!info.mime?.startsWith('image/')) continue; // skip audio/video/pdf results

      const meta = info.extmetadata || {};
      const licenseShort: string = meta.LicenseShortName?.value || '';
      if (!licenseShort) continue; // no license metadata - skip rather than guess
      if (REJECT_LICENSE_PATTERN.test(licenseShort)) continue;
      if (!ACCEPTABLE_LICENSE_PATTERN.test(licenseShort)) continue;

      const isPublicDomainLike = /cc0|public domain/i.test(licenseShort);
      const artistRaw: string = meta.Artist?.value || '';
      // Artist field often contains HTML (links) - strip tags for a clean caption.
      const artist = artistRaw ? artistRaw.replace(/<[^>]*>/g, '').trim() : null;

      return {
        url: info.thumburl || info.url,
        title: (page.title || '').replace(/^File:/, ''),
        license: licenseShort,
        artist: artist || null,
        needsAttribution: !isPublicDomainLike,
      };
    }
    return null;
  } catch {
    // Image search is a nice-to-have, not critical - never fail note generation over it.
    return null;
  }
}

// Builds the Markdown to embed for a found image, including an attribution caption
// when the license requires one (CC0/public domain images get no caption clutter).
export function buildImageMarkdown(image: WikimediaImage): string {
  const altText = image.title.replace(/[_\.](jpg|jpeg|png|svg|gif)$/i, '').replace(/_/g, ' ');
  const imageLine = `![${altText}](${image.url})`;
  if (!image.needsAttribution) return `${imageLine}\n`;
  const credit = image.artist ? `${image.artist}` : 'Wikimedia Commons';
  return `${imageLine}\n*Image: ${credit}, ${image.license}, via Wikimedia Commons*\n`;
}
