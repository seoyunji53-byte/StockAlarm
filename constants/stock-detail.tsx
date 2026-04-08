import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Dimensions,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { API, REFRESH_INTERVAL } from '../constants/api';

const { width } = Dimensions.get('window');

interface ChartPoint { time: string; close: number; }
interface DartItem { title: string; date: string; url: string; }
interface NewsItem { title: string; source: string; time: string; url: string; }

export default function StockDetailScreen() {
  const { code, name, market } = useLocalSearchParams<{ code: string; name: string; market: string }>();
  const router = useRouter();

  const [stockData, setStockData] = useState<any>(null);
  const [chartRange, setChartRange] = useState('1d');
  const [avgPrice, setAvgPrice] = useState('');
  const [editingAvg, setEditingAvg] = useState(false);
  const [dartList, setDartList] = useState<DartItem[]>([]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alarms, setAlarms] = useState({
    dart: true, news: true, surge: true, volume: false, issue: true
  });

  const intervalRef = useRef<any>(null);

  useEffect(() => {
    loadData();
    loadAvgPrice();
    loadAlarms();
    intervalRef.current = setInterval(fetchStock, REFRESH_INTERVAL.stock);
    return () => clearInterval(intervalRef.current);
  }, [code]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStock(), fetchDart(), fetchNews()]);
    setLoading(false);
  };

  const fetchStock = async () => {
    try {
      const res = await fetch(API.stock(code, chartRange));
      const data = await res.json();
      setStockData(data);
    } catch (e) {}
  };

  const fetchDart = async () => {
    try {
      const res = await fetch(API.dart(code));
      const data = await res.json();
      setDartList(data.disclosures || []);
    } catch (e) {}
  };

  const fetchNews = async () => {
    try {
      const res = await fetch(API.news(name));
      const data = await res.json();
      setNewsList(data.news?.slice(0, 5) || []);
    } catch (e) {}
  };

  const loadAvgPrice = async () => {
    const val = await AsyncStorage.getItem(`avgPrice_${code}`);
    if (val) setAvgPrice(val);
  };

  const saveAvgPrice = async () => {
    await AsyncStorage.setItem(`avgPrice_${code}`, avgPrice);
    setEditingAvg(false);
    if (stockData) fetchAICoach();
  };

  const loadAlarms = async () => {
    const val = await AsyncStorage.getItem(`alarms_${code}`);
    if (val) setAlarms(JSON.parse(val));
  };

  const toggleAlarm = async (key: string) => {
    const updated = { ...alarms, [key]: !alarms[key as keyof typeof alarms] };
    setAlarms(updated);
    await AsyncStorage.setItem(`alarms_${code}`, JSON.stringify(updated));
  };

  const fetchAICoach = async () => {
    if (!stockData) return;
    setLoadingAI(true);
    try {
      const res = await fetch(API.aiCoach(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockName: name,
          stockCode: code,
          currentPrice: stockData.price,
          avgPrice: avgPrice ? parseFloat(avgPrice.replace(/,/g, '')) : 0,
          changeRate: stockData.changeRate,
          volume: stockData.volume,
          dartNews: dartList.slice(0, 3).map(d => d.title).join('\n'),
          recentNews: newsList.slice(0, 3).map(n => n.title).join('\n'),
        }),
      });
      const data = await res.json();
      setAiAnalysis(data);
    } catch (e) {}
    setLoadingAI(false);
  };

  const shareAnalysis = async () => {
    if (!aiAnalysis || !stockData) return;
    const profitText = aiAnalysis.profitRate
      ? `평단 대비 ${parseFloat(aiAnalysis.profitRate) >= 0 ? '+' : ''}${aiAnalysis.profitRate}%`
      : '';
    const msg = `📊 ${name} (${code}) 분석\n현재가: ${stockData.price?.toLocaleString()}원\n등락률: ${stockData.changeRate?.toFixed(2)}%\n${profitText}\n\n${aiAnalysis.verdict} ${aiAnalysis.verdictConfig?.icon}\n\n${aiAnalysis.analysis?.slice(0, 200)}...\n\n#주식알람 #AI분석`;
    await Share.share({ message: msg });
  };

  const formatPrice = (p: number) => p?.toLocaleString('ko-KR') + '원';
  const isUp = stockData ? stockData.changeRate >= 0 : true;

  const profitRate = avgPrice && stockData
    ? ((stockData.price - parseFloat(avgPrice.replace(/,/g, ''))) / parseFloat(avgPrice.replace(/,/g, '')) * 100).toFixed(2)
    : null;

  const RANGES = ['1d', '5d', '1mo', '3mo', '1y'];
  const RANGE_LABELS: any = { '1d': '1일', '5d': '5일', '1mo': '1개월', '3mo': '3개월', '1y': '1년' };

  const ALARM_CONFIG = [
    { key: 'dart',   icon: '📋', label: '공시 알람',  desc: 'DART 신규 공시',    bg: '#FAEEDA' },
    { key: 'news',   icon: '📰', label: '뉴스 알람',  desc: '관련 뉴스 실시간',  bg: '#E6F1FB' },
    { key: 'surge',  icon: '📈', label: '주가 급등락', desc: '±3% 이상 변동',    bg: '#EAF3DE' },
    { key: 'volume', icon: '📊', label: '거래량 급증', desc: '평균 대비 2배 이상', bg: '#F1EFE8' },
    { key: 'issue',  icon: '🔥', label: '종목 이슈',  desc: '리콜·소송·임원변동', bg: '#FBEAF0' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color="#185FA5" />
          <Text style={styles.backText}>내 종목</Text>
        </TouchableOpacity>
        <Text style={styles.codeText}>{code}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#185FA5" />
          <Text style={styles.loadingText}>데이터 불러오는 중...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll}>
          {/* 헤더 */}
          <View style={styles.detailHeader}>
            <View style={styles.headerRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{name?.slice(0, 2)}</Text>
              </View>
              <View>
                <Text style={styles.stockName}>{name}</Text>
                <Text style={styles.stockCode}>{market} · {code}</Text>
              </View>
            </View>
            {stockData && (
              <>
                <Text style={styles.bigPrice}>{formatPrice(stockData.price)}</Text>
                <Text style={[styles.bigChange, { color: isUp ? '#27500A' : '#A32D2D' }]}>
                  {isUp ? '▲' : '▼'} {Math.abs(stockData.change)?.toLocaleString()}원
                  ({Math.abs(stockData.changeRate)?.toFixed(2)}%) 오늘
                </Text>
              </>
            )}
          </View>

          {/* 차트 */}
          <View style={styles.card}>
            <View style={styles.rangeTabs}>
              {RANGES.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rangeTab, chartRange === r && styles.rangeTabOn]}
                  onPress={() => { setChartRange(r); fetchStock(); }}
                >
                  <Text style={[styles.rangeTabText, chartRange === r && styles.rangeTabTextOn]}>
                    {RANGE_LABELS[r]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {stockData?.chartData && stockData.chartData.length > 0 ? (
              <View style={styles.chartContainer}>
                <SimpleLineChart
                  data={stockData.chartData}
                  avgPrice={avgPrice ? parseFloat(avgPrice.replace(/,/g, '')) : 0}
                  isUp={isUp}
                />
              </View>
            ) : (
              <View style={styles.noChart}>
                <Text style={styles.noChartText}>차트 데이터 없음</Text>
              </View>
            )}
          </View>

          {/* 평단가 */}
          <View style={styles.card}>
            <Text style={styles.secLabel}>내 평단가</Text>
            <View style={styles.avgRow}>
              <Text style={styles.avgLabel}>평균 매입가</Text>
              {editingAvg ? (
                <View style={styles.avgInputRow}>
                  <TextInput
                    style={styles.avgInput}
                    value={avgPrice}
                    onChangeText={setAvgPrice}
                    keyboardType="numeric"
                    placeholder="0"
                    autoFocus
                  />
                  <Text style={styles.avgUnit}>원</Text>
                  <TouchableOpacity style={styles.saveBtn} onPress={saveAvgPrice}>
                    <Text style={styles.saveBtnText}>저장</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.avgDisplay} onPress={() => setEditingAvg(true)}>
                  <Text style={styles.avgValue}>
                    {avgPrice ? parseInt(avgPrice.replace(/,/g, '')).toLocaleString() + '원' : '탭하여 입력'}
                  </Text>
                  <Ionicons name="pencil-outline" size={14} color="#888780" />
                </TouchableOpacity>
              )}
            </View>
            {profitRate && stockData && (
              <View style={styles.profitStats}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>수익률</Text>
                  <Text style={[styles.statVal, { color: parseFloat(profitRate) >= 0 ? '#27500A' : '#A32D2D' }]}>
                    {parseFloat(profitRate) >= 0 ? '+' : ''}{profitRate}%
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>평가손익</Text>
                  <Text style={[styles.statVal, { color: parseFloat(profitRate) >= 0 ? '#27500A' : '#A32D2D' }]}>
                    {parseFloat(profitRate) >= 0 ? '+' : ''}
                    {(stockData.price - parseFloat(avgPrice.replace(/,/g, ''))).toLocaleString()}원
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>현재가</Text>
                  <Text style={styles.statVal}>{stockData.price?.toLocaleString()}원</Text>
                </View>
              </View>
            )}
          </View>

          {/* AI 코칭 */}
          <View style={[styles.card, { borderColor: '#B5D4F4', borderWidth: 1.5 }]}>
            <View style={styles.aiHeader}>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
              <Text style={styles.aiTitle}>{name} 맞춤 코칭</Text>
              <TouchableOpacity style={styles.shareBtn} onPress={shareAnalysis}>
                <Ionicons name="share-outline" size={16} color="#185FA5" />
              </TouchableOpacity>
            </View>

            {aiAnalysis ? (
              <>
                <View style={[styles.verdict, { backgroundColor: aiAnalysis.verdictConfig?.bg }]}>
                  <Text style={styles.verdictIcon}>{aiAnalysis.verdictConfig?.icon}</Text>
                  <View>
                    <Text style={[styles.verdictText, { color: aiAnalysis.verdictConfig?.color }]}>
                      {aiAnalysis.verdict}
                    </Text>
                    {profitRate && (
                      <Text style={[styles.verdictSub, { color: aiAnalysis.verdictConfig?.color }]}>
                        평단 대비 {parseFloat(profitRate) >= 0 ? '+' : ''}{profitRate}%
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.aiBody}>{aiAnalysis.analysis}</Text>
              </>
            ) : (
              <TouchableOpacity
                style={styles.aiStartBtn}
                onPress={fetchAICoach}
                disabled={loadingAI}
              >
                {loadingAI ? (
                  <ActivityIndicator size="small" color="#185FA5" />
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={16} color="#185FA5" />
                    <Text style={styles.aiStartText}>AI 코칭 받기</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* 알람 설정 */}
          <View style={styles.card}>
            <Text style={styles.secLabel}>알람 설정</Text>
            {ALARM_CONFIG.map(cfg => (
              <View key={cfg.key} style={styles.alarmItem}>
                <View style={styles.alarmLeft}>
                  <View style={[styles.alarmIcon, { backgroundColor: cfg.bg }]}>
                    <Text style={{ fontSize: 14 }}>{cfg.icon}</Text>
                  </View>
                  <View>
                    <Text style={styles.alarmName}>{cfg.label}</Text>
                    <Text style={styles.alarmDesc}>{cfg.desc}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, alarms[cfg.key as keyof typeof alarms] && styles.toggleOn]}
                  onPress={() => toggleAlarm(cfg.key)}
                />
              </View>
            ))}
          </View>

          {/* 최근 공시 */}
          {dartList.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.secLabel}>최근 공시</Text>
              {dartList.slice(0, 3).map((item, idx) => (
                <View key={idx} style={styles.dartItem}>
                  <Text style={styles.dartTitle}>{item.title}</Text>
                  <Text style={styles.dartDate}>{item.date}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 관련 뉴스 */}
          {newsList.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.secLabel}>관련 뉴스</Text>
              {newsList.map((item, idx) => (
                <View key={idx} style={styles.newsItem}>
                  <Text style={styles.newsTitle}>{item.title}</Text>
                  <View style={styles.newsMeta}>
                    <Text style={styles.newsSource}>{item.source}</Text>
                    <Text style={styles.newsTime}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// 간단한 라인 차트 컴포넌트
function SimpleLineChart({ data, avgPrice, isUp }: { data: ChartPoint[]; avgPrice: number; isUp: boolean }) {
  const w = width - 56;
  const h = 100;
  const prices = data.map(d => d.close).filter(Boolean);
  if (prices.length < 2) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((p - min) / range) * (h - 10) - 5;
    return `${x},${y}`;
  }).join(' ');

  const avgY = avgPrice > 0 ? h - ((avgPrice - min) / range) * (h - 10) - 5 : -1;
  const color = isUp ? '#185FA5' : '#c4685a';
  const fillColor = isUp ? '#E6F1FB' : '#fdf0ee';

  const firstX = 0;
  const lastX = w;
  const firstY = h - ((prices[0] - min) / range) * (h - 10) - 5;
  const lastY = h - ((prices[prices.length - 1] - min) / range) * (h - 10) - 5;

  return (
    <View>
      <svg width={w} height={h + 20} viewBox={`0 0 ${w} ${h + 20}`}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${firstY} ${points} ${lastX},${lastY} ${lastX},${h} 0,${h}`}
          fill={`url(#grad)`}
        />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {avgY > 0 && avgY < h && (
          <>
            <line x1="0" y1={avgY} x2={w} y2={avgY} stroke="#c49a3c" strokeWidth="1.5" strokeDasharray="5,3" />
            <text x="4" y={avgY - 3} fontSize="9" fill="#854F0B" fontWeight="600">
              평단 {avgPrice.toLocaleString()}
            </text>
          </>
        )}
        <line x1="0" y1={h} x2={w} y2={h} stroke="#e8e4dc" strokeWidth="0.5" />
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 13, color: '#185FA5', fontWeight: '500' },
  codeText: { fontSize: 11, color: '#9e9992' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#9e9992' },
  scroll: { flex: 1 },
  detailHeader: {
    backgroundColor: '#fff', padding: 16,
    borderBottomWidth: 0.5, borderBottomColor: '#e8e4dc'
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#E6F1FB', alignItems: 'center', justifyContent: 'center'
  },
  avatarText: { fontSize: 12, fontWeight: '700', color: '#0C447C' },
  stockName: { fontSize: 16, fontWeight: '700', color: '#1a1814' },
  stockCode: { fontSize: 11, color: '#9e9992', marginTop: 1 },
  bigPrice: { fontSize: 26, fontWeight: '700', color: '#1a1814', marginBottom: 4 },
  bigChange: { fontSize: 13, fontWeight: '500' },
  card: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 0.5, borderColor: '#e8e4dc',
    padding: 14, margin: 12, marginBottom: 0
  },
  secLabel: {
    fontSize: 10, fontWeight: '700', color: '#9e9992',
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10
  },
  rangeTabs: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  rangeTab: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99,
    borderWidth: 0.5, borderColor: '#D3D1C7', backgroundColor: 'transparent'
  },
  rangeTabOn: { backgroundColor: '#185FA5', borderColor: '#185FA5' },
  rangeTabText: { fontSize: 11, fontWeight: '500', color: '#888780' },
  rangeTabTextOn: { color: '#fff' },
  chartContainer: { alignItems: 'center' },
  noChart: { height: 80, alignItems: 'center', justifyContent: 'center' },
  noChartText: { fontSize: 13, color: '#B4B2A9' },
  avgRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  avgLabel: { fontSize: 13, fontWeight: '500', color: '#6b6660' },
  avgInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avgInput: {
    borderWidth: 1, borderColor: '#185FA5', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, fontSize: 14,
    fontWeight: '700', color: '#1a1814', minWidth: 100, textAlign: 'right'
  },
  avgUnit: { fontSize: 12, color: '#9e9992' },
  saveBtn: { backgroundColor: '#185FA5', borderRadius: 7, paddingHorizontal: 12, paddingVertical: 7 },
  saveBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  avgDisplay: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avgValue: { fontSize: 14, fontWeight: '700', color: '#1a1814' },
  profitStats: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1, backgroundColor: '#f5f6fa', borderRadius: 8,
    padding: 10, alignItems: 'center'
  },
  statLabel: { fontSize: 10, color: '#9e9992', fontWeight: '500', marginBottom: 4 },
  statVal: { fontSize: 13, fontWeight: '700', color: '#1a1814' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiBadge: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: '#E6F1FB', alignItems: 'center', justifyContent: 'center'
  },
  aiBadgeText: { fontSize: 10, fontWeight: '700', color: '#0C447C' },
  aiTitle: { fontSize: 13, fontWeight: '700', color: '#0C447C', flex: 1 },
  shareBtn: { padding: 4 },
  verdict: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, padding: 12, marginBottom: 12
  },
  verdictIcon: { fontSize: 22 },
  verdictText: { fontSize: 14, fontWeight: '700' },
  verdictSub: { fontSize: 11, marginTop: 2 },
  aiBody: { fontSize: 12, color: '#6b6660', lineHeight: 19 },
  aiStartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#185FA5', borderStyle: 'dashed'
  },
  aiStartText: { fontSize: 14, color: '#185FA5', fontWeight: '600' },
  alarmItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#f0ede8'
  },
  alarmLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alarmIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  alarmName: { fontSize: 12, fontWeight: '700', color: '#1a1814' },
  alarmDesc: { fontSize: 10, color: '#9e9992', marginTop: 1 },
  toggle: {
    width: 36, height: 21, borderRadius: 99,
    backgroundColor: '#D3D1C7', position: 'relative'
  },
  toggleOn: { backgroundColor: '#185FA5' },
  dartItem: {
    paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#f0ede8'
  },
  dartTitle: { fontSize: 12, fontWeight: '600', color: '#1a1814', lineHeight: 17 },
  dartDate: { fontSize: 10, color: '#9e9992', marginTop: 3 },
  newsItem: {
    paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#f0ede8'
  },
  newsTitle: { fontSize: 12, fontWeight: '600', color: '#1a1814', lineHeight: 17, marginBottom: 4 },
  newsMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  newsSource: { fontSize: 10, color: '#9e9992' },
  newsTime: { fontSize: 10, color: '#9e9992' },
});