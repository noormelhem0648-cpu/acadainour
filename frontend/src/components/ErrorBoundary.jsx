import React from "react";

/**
 * Catches any render/runtime error in the React tree and shows a friendly
 * fallback + reload button instead of a blank white screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16,
          textAlign: "center", padding: 24, fontFamily: "system-ui, sans-serif",
        }}>
          <div style={{ fontSize: "3rem" }}>😅</div>
          <h2 style={{ margin: 0 }}>صار خطأ بسيط</h2>
          <p style={{ color: "#777", maxWidth: 340 }}>
            حصل خطأ غير متوقع بالواجهة. اضغطي إعادة التحميل وكل شي رح يرجع تمام.
            <br />Something went wrong — please reload.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#c9858a", color: "#fff", border: "none",
              padding: "12px 28px", borderRadius: 12, fontSize: "1rem",
              fontWeight: 600, cursor: "pointer",
            }}
          >
            🔄 إعادة التحميل
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
