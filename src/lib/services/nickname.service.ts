/**
 * @module nickname.service
 * @description Random Korean nickname generator for anonymous user profiles.
 * Architecture Layer: Service (pure business logic, no I/O)
 * 
 * Naming: frontName (4 chars, default "동탄사는") + nickname/lastName (3 chars)
 */

/** Default front name */
export const DEFAULT_FRONT_NAME = '동탄사는';

/** 3-character Korean nicknames pool */
const NICKNAMES_3CHAR: readonly string[] = [
  "햇살이", "달빛이", "별똥이", "구름이", "바람이",
  "파도이", "나무이", "꽃잎이", "이슬이", "무지개",
  "호랑이", "토끼이", "강아지", "고양이", "팬더이",
  "사슴이", "다람이", "부엉이", "참새이", "돌고래",
  "동탄이", "반달이", "솜사탕", "콩나물", "떡볶이",
];

/**
 * Generates a random 3-character Korean nickname (last name part).
 */
export function generateRandomNickname(): string {
  return NICKNAMES_3CHAR[Math.floor(Math.random() * NICKNAMES_3CHAR.length)];
}

/**
 * Validates that a nickname (last name) is exactly 3 characters.
 */
export function isValidNickname(nickname: string): boolean {
  return [...nickname].length === 3;
}

/**
 * Validates that a front name is exactly 4 characters.
 */
export function isValidFrontName(frontName: string): boolean {
  return [...frontName].length === 4;
}
