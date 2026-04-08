import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert, RefreshControl, SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface Stock {
  code: string;
  name: string;
  avgPrice: number;
  market: string;
}

interface StockPrice {
  price: number;
  change: number;
  changeRate: number;
  volume: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [prices, setPrices] = useState<{ [key: string]: StockPrice }>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStocks();
  }, []);

  useEffect(() => {
    if (stocks.length > 0) fetchPrices();
  }, [stocks]);

  const loadStocks = async () => {
    try {
      const data = await AsyncStorage.getItem('stocks');
      if (data) setStocks(JSON.parse(data));
    } catch (e) {}
  };

  const saveStocks = async (newStocks: Stock[]) => {
    await AsyncStorage.setItem('stocks', JSON.stringify(newStocks));
    setStocks(newStocks);
  };

  const fetchPrices = async () => {
    const newPrices: { [key: string]: StockPrice } = {};
    for (const stock of stocks) {
      try {
        const res = await fetch(
          `https://stock-server-psi.vercel.app/api/stock?code=${stock.code}`
        );
        const data = await res.json();
        if (data.price) {
          newPrices[stock.code] = {
            price: data.price,
            change: data.change,
            changeRate: data.changeRate,
            volume: data.volume,
          };
        }
      } catch (e) {}
    }
    setPrices(newPrices);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrices();
    setRefreshing(false);
  };

  const deleteStock = (code: string) => {
    Alert.alert('종목 삭제', '이 종목을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: () => saveStocks(stocks.filter(s => s.code !== code))
      }
    ]);
  };

  const formatPrice = (price: number) =>
    price.toLocaleString('ko-KR') + '원';

  const formatRate = (rate: number) =>
    (rate >= 0 ? '▲ ' : '▼ ') + Math.abs(rate).toFixed(2) + '%';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.topbar}>
        <View>
          <Text style={styles.title}>주식 알람</Text>
          <Text style={styles.subtitle}>종목 {stocks.length}개</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={20} color="#185FA5" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {stocks.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="bar-chart-outline" size={48} color="#D3D1C7" />
            <Text style={styles.emptyText}>종목을 추가해보세요</Text>
          </View>
        )}

        {stocks.map(stock => {
          const p = prices[stock.code];
          const isUp = p ? p.changeRate >= 0 : true;
          const profitRate = p && stock.avgPrice > 0
            ? ((p.price - stock.avgPrice) / stock.avgPrice * 100).toFixed(2)
            : null;

          return (
            <TouchableOpacity
              key={stock.code}
              style={styles.stockCard}
              onPress={() => router.push({
                pathname: '/stock-detail',
                params: { code: stock.code, name: stock.name, market: stock.market }
              })}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{stock.name.slice(0, 2)}</Text>
                  </View>
                  <View>
                    <Text style={styles.stockName}>{stock.name}</Text>
                    <Text style={styles.stockCode}>{stock.code} · {stock.market}</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  {p ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.price}>{formatPrice(p.price)}</Text>
                      <Text style={[styles.change, { color: isUp ? '#27500A' : '#A32D2D' }]}>
                        {formatRate(p.changeRate)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.loading}>로딩 중...</Text>
                  )}
                  <TouchableOpacity
                    style={styles.delBtn}
                    onPress={() => deleteStock(stock.code)}
                  >
                    <Text style={styles.delText}>×</Text>
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={16} color="#B4B2A9" />
                </View>
              </View>

              {profitRate && (
                <View style={[styles.profitBar, {
                  backgroundColor: parseFloat(profitRate) >= 0 ? '#EAF3DE' : '#FCEBEB'
                }]}>
                  <Text style={[styles.profitText, {
                    color: parseFloat(profitRate) >= 0 ? '#27500A' : '#A32D2D'
                  }]}>
                    평단 대비 {parseFloat(profitRate) >= 0 ? '+' : ''}{profitRate}%
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.chartBtn}
                onPress={() => router.push({
                  pathname: '/stock-detail',
                  params: { code: stock.code, name: stock.name, market: stock.market }
                })}
              >
                <Ionicons name="trending-up-outline" size={13} color="#185FA5" />
                <Text style={styles.chartBtnText}>오늘 추이 차트 보기</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/add-stock')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#888780" />
          <Text style={styles.addBtnText}>종목 추가</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
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
  bellBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#E6F1FB', alignItems: 'center', justifyContent: 'center'
  },
  scroll: { flex: 1, padding: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#B4B2A9', marginTop: 12 },
  stockCard: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 0.5, borderColor: '#e8e4dc',
    padding: 12, marginBottom: 10
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: '#E6F1FB', alignItems: 'center', justifyContent: 'center'
  },
  avatarText: { fontSize: 11, fontWeight: '700', color: '#0C447C' },
  stockName: { fontSize: 14, fontWeight: '700', color: '#1a1814' },
  stockCode: { fontSize: 10, color: '#9e9992', marginTop: 1 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 13, fontWeight: '700', color: '#1a1814' },
  change: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  loading: { fontSize: 11, color: '#B4B2A9' },
  delBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#FCEBEB', alignItems: 'center', justifyContent: 'center'
  },
  delText: { fontSize: 14, color: '#A32D2D', fontWeight: '700', lineHeight: 20 },
  profitBar: {
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
    marginTop: 8, alignSelf: 'flex-start'
  },
  profitText: { fontSize: 11, fontWeight: '600' },
  chartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, marginTop: 8, paddingVertical: 6,
    borderRadius: 7, borderWidth: 0.5, borderColor: '#e8e4dc',
    backgroundColor: '#f5f6fa'
  },
  chartBtnText: { fontSize: 11, color: '#185FA5', fontWeight: '500' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#D3D1C7',
    borderStyle: 'dashed', backgroundColor: 'transparent', marginBottom: 8
  },
  addBtnText: { fontSize: 13, fontWeight: '500', color: '#888780' },
});