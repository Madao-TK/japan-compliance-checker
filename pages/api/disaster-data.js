import fs from 'fs';
const path = require('path');
import * as XLSX from 'xlsx';

// Next.jsのAPI Routeのエクスポート関数
export default function handler(req, res) {
  try {
    // 1. ファイルパスの特定
   // 確実なパス指定: プロジェクトルートからの絶対パスを解決する
    const filePath = path.resolve(process.cwd(), 'data', 'raw', 'bousai_data.xlsx');

    // 【重要】ファイル名の修正: あなたがプッシュしたファイル名と正確に一致させる
    // 以前のコミットログでは日本語のファイル名でした。ここでは半角英数字に直したと仮定します。
    // もしファイル名が違っていたら、以下の 'bousai_data.xlsx' を正しいファイル名に修正してください。

    // ... (以降の fs.existsSync(filePath) や fs.readFileSync(filePath, ...) はこの filePath を使う)
    
    // 2. ファイルの存在確認
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Data file not found at: ' + filePath });
    }

    // 3. Excelファイルをバイナリ形式で読み込み
    const fileBuffer = fs.readFileSync(filePath, { encoding: 'binary' });
    
    // 4. XLSXライブラリでブックを解析
    const workbook = XLSX.read(fileBuffer, { type: 'binary' });
    
    // ★次のステップで処理を行うシート名を特定する
    const sheetName = workbook.SheetNames[0]; // とりあえず最初のシート名を取得
    const worksheet = workbook.Sheets[sheetName];

    // 5. Excelの内容をJSON配列として抽出 (ヘッダー含む)
    const jsonOutput = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // 6. 成功レスポンスとして返す (読み込み成功の確認用)
    res.status(200).json({ 
        message: 'File loaded successfully. Check the "data" for content.',
        sheetName: sheetName,
        data_preview: jsonOutput.slice(0, 5) // 最初の5行だけをプレビュー
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to process data.', details: error.message });
  }
}