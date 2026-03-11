import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 기사 제목 + 본문으로 Claude API 한국어 요약 생성
export async function summarizeArticle(title: string, description: string): Promise<string> {
  // 본문이 너무 짧으면 Claude API 호출 없이 그대로 반환
  if (!description || description.length < 20) {
    return title;
  }

  // 본문이 너무 길면 2000자로 자름 (토큰 절약)
  const trimmedDesc = description.length > 2000
    ? description.slice(0, 2000) + '...'
    : description;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `다음 뉴스 기사를 한국어로 3-4문장으로 요약해주세요.
핵심 내용만 간결하게 작성하고, 불필요한 부연 설명은 생략해주세요.

제목: ${title}
내용: ${trimmedDesc}

요약:`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }

    // 예상치 못한 응답 타입 시 fallback
    return description.slice(0, 200).trim() + '...';
  } catch (error) {
    // Claude API 실패 시 description 앞부분으로 fallback
    console.error('Claude API 요약 실패:', error);
    return description.slice(0, 200).trim() + '...';
  }
}
