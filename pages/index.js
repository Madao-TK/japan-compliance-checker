import React from 'react';
import dynamic from 'next/dynamic'; // Leafletはクライアントサイドでのみ動作させるため dynamic import を使う

// Leafletコンポーネントをサーバーサイドレンダリング(SSR)から除外する
const DisasterMap = dynamic(
    () => import('../components/DisasterMap'),
    { ssr: false } // これが重要: サーバー側でのレンダリングを無効化
);

const Home = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🇯🇵 防災地図サービス (初期ベータ版)</h1>
      <p>地点をクリックすると、施設名と座標が表示されます。</p>
      
      {/* 地図コンポーネントを配置 */}
      <DisasterMap />
      
      <p style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
        ※このデータはオープンデータに基づいています。正確性については出典元をご確認ください。
      </p>
      
      {/* 収益の柱: 高単価アフィリエイトの示唆（プロ版機能の示唆も兼ねる） */}
      <div style={{ padding: '15px', border: '2px solid #007bff', borderRadius: '8px', marginTop: '20px' }}>
          <h3>🛡️ 自宅の防災対策は万全ですか？</h3>
          <p>この地域のハザードリスクを考慮した、最適な**スマートホームセキュリティ**や**火災保険**を比較検討しませんか？</p>
          <a href="#" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>→ リスクに基づいた最適な保険プランを見る（アフィリエイトリンク）</a>
          {/* プレミアム機能の示唆 */}
          <p style={{ fontSize: '0.9em', marginTop: '5px', color: '#666' }}>
            [プロ版]では、自宅の住所を入力するだけで、災害リスクと連動した**行動計画シミュレーション**を提供します。
          </p>
      </div>
    </div>
  );
};

export default Home;