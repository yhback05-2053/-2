// src/App.jsx
import { useState } from "react";
import "./style.css";

function getResultClass(result) {
  if (result === "사실 가능성이 높음") return "result-true";
  if (result === "가짜뉴스 가능성이 높음") return "result-fake";
  return "result-suspicious";
}

export default function App() {
  const [newsText, setNewsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);

  async function handleAnalyze() {
    if (!newsText.trim()) {
      setError("분석할 뉴스 내용을 입력해주세요.");
      return;
    }

    setError("");
    setAnalysis(null);
    setLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newsText }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      setAnalysis(data);
    } catch (err) {
      setError("서버와 통신하는 중 문제가 발생했습니다. 인터넷 연결을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-top">
            <div>
              <h1>Fact Check AI</h1>
              <p className="subtitle">AI 가짜뉴스 판별기</p>
            </div>
          </div>
        </header>

        <section className="input-card">
          <label htmlFor="news-input" className="input-label">
            분석할 뉴스 내용을 입력하세요
          </label>
          <textarea
            id="news-input"
            className="news-input"
            placeholder="예: 오늘 정부가 발표한 내용에 따르면... (기사 전문이나 의심되는 문장을 붙여넣어주세요)"
            value={newsText}
            onChange={(e) => setNewsText(e.target.value)}
            rows={8}
          />

          <button className="analyze-btn" onClick={handleAnalyze} disabled={loading}>
            {loading ? "분석 중..." : "분석하기"}
          </button>
        </section>

        {error && <div className="error-box">⚠️ {error}</div>}

        {loading && (
          <div className="loading-box">
            <div className="spinner" />
            <p>AI가 뉴스 내용을 분석하고 있습니다...</p>
          </div>
        )}

        {analysis && !loading && (
          <section className="result-card">
            <div className={`result-badge ${getResultClass(analysis.result)}`}>
              판별 결과: {analysis.result}
            </div>

            <div className="stat-row">
              <div className="stat-box">
                <div className="stat-label">거짓 확률</div>
                <div className="stat-value fake">{analysis.fakeProbability}%</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">신뢰도 점수</div>
                <div className="stat-value confidence">{analysis.confidence}%</div>
              </div>
            </div>

            <div className="detail-block">
              <h3>AI 분석 근거</h3>
              <p>{analysis.reason}</p>
            </div>

            <div className="detail-block">
              <h3>왜 문제가 있는지 (또는 신뢰할 수 있는지) 설명</h3>
              <p>{analysis.explanation}</p>
            </div>

            {analysis.verificationNeeded?.length > 0 && (
              <div className="detail-block">
                <h3>확인이 필요한 부분</h3>
                <ul>
                  {analysis.verificationNeeded.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.verificationMethods?.length > 0 && (
              <div className="detail-block">
                <h3>참고할 수 있는 검증 방법</h3>
                <ul>
                  {analysis.verificationMethods.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="disclaimer">
              ※ 이 결과는 현재 정보 기준 분석 결과이며, 100% 확정된 사실 판단이 아닙니다.
              최종 판단은 공식 출처를 직접 확인한 뒤 내려주세요.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
