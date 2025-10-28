// pages/_app.js

// Next.jsアプリケーションのすべてのページをラップするコンポーネントです
// ここにグローバルなCSSやレイアウトを適用します
function MyApp({ Component, pageProps }) {
  // Componentはpagesフォルダ内の各ページ（例: index.js）
  // pagePropsはそのページの初期データ
  return <Component {...pageProps} />;
}

export default MyApp;