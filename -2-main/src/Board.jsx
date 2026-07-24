// src/Board.jsx
//
// 사용자 의견 게시판 컴포넌트
// - 입력창에 글을 쓰고 [등록] 버튼을 누르면 Firestore(posts 컬렉션)에 저장됩니다.
// - 앱이 열리면 Firestore에 저장된 글을 불러와 최신순으로 목록에 보여줍니다.
// - onSnapshot을 사용해 실시간으로 목록이 갱신됩니다.

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export default function Board() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState("");

  // 앱이 열리면 Firestore에서 글 목록을 최신순으로 불러온다
  useEffect(() => {
    const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(list);
        setLoadingPosts(false);
      },
      (err) => {
        console.error(err);
        setError("게시글을 불러오는 중 문제가 발생했습니다.");
        setLoadingPosts(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function handleSubmit() {
    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await addDoc(collection(db, "posts"), {
        content: content.trim(),
        createdAt: serverTimestamp(),
      });
      setContent("");
    } catch (err) {
      console.error(err);
      setError("등록 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(timestamp) {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <section className="board-section">
      <h2 className="board-title">사용자 의견 게시판</h2>

      <div className="board-input-card">
        <textarea
          className="board-input"
          placeholder="의견을 남겨주세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <button className="board-submit-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "등록 중..." : "등록"}
        </button>
      </div>

      {error && <div className="error-box board-error">⚠️ {error}</div>}

      <div className="board-list">
        {loadingPosts ? (
          <p className="board-empty">게시글을 불러오는 중입니다...</p>
        ) : posts.length === 0 ? (
          <p className="board-empty">아직 등록된 의견이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <div className="board-item" key={post.id}>
              <p className="board-item-content">{post.content}</p>
              <span className="board-item-date">{formatDate(post.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
