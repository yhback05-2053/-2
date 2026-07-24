# Fact Check AI - AI 가짜뉴스 판별기

뉴스 기사나 문장을 입력하면 Gemini AI가 "현재 정보 기준"으로
가짜뉴스 가능성을 분석해주는 웹앱입니다.

## 폴더 구조

```
/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example
├── src/
│   ├── App.jsx        # 화면 UI 및 상태 관리
│   ├── main.jsx        # React 진입점
│   └── style.css       # 스타일 (반응형 포함)
└── api/
    └── generate.js     # Gemini API 호출 서버리스 함수
```

## 0) API 키 입력 방식 (중요)

이 앱은 화면 오른쪽 상단의 **"🔑 API 키 입력"** 버튼을 눌러
사용자가 직접 Gemini API 키를 입력할 수 있습니다.

- 입력한 키는 서버가 아니라 **사용자의 브라우저(localStorage)에만 저장**됩니다.
- 분석 요청을 보낼 때만 `x-gemini-api-key` 라는 헤더에 담아 `api/generate.js`로 전달되고,
  그 요청 처리에만 사용된 뒤 서버에 저장되지 않습니다.
- 만약 사용자가 키를 입력하지 않았는데, 서버(Vercel)에 `GEMINI_API_KEY` 환경변수가
  설정되어 있다면 그 값을 대신 사용합니다. (둘 다 없으면 에러 메시지를 보여줍니다.)

즉, **배포자가 직접 키를 관리하고 싶다면** 기존처럼 Vercel 환경변수만 설정해도 되고,
**여러 사용자가 각자 자기 키로 쓰게 하고 싶다면** 이 입력창을 그대로 활용하면 됩니다.

## 1) 로컬에서 실행하는 방법

```bash
# 1. 패키지 설치
npm install

# 2. Vercel CLI 설치 (아직 없다면)
npm i -g vercel

# 3. .env 파일 만들기
cp .env.example .env
# .env 파일을 열어 GEMINI_API_KEY=발급받은키 형태로 수정

# 4. 로컬 개발 서버 실행 (프론트엔드 + api 함수 동시 실행)
vercel dev
```

브라우저에서 `http://localhost:3000` 으로 접속하면 됩니다.

> 참고: `npm run dev`(Vite만 실행)로는 `/api/generate` 서버리스 함수가 동작하지 않습니다.
> 반드시 `vercel dev`로 실행해야 API 요청까지 정상적으로 테스트할 수 있습니다.

## 2) GitHub 업로드 후 Vercel 배포하기

1. 이 프로젝트를 GitHub 저장소에 push 합니다.
2. [Vercel 대시보드](https://vercel.com/new) 에서 해당 저장소를 Import 합니다.
3. **Environment Variables** 설정에서 다음을 추가합니다.
   - Key: `GEMINI_API_KEY`
   - Value: 발급받은 Gemini API 키
4. Deploy 버튼을 누르면 자동으로 빌드 및 배포가 진행됩니다.

배포가 끝나면 발급된 주소(예: `https://your-app.vercel.app`)로 바로 접속해서 사용할 수 있습니다.

## 3) API 응답 형식

`api/generate.js`는 아래와 같은 형태의 JSON을 반환합니다.

```json
{
  "result": "가짜뉴스 가능성이 높음",
  "fakeProbability": 85,
  "confidence": 90,
  "reason": "현재 정보 기준 분석 결과, 검증되지 않은 주장과 출처 부족이 확인됩니다.",
  "explanation": "해당 내용은 공식 자료와 일치하지 않으며, 구체적인 출처가 제시되어 있지 않습니다.",
  "verificationNeeded": ["발언의 출처가 실제 인물/기관인지 확인 필요", "인용된 통계의 원본 확인 필요"],
  "verificationMethods": ["공식 홈페이지 또는 보도자료 확인", "복수의 신뢰할 수 있는 언론사 교차 확인", "팩트체크 전문 기관 검색"]
}
```

- `result`: "사실 가능성이 높음" / "의심되는 정보" / "가짜뉴스 가능성이 높음" 중 하나
- `fakeProbability`: 거짓일 확률 (%)
- `confidence`: 이 분석 자체에 대한 신뢰도 (%)
- AI는 절대 "100% 가짜"처럼 확정적으로 말하지 않고, 항상 "현재 정보 기준 분석 결과"라는 전제를 사용하도록 프롬프트에서 강제하고 있습니다.

## 4) 주의사항

- 이 앱의 결과는 참고용이며, 최종 판단은 사용자가 공식 출처를 직접 확인한 뒤 내려야 합니다.
- API 키는 절대 코드에 직접 작성하지 않고, 항상 환경변수(`GEMINI_API_KEY`)로만 관리합니다.
