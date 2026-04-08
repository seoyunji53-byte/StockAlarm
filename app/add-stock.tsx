import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView, StatusBar,
    StyleSheet,
    Text,
    TextInput, TouchableOpacity,
    View
} from 'react-native';

interface SearchResult {
  code: string;
  name: string;
  market: string;
}

export default function AddStockScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (text: string) => {
    setQuery(text);
    if (!text.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://stock-server-psi.vercel.app/api/search?query=${encodeURIComponent(text)}`);
      const data = await res.json();
      setResults(data.stocks || []);
    } catch (e) {
      setResults([]);
    }
    setLoading(false);
  };

  const addStock = async (stock: SearchResult) => {
    try {
      const data = await AsyncStorage.getItem('stocks');
      const stocks = data ? JSON.parse(data) : [];
      if (stocks.find((s: any) => s.code === stock.code)) {
        Alert.alert('이미 추가된 종목이에요.');
        return;
      }
      stocks.push({ code: stock.code, name: stock.name, market: stock.market, avgPrice: 0 });
      await AsyncStorage.setItem('stocks', JSON.stringify(stocks));
      Alert.alert('추가됐어요!', `${stock.name}이(가) 내 종목에 추가됐어요.`, [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('오류', '종목 추가 중 오류가 발생했어요.');
    }
  };

  const POPULAR = [
    { code: '005930', name: '삼성전자', market: 'KOSPI' },
    { code: '000660', name: 'SK하이닉스', market: 'KOSPI' },
    { code: '035420', name: 'NAVER', market: 'KOSPI' },
    { code: '035720', name: '카카오', market: 'KOSPI' },
    { code: '247540', name: '에코프로비엠', market: 'KOSDAQ' },
    { code: '005380', name: '현대차', market: 'KOSPI' },
    { code: '068270', name: '셀트리온', market: 'KOSPI' },
    { code: '352820', name: '하이브', market: 'KOSPI' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color="#185FA5" />
          <Text style={styles.backText}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.title}>종목 추가</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#9e9992" />
        <TextInput
          style={styles.searchInput}
          placeholder="종목명 또는 종목코드 검색"
          placeholderTextColor="#B4B2A9"
          value={query}
          onChangeText={search}
          autoFocus
        />
        {loading ? (
          <ActivityIndicator size="small" color="#185FA5" />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
            <Ionicons name="close-circle" size={18} color="#B4B2A9" />
          </TouchableOpacity>
        ) : null}
      </View>

      {query.length === 0 && (
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>인기 종목</Text>
          {POPULAR.map(stock => (
            <TouchableOpacity
              key={stock.code}
              style={styles.resultItem}
              onPress={() => addStock(stock)}
            >
              <View style={styles.stockAvatar}>
                <Text style={styles.avatarText}>{stock.name.slice(0, 2)}</Text>
              </View>
              <View style={styles.stockInfo}>
                <Text style={styles.stockName}>{stock.name}</Text>
                <Text style={styles.stockCode}>{stock.code} · {stock.market}</Text>
              </View>
              <View style={styles.addBtn}>
                <Ionicons name="add" size={18} color="#185FA5" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {query.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={item => item.code}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>검색 결과가 없어요</Text>
                <Text style={styles.emptySubText}>종목명이나 6자리 종목코드로 검색해보세요</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => addStock(item)}
            >
              <View style={styles.stockAvatar}>
                <Text style={styles.avatarText}>{item.name.slice(0, 2)}</Text>
              </View>
              <View style={styles.stockInfo}>
                <Text style={styles.stockName}>{item.name}</Text>
                <Text style={styles.stockCode}>{item.code} · {item.market}</Text>
              </View>
              <View style={styles.addBtn}>
                <Ionicons name="add" size={18} color="#185FA5" />
              </View>
            </TouchableOpacity>
          )}
        />
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 60 },
  backText: { fontSize: 13, color: '#185FA5', fontWeight: '500' },
  title: { fontSize: 16, fontWeight: '700', color: '#1a1814' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', margin: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, borderWidth: 0.5, borderColor: '#e8e4dc'
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1a1814' },
  hintBox: {
    backgroundColor: '#fff', marginHorizontal: 12,
    borderRadius: 12, borderWidth: 0.5, borderColor: '#e8e4dc', padding: 4
  },
  hintTitle: {
    fontSize: 11, fontWeight: '700', color: '#9e9992',
    letterSpacing: 0.5, textTransform: 'uppercase', padding: 12, paddingBottom: 4
  },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#f5f6fa'
  },
  stockAvatar: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: '#E6F1FB', alignItems: 'center', justifyContent: 'center'
  },
  avatarText: { fontSize: 11, fontWeight: '700', color: '#0C447C' },
  stockInfo: { flex: 1 },
  stockName: { fontSize: 14, fontWeight: '700', color: '#1a1814' },
  stockCode: { fontSize: 11, color: '#9e9992', marginTop: 2 },
  addBtn: {
    width: 30, height: 30, borderRadius: 99,
    backgroundColor: '#E6F1FB', alignItems: 'center', justifyContent: 'center'
  },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#B4B2A9', fontWeight: '500' },
  emptySubText: { fontSize: 12, color: '#D3D1C7', marginTop: 6 },
});