import { XMLParser } from 'fast-xml-parser';

// RSS 기사 아이템 타입
export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  sourceName: string;
}

// RSS 피드 설정 타입
export interface RssFeedConfig {
  url: string;
  sourceName: string;   // DB sources.name 에 저장될 값
  categorySlug: string; // DB categories.slug 와 매핑
  websiteUrl?: string;
}

// 카테고리별 RSS 피드 목록 (연합뉴스)
// categorySlug는 DB categories.slug 값과 일치해야 함
export const RSS_FEEDS: RssFeedConfig[] = [
  {
    url: 'https://www.yna.co.kr/rss/politics.xml',
    sourceName: '연합뉴스',
    categorySlug: 'politics',
    websiteUrl: 'https://www.yna.co.kr',
  },
  {
    url: 'https://www.yna.co.kr/rss/economy.xml',
    sourceName: '연합뉴스',
    categorySlug: 'economy',
    websiteUrl: 'https://www.yna.co.kr',
  },
  {
    url: 'https://www.yna.co.kr/rss/society.xml',
    sourceName: '연합뉴스',
    categorySlug: 'society',
    websiteUrl: 'https://www.yna.co.kr',
  },
  {
    url: 'https://www.yna.co.kr/rss/international.xml',
    sourceName: '연합뉴스',
    categorySlug: 'international',
    websiteUrl: 'https://www.yna.co.kr',
  },
  {
    url: 'https://www.yna.co.kr/rss/industry.xml',
    sourceName: '연합뉴스',
    categorySlug: 'tech',
    websiteUrl: 'https://www.yna.co.kr',
  },
];

// CDATA 또는 일반 문자열 추출
function extractText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    // fast-xml-parser CDATA 처리: { __cdata: '...' } 형태
    const obj = value as Record<string, unknown>;
    if (typeof obj['__cdata'] === 'string') return obj['__cdata'].trim();
    if (typeof obj['#text'] === 'string') return obj['#text'].trim();
  }
  return '';
}

// HTML 태그 제거
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

// XML 문자열 → RssItem[] 파싱
function parseRssXml(xml: string, sourceName: string): RssItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    cdataPropName: '__cdata',
    isArray: (name) => name === 'item',
  });

  const parsed = parser.parse(xml);
  const channel = parsed?.rss?.channel;
  if (!channel) return [];

  const items: unknown[] = Array.isArray(channel.item) ? channel.item : [];

  return items.map((raw) => {
    const item = raw as Record<string, unknown>;
    const title = extractText(item['title']);
    const link = extractText(item['link']) || extractText(item['guid']);
    const rawDesc = extractText(item['description']);
    const description = stripHtml(rawDesc);
    const pubDate = extractText(item['pubDate']);

    return { title, link, description, pubDate, sourceName };
  }).filter((item) => item.title && item.link);
}

// 단일 RSS 피드 fetch + 파싱 (최대 10개 반환)
async function fetchRssFeed(config: RssFeedConfig): Promise<RssItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(config.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${config.url}`);
    }

    const xml = await response.text();
    const items = parseRssXml(xml, config.sourceName);

    // 피드당 최대 3개로 제한 (카테고리별 최신 뉴스만 수집)
    return items.slice(0, 3);
  } finally {
    clearTimeout(timeoutId);
  }
}

// 전체 RSS 피드 수집 (실패한 피드는 스킵)
export async function fetchAllFeeds(): Promise<{ item: RssItem; categorySlug: string }[]> {
  const results: { item: RssItem; categorySlug: string }[] = [];

  for (const config of RSS_FEEDS) {
    try {
      const items = await fetchRssFeed(config);
      for (const item of items) {
        results.push({ item, categorySlug: config.categorySlug });
      }
    } catch (error) {
      // 피드 fetch 실패 시 해당 피드만 스킵
      console.error(`RSS 피드 수집 실패: ${config.sourceName}`, error);
    }
  }

  return results;
}
