// api/generate.js
//
// [초보자를 위한 설명]
// 이 파일은 "서버리스 함수(Serverless Function)"입니다.
// 브라우저(프론트엔드)가 아니라 Vercel의 서버에서 실행되기 때문에,
// 여기에서만 Gemini API 키를 안전하게 사용할 수 있습니다.
// 프론트엔드는 절대 Gemini API를 직접 호출하지 않고,
// 항상 "/api/generate" 라는 주소로 이 함수를 호출합니다.

const MODEL = "gemini-3.1-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// AI에게 역할과 규칙을 알려주는 시스템 프롬프트입니다.
// - 확정적으로 "100% 가짜"라고 말하지 말 것
// - 반드시 "현재 정보 기준 분석 결과"라는 표현을 사용할 것
// - 결과는 반드시 정해진 JSON 형식으로만 출력할 것
const SYSTEM_PROMPT = `당신은 뉴스/게시글의 가짜뉴스 여부를 분석하는 팩트체크 AI입니다.

[반드시 지켜야 할 규칙]
1. 절대로 "100% 가짜다", "완전히 확실하다" 처럼 100% 확정하는 표현을 쓰지 마세요.
2. 모든 판단 앞에는 항상 "현재 정보 기준 분석 결과"라는 전제가 깔려 있다고 생각하고 서술하세요.
3. 가능하면 사실관계를 알고 있는 공신력 있는 정보(공식 발표, 주요 언론, 공공기관 통계 등)를 기준으로 판단하되,
   확실하지 않은 부분은 "확인이 필요한 부분"으로 분리해서 알려주세요.
4. 아래 JSON 형식 그대로만 출력하세요. 그 외의 설명, 코드블록 표시(\`\`\`), 인사말은 절대 추가하지 마세요.

[출력 JSON 형식]
{
  "result": "사실 가능성이 높음" 또는 "의심되는 정보" 또는 "가짜뉴스 가능성이 높음" 중 하나,
  "fakeProbability": 0부터 100 사이의 정수 (거짓일 확률, %),
  "confidence": 0부터 100 사이의 정수 (이 분석 결과 자체에 대한 AI의 신뢰도, %),
  "reason": "판단 근거를 2~4문장으로 설명 (반드시 '현재 정보 기준 분석 결과'라는 표현 포함)",
  "explanation": "해당 내용이 왜 문제가 있는지 혹은 왜 신뢰할 만한지에 대한 구체적인 설명",
  "verificationNeeded": ["확인이 필요한 구체적인 부분들을 배열로"],
  "verificationMethods": ["사용자가 직접 검증해볼 수 있는 방법들을 배열로 (예: 공식 기관 홈페이지 확인, 복수 언론사 교차 확인 등)"]
}`;

module.exports = async function handler(req, res) {
  // 1. POST 요청인지 확인
  if (req.method !== "POST") {
    res.status(405).json({ error: "이 API는 POST 요청만 지원합니다." });
    return;
  }

  // 2. API 키 읽기
  // - 사용자가 웹앱 화면에서 직접 입력한 키가 있다면 "x-gemini-api-key" 헤더로 전달됩니다. (우선 사용)
  // - 없다면 서버에 등록된 환경변수 GEMINI_API_KEY를 사용합니다. (코드에 직접 쓰지 않음!)
  const clientKey = req.headers["x-gemini-api-key"];
  const apiKey = (clientKey && clientKey.trim()) || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    res.status(400).json({
      error:
        "Gemini API 키가 없습니다. 화면 상단의 'API 키 입력' 버튼을 눌러 키를 입력하거나, 서버에 GEMINI_API_KEY 환경변수를 설정해주세요.",
    });
    return;
  }

  try {
    // 3. 사용자가 보낸 뉴스 내용 받기
    const { newsText } = req.body || {};

    if (!newsText || !newsText.trim()) {
      res.status(400).json({ error: "분석할 뉴스 내용을 입력해주세요." });
      return;
    }

    // 4. Gemini API에 보낼 요청 본문 만들기
    const requestBody = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `다음 뉴스/게시글 내용을 분석해주세요:\n\n"""\n${newsText}\n"""`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    };

    // 5. Gemini API 호출
    const geminiResponse = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const geminiData = await geminiResponse.json();

    // 6. Gemini API 자체에서 에러가 났는지 확인 (API 호출 실패 처리)
    if (!geminiResponse.ok) {
      res.status(geminiResponse.status).json({
        error: geminiData?.error?.message || "Gemini API 호출 중 오류가 발생했습니다.",
      });
      return;
    }

    // 7. AI 응답에서 텍스트 부분만 추출
    const candidate = geminiData?.candidates?.[0];
    const rawText =
      candidate?.content?.parts?.map((part) => part.text || "").join("\n") || "";

    // 혹시 AI가 ```json ... ``` 형태로 감싸서 답했다면 제거
    const cleanedText = rawText.replace(/```json|```/g, "").trim();

    // 8. JSON으로 변환 시도
    let analysisResult;
    try {
      analysisResult = JSON.parse(cleanedText);
    } catch (parseError) {
      res.status(200).json({
        error: "AI 응답을 분석 가능한 형식으로 변환하지 못했습니다. 다시 시도해주세요.",
        rawText,
      });
      return;
    }

    // 9. 최종 결과를 프론트엔드로 전달
    res.status(200).json(analysisResult);
  } catch (err) {
    // 예상하지 못한 서버 오류 처리
    res.status(500).json({
      error: err.message || "서버에서 알 수 없는 오류가 발생했습니다.",
    });
  }
};
