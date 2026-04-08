import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

interface HotStock {
  code: string;
  name: string;
  price: number;
  changeRate: number;
  change: number;
  volume: number;
  market: string;
}

export default function HotScreen() {
  const router = useRouter();
  const [hotData, setHotData] = useState<{ hot: HotStock[]; rising: HotStock[]; falling: HotStock[] }>({
    hot: [], rising: [], falling: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'hot' | 'rising' | 'falling'>('hot');

  useEffect(() => {
    fetchHot();
    const interval = setInterval(fetchHot, REFRESH_INTERVAL.hot);
    return () => clearInterval(interval);
  }, []);

  const fetchHot = async () => {
    try {
      const res = await fetch(API.hot());
      const data = await res.json();
      setHotData({ hot: data.hot || [], rising: data.rising || [], falling: data.falling || [] });
    } catch (e) {}
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHot();
    setRefreshing(false);
  };

  const currentList = hotData[tab];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.topbar}>
        <View>
          <Text style={styles.title}>요즘 관심주</Text>
          <Text style={styles.subtitle}>실시간 급등락 종목</Text>
        </View>
        <Ionicons name="trending-up-outline" size={20} color="#185FA5" />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'hot' && styles.tabBtnOn]}
          onPress={() => setTab('hot')}
        >
          <Text style={[styles.tabText, tab === 'hot' && styles.tabTextOn]}>🔥 급변동</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'rising' && styles.tabBtnOn]}
          onPress={() => setTab('rising')}
        >
          <Text style={[styles.tabText, tab === 'rising' && styles.tabTextOn]}>📈 급등</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'falling' && styles.tabBtnOn]}
          onPress={() => setTab('falling')}
        >
          <Text style={[styles.tabText, tab === 'falling' && styles.tabTextOn]}>📉 급락</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#185FA5" />
          <Text style={styles.loadingText}>실시간 데이터 불러오는 중...</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          style={styles.scroll}
        >
          {currentList.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>데이터를 불러오는 중이에요</Text>
            </View>
          ) : (
            currentList.map((stock, idx) => {
              const isUp = stock.changeRate >= 0;
              return (
                <TouchableOpacity
                  key={stock.code}
                  style={styles.stockCard}
                  onPress={() => router.push({
                    pathname: '/stock-detail',
                    params: { code: stock.code, name: stock.name, market: stock.market }
                  })}
                >
                  <View style={styles.rankBox}>
                    <Text style={styles.rank}>{idx + 1}</Text>
                  </View>
                  <View style={styles.stockAvatar}>
                    <Text style={styles.avatarText}>{stock.name.slice(0, 2)}</Text>
                  </View>
                  <View style={styles.stockInfo}>
                    <Text style={styles.stockName}>{stock.name}</Text>
                    <Text style={styles.stockMeta}>
                      {stock.code} · {stock.market} · 거래량 {(stock.volume / 10000).toFixed(0)}만
                    </Text>
                  </View>
                  <View style={styles.priceBox}>
                    <Text style={styles.price}>{stock.price?.toLocaleString()}원</Text>
                    <Text style={[styles.change, { color: isUp ? '#27500A' : '#A32D2D' }]}>
                      {isUp ? '▲' : '▼'} {Math.abs(stock.changeRate)?.toFixed(2)}%
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#B4B2A9" />
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
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
  tabRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 8, gap: 8,
    borderBottomWidth: 0.5, borderBottomColor: '#e8e4dc'
  },
  tabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#f5f6fa', alignItems: 'center'
  },
  tabBtnOn: { backgroundColor: '#185FA5' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#888780' },
  tabTextOn: { color: '#fff' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: '#9e9992' },
  scroll: { flex: 1, padding: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#B4B2A9' },
  stockCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 0.5, borderColor: '#e8e4dc',
    padding: 12, marginBottom: 8
  },
  rankBox: { width: 24, alignItems: 'center' },
  rank: { fontSize: 14, fontWeight: '700', color: '#185FA5' },
  stockAvatar: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: '#E6F1FB', alignItems: 'center', justifyContent: 'center'
  },
  avatarText: { fontSize: 11, fontWeight: '700', color: '#0C447C' },
  stockInfo: { flex: 1 },
  stockName: { fontSize: 13, fontWeight: '700', color: '#1a1814' },
  stockMeta: { fontSize: 10, color: '#9e9992', marginTop: 2 },
  priceBox: { alignItems: 'flex-end' },
  price: { fontSize: 13, fontWeight: '700', color: '#1a1814' },
  change: { fontSize: 11, fontWeight: '500', marginTop: 2 },
});