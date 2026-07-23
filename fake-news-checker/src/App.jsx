// src/App.jsx
//
// [초보자를 위한 설명]
// 이 파일은 화면에 보이는 모든 것을 담당하는 React 컴포넌트입니다.
// 사용자가 뉴스 내용을 입력하고 "분석하기" 버튼을 누르면,
// 우리 서버(/api/generate)에 요청을 보내고, 그 결과를 화면에 카드 형태로 보여줍니다.

import { useState } from "react";
import "./style.css";

// 판별 결과에 따라 다른 색상 클래스를 반환하는 함수
function getResultClass(result) {
  if (result === "사실 가능성이 높음") return "result-true";
  if (result === "가짜뉴스 가능성이 높음") return "result-fake";
  return "result-suspicious"; // 의심되는 정보 또는 그 외
}

// 브라우저의 localStorage에 API 키를 저장할 때 사용하는 키 이름
const STORAGE_KEY = "gemini_api_key";

export default function App() {
  // 사용자가 입력한 뉴스 내용
  const [newsText, setNewsText] = useState("");
  // 로딩 중인지 여부 (로딩 화면 표시용)
  const [loading, setLoading] = useState(false);
  // 에러 메시지
  const [error, setError] = useState("");
  // AI 분석 결과
  const [analysis, setAnalysis] = useState(null);

  // 사용자가 직접 입력하는 Gemini API 키
  // 처음 화면을 열 때 localStorage에 저장된 값이 있으면 그걸 불러옵니다.
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  // API 키 입력창(모달)을 열지 닫을지 여부
  const [showKeyModal, setShowKeyModal] = useState(false);
  // 입력창 안에서 임시로 편집 중인 키 값 (저장 버튼을 눌러야 실제로 반영됨)
  const [keyDraft, setKeyDraft] = useState(apiKey);

  // "저장" 버튼을 눌렀을 때: 값을 state와 localStorage에 함께 저장
  function handleSaveKey() {
    const trimmed = keyDraft.trim();
    setApiKey(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_KEY, trimmed);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage를 쓸 수 없는 환경(사생활 보호 모드 등)이어도 앱은 계속 동작하게 함
    }
    setShowKeyModal(false);
  }

  // "분석하기" 버튼을 눌렀을 때 실행되는 함수
  async function handleAnalyze() {
    // 입력값이 비어있으면 에러 표시 후 중단
    if (!newsText.trim()) {
      setError("분석할 뉴스 내용을 입력해주세요.");
      return;
    }

    // API 키가 없으면 입력창을 열어주고 중단
    if (!apiKey.trim()) {
      setError("먼저 Gemini API 키를 입력해주세요.");
      setShowKeyModal(true);
      return;
    }

    setError("");
    setAnalysis(null);
    setLoading(true);

    try {
      // 우리 서버리스 함수(/api/generate)로 요청 전송
      // API 키는 매 요청마다 헤더에 담아 서버로 함께 보냅니다.
      // (서버에는 저장하지 않고, 그 요청 한 번을 처리하는 데만 사용됩니다)
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey.trim(),
        },
        body: JSON.stringify({ newsText }),
      });

      const data = await response.json();

      // 서버에서 에러를 반환한 경우 (API 호출 실패 처리)
      if (!response.ok || data.error) {
        setError(data.error || "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      // 정상적으로 분석 결과를 받은 경우
      setAnalysis(data);
    } catch (err) {
      // 네트워크 오류 등 예상하지 못한 에러 처리
      setError("서버와 통신하는 중 문제가 발생했습니다. 인터넷 연결을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="container">
        {/* 제목 영역 */}
        <header className="header">
          <div className="header-top">
            <div>
              <h1>Fact Check AI</h1>
              <p className="subtitle">AI 가짜뉴스 판별기</p>
            </div>
            <button
              className="key-btn"
              onClick={() => {
                setKeyDraft(apiKey);
                setShowKeyModal(true);
              }}
            >
              {apiKey ? "🔑 API 키 변경" : "🔑 API 키 입력"}
            </button>
          </div>
        </header>

        {/* API 키 입력 모달 */}
        {showKeyModal && (
          <div className="modal-overlay" onClick={() => setShowKeyModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h2>Gemini API 키 입력</h2>
              <p className="modal-desc">
                Google Cloud 콘솔 또는 AI 스튜디오에서 발급받은 Gemini API 키를 입력하세요.
                입력한 키는 이 브라우저에만 저장되며, 분석 요청 시에만 서버로 전달됩니다.
              </p>
              <input
                type="password"
                className="key-input"
                placeholder="AIza로 시작하는 API 키를 붙여넣으세요"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                <button className="modal-btn cancel" onClick={() => setShowKeyModal(false)}>
                  취소
                </button>
                <button className="modal-btn save" onClick={handleSaveKey}>
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 입력 영역 */}
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

        {/* 에러 메시지 */}
        {error && <div className="error-box">⚠️ {error}</div>}

        {/* 로딩 화면 */}
        {loading && (
          <div className="loading-box">
            <div className="spinner" />
            <p>AI가 뉴스 내용을 분석하고 있습니다...</p>
          </div>
        )}

        {/* 결과 카드 */}
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
