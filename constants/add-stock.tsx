import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
  price?: number;
  changeRate?: number;
}

// 주요 종목 검색용 데이터
const STOCK_DB: SearchResult[] = [
  { code: '005930', name: '삼성전자', market: 'KOSPI' },
  { code: '000660', name: 'SK하이닉스', market: 'KOSPI' },
  { code: '035420', name: 'NAVER', market: 'KOSPI' },
  { code: '035720', name: '카카오', market: 'KOSPI' },
  { code: '051910', name: 'LG화학', market: 'KOSPI' },
  { code: '006400', name: '삼성SDI', market: 'KOSPI' },
  { code: '068270', name: '셀트리온', market: 'KOSPI' },
  { code: '207940', name: '삼성바이오로직스', market: 'KOSPI' },
  { code: '005380', name: '현대차', market: 'KOSPI' },
  { code: '000270', name: '기아', market: 'KOSPI' },
  { code: '096770', name: 'SK이노베이션', market: 'KOSPI' },
  { code: '017670', name: 'SK텔레콤', market: 'KOSPI' },
  { code: '030200', name: 'KT', market: 'KOSPI' },
  { code: '055550', name: '신한지주', market: 'KOSPI' },
  { code: '086790', name: '하나금융지주', market: 'KOSPI' },
  { code: '105560', name: 'KB금융', market: 'KOSPI' },
  { code: '003550', name: 'LG', market: 'KOSPI' },
  { code: '012330', name: '현대모비스', market: 'KOSPI' },
  { code: '066570', name: 'LG전자', market: 'KOSPI' },
  { code: '034730', name: 'SK', market: 'KOSPI' },
  { code: '247540', name: '에코프로비엠', market: 'KOSDAQ' },
  { code: '086520', name: '에코프로', market: 'KOSDAQ' },
  { code: '373220', name: 'LG에너지솔루션', market: 'KOSPI' },
  { code: '012450', name: '한화에어로스페이스', market: 'KOSPI' },
  { code: '028260', name: '삼성물산', market: 'KOSPI' },
  { code: '032830', name: '삼성생명', market: 'KOSPI' },
  { code: '018260', name: '삼성에스디에스', market: 'KOSPI' },
  { code: '011200', name: 'HMM', market: 'KOSPI' },
  { code: '010130', name: '고려아연', market: 'KOSPI' },
  { code: '329180', name: 'HD현대중공업', market: 'KOSPI' },
];

export default function AddStockScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = (text: string) => {
    setQuery(text);
    if (!text.trim()) { setResults([]); return; }
    const filtered = STOCK_DB.filter(s =>
      s.name.includes(text) || s.code.includes(text)
    );
    setResults(filtered);
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
        {query.length > 0 && (
          <TouchableOpacity onPress={() => search('')}>
            <Ionicons name="close-circle" size={18} color="#B4B2A9" />
          </TouchableOpacity>
        )}
      </View>

      {query.length === 0 && (
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>인기 종목</Text>
          {STOCK_DB.slice(0, 8).map(stock => (
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
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>검색 결과가 없어요</Text>
              <Text style={styles.emptySubText}>종목명이나 6자리 종목코드로 검색해보세요</Text>
            </View>
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
  hintBox: { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 12, borderWidth: 0.5, borderColor: '#e8e4dc', padding: 4 },
  hintTitle: { fontSize: 11, fontWeight: '700', color: '#9e9992', letterSpacing: 0.5, textTransform: 'uppercase', padding: 12, paddingBottom: 4 },
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