import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { API, REFRESH_INTERVAL } from '../../constants/api';

interface ExchangeRate {
  pair: string;
  base: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changeRate: number;
  chartData: { time: string; value: number }[];
}

export default function ExchangeScreen() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPair, setSelectedPair] = useState('USDKRW');

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, REFRESH_INTERVAL.exchange);
    return () => clearInterval(interval);
  }, []);

  const fetchRates = async () => {
    try {
      const res = await fetch(API.exchange());
      const data = await res.json();
      setRates(data.rates || []);
    } catch (e) {}
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRates();
    setRefreshing(false);
  };

  const selected = rates.find(r => r.pair === selectedPair);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.topbar}>
        <View>
          <Text style={styles.title}>환율 추이</Text>
          <Text style={styles.subtitle}>실시간 · 1분마다 업데이트</Text>
        </View>
        <Ionicons name="cash-outline" size={20} color="#185FA5" />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#185FA5" />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* 환율 목록 */}
          <View style={styles.card}>
            {rates.map(rate => {
              const isUp = rate.changeRate >= 0;
              const isSelected = rate.pair === selectedPair;
              return (
                <TouchableOpacity
                  key={rate.pair}
                  style={[styles.rateRow, isSelected && styles.rateRowSelected]}
                  onPress={() => setSelectedPair(rate.pair)}
                >
                  <View style={styles.rateLeft}>
                    <View style={[styles.flagBox, isSelected && styles.flagBoxSelected]}>
                      <Text style={styles.flagText}>{rate.base}</Text>
                    </View>
                    <View>
                      <Text style={styles.ratePair}>{rate.pair.replace('KRW', '/KRW')}</Text>
                      <Text style={styles.rateName}>{rate.name}</Text>
                    </View>
                  </View>
                  <View style={styles.rateRight}>
                    <Text style={styles.ratePrice}>{rate.price?.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}</Text>
                    <Text style={[styles.rateChange, { color: isUp ? '#27500A' : '#A32D2D' }]}>
                      {isUp ? '▲' : '▼'} {Math.abs(rate.changeRate)?.toFixed(2)}%
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 선택된 환율 차트 */}
          {selected && selected.chartData?.length > 1 && (
            <View style={styles.card}>
              <Text style={styles.secLabel}>{selected.pair.replace('KRW', '/KRW')} 오늘 추이</Text>
              <MiniChart data={selected.chartData} isUp={selected.changeRate >= 0} />
              <View style={styles.chartStats}>
                <View style={styles.chartStat}>
                  <Text style={styles.chartStatLabel}>시가</Text>
                  <Text style={styles.chartStatVal}>{selected.previousClose?.toFixed(2)}</Text>
                </View>
                <View style={styles.chartStat}>
                  <Text style={styles.chartStatLabel}>현재</Text>
                  <Text style={styles.chartStatVal}>{selected.price?.toFixed(2)}</Text>
                </View>
                <View style={styles.chartStat}>
                  <Text style={styles.chartStatLabel}>변동</Text>
                  <Text style={[styles.chartStatVal, { color: selected.changeRate >= 0 ? '#27500A' : '#A32D2D' }]}>
                    {selected.changeRate >= 0 ? '+' : ''}{selected.change?.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function MiniChart({ data, isUp }: { data: { time: string; value: number }[]; isUp: boolean }) {
  const values = data.map(d => d.value).filter(Boolean);
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 260, h = 80;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 10) - 5;
    return `${x},${y}`;
  }).join(' ');
  const color = isUp ? '#185FA5' : '#c4685a';
  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <line x1="0" y1={h - 1} x2={w} y2={h - 1} stroke="#e8e4dc" strokeWidth="0.5" />
      </svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#e8e4dc'
  },
  title: { fontSize: 17, fontWeight: '700', color: '#1a1814' },
  subtitle: { fontSize: 11, color: '#9e9992', marginTop: 1 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 0.5, borderColor: '#e8e4dc',
    margin: 12, marginBottom: 0, overflow: 'hidden'
  },
  rateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#f5f6fa'
  },
  rateRowSelected: { backgroundColor: '#f0f7ff' },
  rateLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flagBox: {
    width: 42, height: 28, borderRadius: 6,
    backgroundColor: '#f5f6fa', alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: '#e8e4dc'
  },
  flagBoxSelected: { backgroundColor: '#E6F1FB', borderColor: '#185FA5' },
  flagText: { fontSize: 11, fontWeight: '700', color: '#1a1814' },
  ratePair: { fontSize: 13, fontWeight: '700', color: '#1a1814' },
  rateName: { fontSize: 11, color: '#9e9992', marginTop: 1 },
  rateRight: { alignItems: 'flex-end' },
  ratePrice: { fontSize: 15, fontWeight: '700', color: '#1a1814' },
  rateChange: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  secLabel: {
    fontSize: 10, fontWeight: '700', color: '#9e9992',
    letterSpacing: 0.6, textTransform: 'uppercase',
    paddingHorizontal: 14, paddingTop: 14, marginBottom: 4
  },
  chartStats: {
    flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 14, gap: 8
  },
  chartStat: {
    flex: 1, backgroundColor: '#f5f6fa', borderRadius: 8, padding: 10, alignItems: 'center'
  },
  chartStatLabel: { fontSize: 10, color: '#9e9992', marginBottom: 3 },
  chartStatVal: { fontSize: 12, fontWeight: '700', color: '#1a1814' },
});