---
description: DTDLS 프로젝트 코드 변경 후 Git 커밋 & 푸시
---

# DTDLS Git Push 워크플로우

코드 변경이 완료되면 아래 단계를 수행합니다.

// turbo-all

1. 변경 파일을 스테이징합니다:
```
git add -A
```
작업 디렉토리: `d:\Desktop\PORTFOLIO\PORTFOLIO-DTDLS`

2. 변경 내역을 커밋합니다 (커밋 메시지는 변경 내용에 맞게 작성):
```
git commit -m "<type>: <한글 설명>"
```
작업 디렉토리: `d:\Desktop\PORTFOLIO\PORTFOLIO-DTDLS`

커밋 타입 가이드:
- `feat`: 새 기능 추가
- `fix`: 버그 수정
- `style`: 디자인/UI 변경
- `refactor`: 코드 리팩토링
- `docs`: 문서 변경

3. 원격 저장소에 푸시합니다:
```
git push
```
작업 디렉토리: `d:\Desktop\PORTFOLIO\PORTFOLIO-DTDLS`
