import type { DataForSEOAggregateIssue, DataForSEOPageDetail, DataForSEOPageIssue } from './types';

function toSeverity(value: unknown, fallback: DataForSEOAggregateIssue['severity'] = 'medium') {
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'critical') {
    return value;
  }

  return fallback;
}

function buildIssue(
  key: string,
  label: string,
  severity: DataForSEOAggregateIssue['severity'],
  shouldTrigger: (page: Record<string, unknown>) => boolean,
  reason: (page: Record<string, unknown>) => string,
  extraInfo?: (page: Record<string, unknown>) => Record<string, unknown>
): DataForSEOPageIssue {
  return { key, label, severity, shouldTrigger, reason, extraInfo };
}

function getChecks(page: Record<string, unknown>) {
  const checks = page.checks;
  if (checks && typeof checks === 'object') {
    return checks as Record<string, unknown>;
  }

  return {};
}

const ISSUE_RULES: DataForSEOPageIssue[] = [
  buildIssue('http_4xx', 'HTTP 4xx errors', 'high', (page) => Number(page.status_code) >= 400 && Number(page.status_code) < 500, (page) => `Page returns ${page.status_code} status code.`),
  buildIssue('http_5xx', 'HTTP 5xx errors', 'critical', (page) => Number(page.status_code) >= 500, (page) => `Page returns ${page.status_code} status code.`),
  buildIssue('redirect_chain', 'Redirect chains', 'medium', (page) => Boolean(getChecks(page).redirect_chain), () => 'The page resolves through a redirect chain.'),
  buildIssue('broken_links', 'Broken links', 'high', (page) => Boolean(page.broken_links), () => 'The page contains broken links.'),
  buildIssue('broken_resources', 'Broken resources', 'medium', (page) => Boolean(page.broken_resources), () => 'The page contains broken resources.'),
  buildIssue('missing_title', 'Missing title tag', 'high', (page) => Boolean(getChecks(page).no_title), () => 'The page has no title tag.'),
  buildIssue('short_title', 'Title too short', 'low', (page) => Boolean(getChecks(page).title_too_short), () => 'The title is likely too short to communicate relevance.'),
  buildIssue('long_title', 'Title too long', 'low', (page) => Boolean(getChecks(page).title_too_long), () => 'The title is likely too long and may truncate in SERPs.'),
  buildIssue('duplicate_title', 'Duplicate title tags', 'high', (page) => Boolean(getChecks(page).duplicate_title_tag || page.duplicate_title), () => 'The title tag duplicates another page.'),
  buildIssue('missing_description', 'Missing description', 'medium', (page) => Boolean(getChecks(page).no_description), () => 'The page has no meta description.'),
  buildIssue('duplicate_meta_tags', 'Duplicate meta tags', 'low', (page) => {
    const duplicateMetaTags = page.duplicate_meta_tags;
    return Boolean(getChecks(page).duplicate_meta_tags || (Array.isArray(duplicateMetaTags) && duplicateMetaTags.length > 0));
  }, () => 'The page contains duplicate meta tags.'),
  buildIssue('missing_h1', 'Missing H1 tag', 'high', (page) => Boolean(getChecks(page).no_h1_tag), () => 'The page has no H1 tag.'),
  buildIssue('missing_alt', 'Missing image alt text', 'low', (page) => Boolean(getChecks(page).no_image_alt), () => 'The page is missing alt text on images.'),
  buildIssue('missing_image_title', 'Missing image title', 'low', (page) => Boolean(getChecks(page).no_image_title), () => 'The page is missing image title attributes.'),
  buildIssue('canonical_redirect', 'Canonical points to redirect', 'medium', (page) => Boolean(getChecks(page).canonical_to_redirect), () => 'The canonical URL points to a redirecting page.'),
  buildIssue('canonical_broken', 'Canonical points to broken page', 'high', (page) => Boolean(getChecks(page).canonical_to_broken), () => 'The canonical URL points to a broken page.'),
  buildIssue('canonical_chain', 'Canonical chain', 'medium', (page) => Boolean(getChecks(page).canonical_chain), () => 'The page canonicalizes through multiple hops.'),
  buildIssue('recursive_canonical', 'Recursive canonical', 'high', (page) => Boolean(getChecks(page).recursive_canonical), () => 'The canonical tag creates a loop or points to itself.'),
  buildIssue('no_doctype', 'Missing doctype', 'medium', (page) => Boolean(getChecks(page).no_doctype), () => 'The HTML document is missing a doctype declaration.'),
  buildIssue('no_encoding_meta_tag', 'Missing charset meta', 'low', (page) => Boolean(getChecks(page).no_encoding_meta_tag), () => 'The page is missing a character encoding declaration.'),
  buildIssue('meta_refresh_redirect', 'Meta refresh redirect', 'medium', (page) => Boolean(getChecks(page).has_meta_refresh_redirect), () => 'The page uses a meta refresh redirect.'),
  buildIssue('render_blocking_resources', 'Render-blocking resources', 'low', (page) => Boolean(getChecks(page).has_render_blocking_resources), () => 'The page has render-blocking resources.'),
  buildIssue('low_content_rate', 'Low content rate', 'medium', (page) => Boolean(getChecks(page).low_content_rate), () => 'The page has too little visible content.'),
  buildIssue('low_readability', 'Low readability', 'low', (page) => Boolean(getChecks(page).low_readability_rate), () => 'The page content is hard to read.'),
  buildIssue('orphan_page', 'Orphan page', 'medium', (page) => Boolean(getChecks(page).is_orphan_page), () => 'The page has no internal links pointing to it.'),
  buildIssue('link_relation_conflict', 'Link relation conflict', 'medium', (page) => Boolean(getChecks(page).is_link_relation_conflict), () => 'The page has conflicting link relation signals.'),
  buildIssue('large_page_size', 'Pages exceed 3 MB', 'medium', (page) => Boolean(getChecks(page).size_greater_than_3mb), () => 'The page payload is too large.'),
  buildIssue('http_to_https', 'HTTP URL still active', 'medium', (page) => Boolean(getChecks(page).is_http), () => 'The page is still served over HTTP.'),
  buildIssue('www_variation', 'WWW variation in use', 'low', (page) => Boolean(getChecks(page).is_www), () => 'The URL uses a WWW variation that may need normalization.'),
  buildIssue('lorem_ipsum', 'Lorem ipsum content', 'medium', (page) => Boolean(getChecks(page).lorem_ipsum), () => 'The page contains placeholder text.'),
  buildIssue('from_sitemap', 'Missing sitemap coverage', 'low', (page) => Boolean(getChecks(page).from_sitemap === false), () => 'The page is not present in the sitemap crawl set.')
];

export function getDataForSEOIssueRules() {
  return ISSUE_RULES;
}

export function mapPageToIssues(page: Record<string, unknown>, detectedAt: string): DataForSEOPageDetail[] {
  const url = typeof page.url === 'string' && page.url ? page.url : '';
  if (!url) {
    return [];
  }

  const statusCode = typeof page.status_code === 'number' ? page.status_code : undefined;
  const onpageScore = typeof page.onpage_score === 'number' ? page.onpage_score : undefined;
  const crawlProgress = typeof page.crawl_progress === 'string' ? page.crawl_progress : undefined;

  return ISSUE_RULES.filter((rule) => rule.shouldTrigger(page)).map((rule) => ({
    url,
    statusCode,
    crawlProgress,
    onpageScore,
    detectedAt,
    issueKey: rule.key,
    issueLabel: rule.label,
    reason: rule.reason(page),
    additionalInfo: {
      ...(rule.extraInfo ? rule.extraInfo(page) : {}),
      title: typeof page.meta === 'object' && page.meta !== null && typeof (page.meta as Record<string, unknown>).title === 'string'
        ? (page.meta as Record<string, unknown>).title
        : undefined,
      canonical: typeof page.meta === 'object' && page.meta !== null && typeof (page.meta as Record<string, unknown>).canonical === 'string'
        ? (page.meta as Record<string, unknown>).canonical
        : undefined,
      contentWordCount:
        typeof page.content === 'object' && page.content !== null && typeof (page.content as Record<string, unknown>).plain_text_word_count === 'number'
          ? (page.content as Record<string, unknown>).plain_text_word_count
          : undefined,
      pageTiming:
        typeof page.page_timing === 'object' && page.page_timing !== null ? (page.page_timing as Record<string, unknown>) : undefined
    }
  }));
}

export function aggregatePageIssues(pages: DataForSEOPageDetail[]): DataForSEOAggregateIssue[] {
  const grouped = new Map<string, DataForSEOAggregateIssue>();

  for (const page of pages) {
    const current = grouped.get(page.issueKey);
    if (!current) {
      grouped.set(page.issueKey, {
        key: page.issueKey,
        label: page.issueLabel,
        severity: 'medium',
        count: 1,
        affectedUrls: [page]
      });
      continue;
    }

    current.count += 1;
    current.affectedUrls.push(page);
  }

  for (const issue of grouped.values()) {
    const rule = ISSUE_RULES.find((item) => item.key === issue.key);
    issue.severity = toSeverity(rule?.severity ?? issue.severity);
  }

  return Array.from(grouped.values()).sort((left, right) => {
    const severityRank: Record<DataForSEOAggregateIssue['severity'], number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };

    return severityRank[right.severity] - severityRank[left.severity] || right.count - left.count;
  });
}
