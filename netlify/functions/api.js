const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx'); 

// Netlify Functionの標準ハンドラー (exports.handler)
exports.handler = async (event, context) => {

    // 【修正箇所】ヘルパー関数をハンドラーの内部に移動
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
    // 【修正箇所ここまで】
    
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

        // --- 3. GeoJSONへのデータ変換 ---
        const geoJsonFeatures = data.map(row => {
            // 列名: 緯度='北緯', 経度='東経'
            const latitude = parseFloat(row['北緯']);
            const longitude = parseFloat(row['東経']);

            if (isNaN(latitude) || isNaN(longitude) || latitude === 0 || longitude === 0) {
                return null;
            }

            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude], // [東経, 北緯]
                },
                properties: {
                    name: row['施設名'],
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