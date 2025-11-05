import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup } from 'react-leaflet';
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

const DisasterMap = () => {
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // バックエンドからGeoJSONデータを取得する
    useEffect(() => {
        // Netlify FunctionのAPIエンドポイント
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
                // APIエラーの場合でも、ユーザーに優しいメッセージを表示
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
            // 地点名と座標をポップアップに表示
            const { name, '北緯': lat, '東経': lng } = feature.properties;
            
            layer.bindPopup(
                `<b>施設名: ${name}</b><br/>` +
                `緯度 (北緯): ${lat}<br/>` +
                `経度 (東経): ${lng}`
            );
        }
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
                />

            </MapContainer>
        </div>
    );
};

export default DisasterMap;