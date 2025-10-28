// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静的エクスポートを有効にする (すでに修正済み)
  output: 'export',
  
  // 【重要】ルーティングを安定させるための設定を追加
  // URLの末尾のスラッシュを強制し、パスの曖昧さをなくす
  trailingSlash: true, 
};

module.exports = nextConfig;