// src/main.jsx
//
// [초보자를 위한 설명]
// 이 파일은 React 앱이 실제로 화면(HTML)에 연결되는 시작점입니다.
// index.html 안의 <div id="root"></div> 위치에 App 컴포넌트를 그려줍니다.

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
