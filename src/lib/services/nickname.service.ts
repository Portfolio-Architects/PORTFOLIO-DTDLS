/**
 * @module nickname.service
 * @description Random Korean nickname generator for anonymous user profiles.
 * Architecture Layer: Service (pure business logic, no I/O)
 */

const ADJECTIVES: readonly string[] = [
  "동탄사는", "행복한", "투자하는", "지혜로운", "빠른",
  "냉철한", "따뜻한", "친절한", "열정적인", "똑똑한"
];

const NOUNS: readonly string[] = [
  "사자", "코끼리", "호랑이", "부린이", "분석가",
  "요정", "자본가", "강아지", "고양이", "독수리"
];

/**
 * Generates a random Korean adjective-noun nickname.
 * @returns A nickname string (e.g., '똑똑한 분석가')
 */
export function generateRandomNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}
