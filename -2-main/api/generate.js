const MODEL = "gemini-3.1-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT = `당신은 뉴스/게시글의 가짜뉴스 여부를 분석하는 팩트체크 AI입니다.

[반드시 지켜야 할 규칙]
1. 절대로 "100% 가짜다", "완전히 확실하다" 처럼 100% 확정하는 표현을 쓰지 마세요.
2. 모든 판단 앞에는 항상 "현재 정보 기준 분석 결과"라는 전제가 깔려 있다고 생각하고 서술하세요.
3. 가능하면 사실관계를 알고 있는 공신력 있는 정보(공식 발표, 주요 언론, 공공기관 통계 등)를 기준으로 판단하되,
   확실하지 않은 부분은 "확인이 필요한 부분"으로 분리해서 알려주세요.
4. 아래 JSON 형식 그대로만 출력하세요. 그 외의 설명, 코드블록 표시, 인사말은 절대 추가하지 마세요.

[출력 JSON 형식]
{
  "result": "사실 가능성이 높음" 또는 "의심되는 정보" 또는 "가짜뉴스 가능성이 높음" 중 하나,
  "fakeProbability": 0부터 100 사이의 정수,
  "confidence": 0부터 100 사이의 정수,
  "reason": "판단 근거를 2~4문장으로 설명 (반드시 '현재 정보 기준 분석 결과'라는 표현 포함)",
  "explanation": "왜 문제가 있는지 혹은 왜 신뢰할 만한지에 대한 구체적인 설명",
  "verificationNeeded": ["확인이 필요한 구체적인 부분들을 배열로"],
  "verificationMethods": ["사용자가 직접 검증해볼 수 있는 방법들을 배열로"]
}`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "이 API는 POST 요청만 지원합니다." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    res.status(500).json({
      error: "서버에 GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다.",
    });
    return;
  }

  try {
    const { newsText } = req.body || {};

    if (!newsText || !newsText.trim()) {
      res.status(400).json({ error: "분석할 뉴스 내용을 입력해주세요." });
      return;
    }

    const requestBody = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: "user",
          parts: [{ text: `다음 뉴스/게시글 내용을 분석해주세요:\n\n"""\n${newsText}\n"""` }],
        },
      ],
      generationConfig: { temperature: 0.2 },
    };

    const geminiResponse = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      res.status(geminiResponse.status).json({
        error: geminiData?.error?.message || "Gemini API 호출 중 오류가 발생했습니다.",
      });
      return;
    }

    const candidate = geminiData?.candidates?.[0];
    const rawText = candidate?.content?.parts?.map((part) => part.text || "").join("\n") || "";
    const cleanedText = rawText.replace(/```json|```/g, "").trim();

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

    res.status(200).json(analysisResult);
  } catch (err) {
    res.status(500).json({ error: err.message || "서버에서 알 수 없는 오류가 발생했습니다." });
  }
};
