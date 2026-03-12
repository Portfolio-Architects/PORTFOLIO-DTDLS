/**
 * @module nickname.service
 * @description Random Korean nickname generator for anonymous user profiles.
 * Architecture Layer: Service (pure business logic, no I/O)
 * 
 * Constraint: Nicknames MUST be exactly 3 characters.
 */

/** 3-character Korean nicknames pool */
const NICKNAMES_3CHAR: readonly string[] = [
  "햇살이", "달빛이", "별똥이", "구름이", "바람이",
  "파도이", "나무이", "꽃잎이", "이슬이", "무지개",
  "호랑이", "토끼이", "강아지", "고양이", "팬더이",
  "사슴이", "다람이", "부엉이", "참새이", "돌고래",
  "동탄이", "반달이", "솜사탕", "콩나물", "떡볶이",
];

/**
 * Generates a random 3-character Korean nickname.
 * @returns A 3-char nickname string (e.g., '호랑이')
 */
export function generateRandomNickname(): string {
  return NICKNAMES_3CHAR[Math.floor(Math.random() * NICKNAMES_3CHAR.length)];
}

/**
 * Validates that a nickname is exactly 3 characters.
 * @param nickname - The nickname to validate
 * @returns true if valid
 */
export function isValidNickname(nickname: string): boolean {
  return [...nickname].length === 3;
}
