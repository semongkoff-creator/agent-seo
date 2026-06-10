type FixGuide = {
  summary: string;
  whyItMatters: string;
  steps: string[];
};

const FIX_GUIDES: Record<string, FixGuide> = {
  'HTTP 4xx errors': {
    summary: 'The page is returning a client error or an invalid destination.',
    whyItMatters: 'Users and crawlers cannot access the page cleanly, so it cannot reliably rank or convert.',
    steps: [
      'Confirm whether the URL should exist or should redirect.',
      'Restore the page if it was removed by mistake, or 301 redirect it to the closest equivalent.',
      'Update internal links and sitemap entries that still point to the broken URL.'
    ]
  },
  'HTTP 5xx errors': {
    summary: 'The server is failing to respond successfully.',
    whyItMatters: 'Server instability blocks crawling and can rapidly damage visibility.',
    steps: [
      'Check server logs and hosting alerts for the root cause.',
      'Verify application, cache, and database health on the affected route.',
      'Retest after the fix and monitor for recurring failures.'
    ]
  },
  'Redirect chains': {
    summary: 'The page is bouncing through multiple redirects before reaching the final destination.',
    whyItMatters: 'Redirect chains waste crawl budget and slow users down.',
    steps: [
      'Replace multi-hop redirects with a single direct redirect.',
      'Update internal links so they point to the final URL.',
      'Keep the canonical and sitemap URLs aligned with the final destination.'
    ]
  },
  'Broken links': {
    summary: 'The page contains one or more links that fail to resolve.',
    whyItMatters: 'Broken links hurt UX and can waste link equity.',
    steps: [
      'Review every internal link on the page.',
      'Fix the destination, or replace the link with the correct final URL.',
      'Re-run the crawl after deployment.'
    ]
  },
  'Missing title tag': {
    summary: 'The page has no title tag.',
    whyItMatters: 'Titles are the primary SERP headline and a strong relevance signal.',
    steps: [
      'Write a unique title for each important page.',
      'Include the primary keyword naturally near the front.',
      'Keep it concise and aligned with the page intent.'
    ]
  },
  'Title too short': {
    summary: 'The title is too short to communicate clear relevance.',
    whyItMatters: 'Short titles often under-explain the page and underperform in SERPs.',
    steps: [
      'Expand the title to include the core topic and benefit.',
      'Avoid repetitive branding that crowds out intent.',
      'Aim for roughly 50-60 characters, but prioritize clarity.'
    ]
  },
  'Title too long': {
    summary: 'The title is likely getting truncated in search results.',
    whyItMatters: 'Truncated titles can weaken click-through rate and relevance.',
    steps: [
      'Trim unnecessary modifiers and duplication.',
      'Keep the primary intent in the first half of the title.',
      'Check the rendered SERP snippet after updating.'
    ]
  },
  'Duplicate title tags': {
    summary: 'Multiple pages share the same or near-identical title.',
    whyItMatters: 'Duplicate titles make it harder for search engines to distinguish pages.',
    steps: [
      'Create a unique value proposition for each page.',
      'Use page-specific modifiers like use case, location, or product type.',
      'Review templates that may be generating repeated titles.'
    ]
  },
  'Missing description': {
    summary: 'The page has no meta description.',
    whyItMatters: 'Descriptions influence CTR and help users understand the page before clicking.',
    steps: [
      'Write a concise description that matches the page promise.',
      'Include a benefit or call to action when relevant.',
      'Avoid duplicated descriptions across templates.'
    ]
  },
  'Duplicate meta tags': {
    summary: 'The page contains repeated meta tags that should be deduplicated.',
    whyItMatters: 'Duplicate metadata can confuse crawlers and weaken snippet quality.',
    steps: [
      'Inspect the template and remove duplicate meta output.',
      'Keep one canonical meta description and title source per page.',
      'Re-crawl after the template fix.'
    ]
  },
  'Missing H1 tag': {
    summary: 'The page has no H1 heading.',
    whyItMatters: 'The H1 helps clarify the page topic and supports content structure.',
    steps: [
      'Add a single descriptive H1 to the page.',
      'Align the H1 with the page intent and title.',
      'Make sure no CSS-only heading replacement is hiding the real H1.'
    ]
  },
  'Missing image alt text': {
    summary: 'Images are missing alt text.',
    whyItMatters: 'Alt text improves accessibility and can support image search relevance.',
    steps: [
      'Add descriptive alt text to meaningful images.',
      'Keep decorative images empty-alt when appropriate.',
      'Use concise language that describes the image role.'
    ]
  },
  'Missing image title': {
    summary: 'Images are missing title attributes where the template expects them.',
    whyItMatters: 'While not a primary ranking factor, missing image metadata often signals incomplete content quality.',
    steps: [
      'Review the image component or CMS field rules.',
      'Add titles only where they improve usability.',
      'Do not force titles onto decorative assets.'
    ]
  },
  'Canonical points to redirect': {
    summary: 'The canonical URL resolves to a redirect rather than a final page.',
    whyItMatters: 'Canonical signals should point directly at the preferred indexable URL.',
    steps: [
      'Change the canonical to the final destination URL.',
      'Make sure the preferred page returns 200 OK.',
      'Avoid canonicalizing to a URL that might change again.'
    ]
  },
  'Canonical points to broken page': {
    summary: 'The canonical URL is not reachable.',
    whyItMatters: 'A broken canonical undermines indexation and consolidation signals.',
    steps: [
      'Fix the destination page or choose a live canonical.',
      'Confirm the page returns 200 OK and is indexable.',
      'Re-run the crawl after the update.'
    ]
  },
  'Canonical chain': {
    summary: 'The canonical resolves through more than one hop.',
    whyItMatters: 'Canonical chains dilute clarity and can slow processing.',
    steps: [
      'Point all variants directly to the final canonical URL.',
      'Avoid chaining canonicals across multiple redirects.',
      'Keep sitemap and internal links aligned.'
    ]
  },
  'Recursive canonical': {
    summary: 'The page canonicalizes to itself or creates a loop.',
    whyItMatters: 'Recursive canonicals can confuse indexation logic.',
    steps: [
      'Inspect the canonical tag output for loops.',
      'Ensure each page references the intended preferred URL only once.',
      'Check CMS templates for conditional logic mistakes.'
    ]
  },
  'Pages exceed 3 MB': {
    summary: 'The page payload is too large.',
    whyItMatters: 'Large pages slow load times and can hurt crawl efficiency.',
    steps: [
      'Compress large media assets.',
      'Split overly heavy content into lighter sections or pages.',
      'Re-test after reducing the payload.'
    ]
  },
  'Low content rate': {
    summary: 'The page has too little visible content relative to its footprint.',
    whyItMatters: 'Thin pages often struggle to rank for non-branded intent.',
    steps: [
      'Expand the core answer on the page.',
      'Add supporting sections, examples, or FAQs.',
      'Align the depth of content with the search intent.'
    ]
  },
  'Low readability': {
    summary: 'The page text is difficult to read.',
    whyItMatters: 'Poor readability reduces engagement and can weaken conversion.',
    steps: [
      'Shorten long paragraphs and sentence length.',
      'Use plain language and clear headings.',
      'Break complex ideas into scannable sections.'
    ]
  }
};

export function getHowToFixGuide(errorType: string): FixGuide {
  return (
    FIX_GUIDES[errorType] ?? {
      summary: 'Review the affected URLs and fix the highest-impact pattern first.',
      whyItMatters: 'This issue is affecting crawlability, indexability, or user experience.',
      steps: [
        'Inspect the affected URLs in the modal.',
        'Compare them with healthy templates on the site.',
        'Prioritize the pages that have the most business value.'
      ]
    }
  );
}

export function listHowToFixGuides() {
  return FIX_GUIDES;
}
