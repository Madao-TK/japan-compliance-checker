const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx'); // CommonJS形式に変更

// Netlify Functionの標準ハンドラー (exports.handler)
exports.handler = async (event, context) => {
    // 成功レスポンスを返すヘルパー関数
    const successResponse = (data) => ({
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    // 失敗レスポンスを返すヘルパー関数
    const errorResponse = (message, status = 500) => ({
        statusCode: status,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: message }),
    });

    // --- 1. ファイルパスの解決 ---
    const filePath = path.resolve(process.cwd(), 'data', 'raw', 'bousai_data.xlsx');

    if (!fs.existsSync(filePath)) {
        // res.status(500)ではなく、return errorResponse(..., 500) を使う
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
            const latitude = parseFloat(row['北緯']);
            const longitude = parseFloat(row['東経']);

            if (isNaN(latitude) || isNaN(longitude) || latitude === 0 || longitude === 0) {
                return null;
            }

            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude],
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