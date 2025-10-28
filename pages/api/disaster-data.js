import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Next.jsのAPI Routeのエクスポート関数
export default function handler(req, res) {
  try {
    // 1. ファイルパスの特定
    // Note: process.cwd()でプロジェクトルートからファイルを探す
    const filePath = path.join(process.cwd(), 'data', 'raw', 'bousai_data.xlsx');
    
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