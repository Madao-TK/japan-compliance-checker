import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ... [アイコン設定と初期値の定義は省略] ...
delete L.Icon.Default.prototype._getIconUrl;
// ... [アイコン設定はそのまま] ...

const INITIAL_CENTER = [35.6895, 139.6917]; 
const INITIAL_ZOOM = 6;

// 規模に応じたマーカーのスタイルを定義 (昨日のコードそのまま)
const featureStyle = (feature) => {
    switch (feature.properties.size_category) {
        case 'large': return { color: '#dc3545', fillColor: '#dc3545', weight: 1, fillOpacity: 0.8, radius: 8 };
        case 'medium': return { color: '#ffc107', fillColor: '#ffc107', weight: 1, fillOpacity: 0.8, radius: 6 };
        case 'small': return { color: '#007bff', fillColor: '#007bff', weight: 1, fillOpacity: 0.8, radius: 4 };
        default: return { color: '#6c757d', fillColor: '#6c757d', weight: 1, fillOpacity: 0.8, radius: 4 };
    }
};

const DisasterMap = () => {
    const [fullGeoJsonData, setFullGeoJsonData] = useState(null); // 全データ
    const [districtList, setDistrictList] = useState([]); // 行政区リスト
    const [selectedDistrict, setSelectedDistrict] = useState(''); // 選択された行政区
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // APIからデータを取得
    useEffect(() => {
        const API_URL = '/.netlify/functions/api';

        fetch(API_URL)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                // ★修正: data.geoJsonとdata.districtsの両方を受け取る
                setFullGeoJsonData(data.geoJson);
                setDistrictList(data.districts);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch GeoJSON data:", err);
                setError("データの読み込みに失敗しました。");
                setLoading(false);
            });
    }, []);

    // ★追加: 選択された行政区に基づいて表示するデータをフィルタリング
    const filteredGeoJson = useMemo(() => {
        if (!fullGeoJsonData) return null;
        if (!selectedDistrict) return fullGeoJsonData; // 選択がなければ全表示

        const filteredFeatures = fullGeoJsonData.features.filter(feature => 
            feature.properties['行政区'] === selectedDistrict
        );

        return { ...fullGeoJsonData, features: filteredFeatures };

    }, [fullGeoJsonData, selectedDistrict]); // データと選択が変わるたびに再計算

    // ... [ローディングとエラー表示のロジックは省略] ...
    if (loading) return <p>防災データを読み込み中...</p>;
    if (error) return <p style={{ color: 'red' }}>エラーが発生しました: {error}</p>;
    if (!filteredGeoJson || filteredGeoJson.features.length === 0) return <p>地図上に表示できるデータがありません。</p>;

    // GeoJSONの各 Feature (地点) が地図に描画される際の挙動を定義 (昨日のコードそのまま)
    const onEachFeature = (feature, layer) => {
        if (feature.properties && feature.properties.name) {
            const { name, '北緯': lat, '東経': lng, capacity, affiliate_placeholder, size_category } = feature.properties;

            const popupContent = `
                <b>施設名: ${name} (${size_category === 'large' ? '大規模' : size_category === 'medium' ? '中規模' : '小規模'})</b><br/>
                最大収容人数: ${capacity}人<br/>
                緯度 (北緯): ${lat}, 経度 (東経): ${lng}<br/>
                <hr style="margin: 5px 0; border-top: 1px solid #ccc;">
                <p style="font-size: 0.9em; margin: 0;">自宅の**水災・火災リスク**をチェックし、最適な保険を選びましょう。</p>
                <a href="${affiliate_placeholder}" target="_blank" style="color: #dc3545; font-weight: bold;">→ リスク評価と無料保険相談へ (広告)</a>
            `;

            layer.bindPopup(popupContent);
        }
    };

    // GeoJSONをポイントレイヤーとして描画するための関数
    const pointToLayer = (feature, latlng) => {
        return L.circleMarker(latlng, featureStyle(feature));
    };


    return (
        <div style={{ padding: '0 0 20px 0' }}>
            {/* ★追加: 絞り込み UI */}
            <div style={{ marginBottom: '15px' }}>
                <label htmlFor="district-select" style={{ fontWeight: 'bold' }}>行政区で絞り込み:</label>
                <select 
                    id="district-select"
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    style={{ marginLeft: '10px', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">--- 全ての行政区 ---</option>
                    {districtList.map(district => (
                        <option key={district} value={district}>{district}</option>
                    ))}
                </select>
            </div>
            {/* 地図コンテナ */}
            <MapContainer 
                center={INITIAL_CENTER} 
                zoom={INITIAL_ZOOM} 
                scrollWheelZoom={true}
                style={{ height: '600px', width: '100%' }}
            >
                {/* ベースマップ：OpenStreetMap */}
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* GeoJSONデータを地図上に描画 */}
                {filteredGeoJson && (
                    <GeoJSON 
                        data={filteredGeoJson} 
                        onEachFeature={onEachFeature} 
                        pointToLayer={pointToLayer} 
                    />
                )}
            </MapContainer>
        </div>
    );
};

export default DisasterMap;