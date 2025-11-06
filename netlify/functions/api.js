const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx'); 

// Netlify Functionの標準ハンドラー (exports.handler)
exports.handler = async (event, context) => {

    const successResponse = (data) => ({
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const errorResponse = (message, status = 500) => ({
        statusCode: status,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: message }),
    });
    
    // --- 1. ファイルパスの解決 ---
    const rootDir = process.env.LAMBDA_TASK_ROOT || process.cwd();
    const filePath = path.join(rootDir, 'data', 'raw', 'bousai_data.xlsx');

    if (!fs.existsSync(filePath)) {
        return errorResponse('Data file not found on the server: ' + filePath, 404);
    }

    try {
        // --- 2. Excelファイルの読み込み ---
        const fileBuffer = fs.readFileSync(filePath, { encoding: 'binary' });
        const workbook = XLSX.read(fileBuffer, { type: 'binary' });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // --- 3. GeoJSONへのデータ変換と機能性区分 ---
        const geoJsonFeatures = data.map(row => {
            // 列名: 緯度='北緯', 経度='東経'
            const latitude = parseFloat(row['北緯']);
            const longitude = parseFloat(row['東経']);
            
            // ★追加: 収容人数を数値として取得
            const capacity = parseInt(row['最大収容人数'], 10) || 0;

            if (isNaN(latitude) || isNaN(longitude) || latitude === 0 || longitude === 0) {
                return null;
            }
            
            // ★追加: 収容人数に基づいた規模区分を決定
            let size_category = 'small'; // 最小規模（デフォルト）
            if (capacity >= 500) {
                size_category = 'large'; // 500人以上: 大規模
            } else if (capacity >= 100) {
                size_category = 'medium'; // 100人以上: 中規模
            }

            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude], // [東経, 北緯]
                },
                properties: {
                    name: row['施設名'],
                    capacity: capacity, // 収容人数を追加
                    size_category: size_category, // 規模区分を追加
                    affiliate_placeholder: 'https://[あなたの保険アフィリエイトリンク]', // 収益化プレースホルダー
                    ...row 
                },
            };
        }).filter(feature => feature !== null);

        const geoJson = {
            type: 'FeatureCollection',
            features: geoJsonFeatures,
        };

        // --- 4. 成功レスポンスを返す ---
        return successResponse(geoJson);

    } catch (error) {
        console.error('API Error:', error);
        return errorResponse(`Failed to process Excel data: ${error.message}`);
    }
};