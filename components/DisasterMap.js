import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; 
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Leafletのアイコンが壊れる問題への対策
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x.src,
    iconUrl: markerIcon.src,
    shadowUrl: markerShadow.src,
});

// 初期表示位置 (日本の中心付近)
const INITIAL_CENTER = [35.6895, 139.6917]; 
const INITIAL_ZOOM = 6;

// ★追加: 規模に応じたマーカーのスタイルを定義
const featureStyle = (feature) => {
    switch (feature.properties.size_category) {
        case 'large': // 大規模 (500人以上)
            return { color: '#dc3545', fillColor: '#dc3545', weight: 1, fillOpacity: 0.8, radius: 8 }; // 赤
        case 'medium': // 中規模 (100人以上)
            return { color: '#ffc107', fillColor: '#ffc107', weight: 1, fillOpacity: 0.8, radius: 6 }; // 黄
        case 'small': // 小規模 (100人未満)
            return { color: '#007bff', fillColor: '#007bff', weight: 1, fillOpacity: 0.8, radius: 4 }; // 青
        default:
            return { color: '#6c757d', fillColor: '#6c757d', weight: 1, fillOpacity: 0.8, radius: 4 }; // 灰色
    }
};

const DisasterMap = () => {
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // バックエンドからGeoJSONデータを取得する
    useEffect(() => {
        const API_URL = '/.netlify/functions/api';

        fetch(API_URL)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                setGeoJsonData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch GeoJSON data:", err);
                setError("防災データの読み込みに失敗しました。APIを確認してください。");
                setLoading(false);
            });
    }, []);

    if (loading) return <p>防災データを読み込み中...</p>;
    if (error) return <p style={{ color: 'red' }}>エラーが発生しました: {error}</p>;
    if (!geoJsonData || geoJsonData.features.length === 0) return <p>地図上に表示できるデータがありません。</p>;

    // GeoJSONの各 Feature (地点) が地図に描画される際の挙動を定義
    const onEachFeature = (feature, layer) => {
        if (feature.properties && feature.properties.name) {
            const { name, '北緯': lat, '東経': lng, capacity, affiliate_placeholder, size_category } = feature.properties;
            
            // ★修正: ポップアップに収容人数とアフィリエイト誘導を追加
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
        // Simple circle marker (円形のマーカー) を使用
        return L.circleMarker(latlng, featureStyle(feature));
    };


    return (
        <div style={{ height: '600px', width: '100%' }}>
            <MapContainer 
                center={INITIAL_CENTER} 
                zoom={INITIAL_ZOOM} 
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                {/* ベースマップ：OpenStreetMap */}
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* GeoJSONデータを地図上に描画 */}
                <GeoJSON 
                    data={geoJsonData} 
                    onEachFeature={onEachFeature} 
                    pointToLayer={pointToLayer} // 円形マーカーを描画
                />

            </MapContainer>
        </div>
    );
};

export default DisasterMap;