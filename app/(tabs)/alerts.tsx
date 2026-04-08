import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface AlarmItem {
  id: string;
  stockName: string;
  stockCode: string;
  type: 'dart' | 'news' | 'surge' | 'drop' | 'issue' | 'volume';
  title: string;
  desc: string;
  time: string;
  date: string;
  isRead: boolean;
  isUrgent: boolean;
}

const TYPE_CONFIG = {
  dart:   { icon: '📋', label: '공시',   bg: '#FAEEDA', color: '#633806', tagBg: '#FAEEDA', tagColor: '#633806' },
  news:   { icon: '📰', label: '뉴스',   bg: '#E6F1FB', color: '#0C447C', tagBg: '#E6F1FB', tagColor: '#0C447C' },
  surge:  { icon: '📈', label: '급등',   bg: '#EAF3DE', color: '#27500A', tagBg: '#EAF3DE', tagColor: '#27500A' },
  drop:   { icon: '📉', label: '급락',   bg: '#FCEBEB', color: '#791F1F', tagBg: '#FCEBEB', tagColor: '#791F1F' },
  issue:  { icon: '🔥', label: '이슈',   bg: '#FBEAF0', color: '#72243E', tagBg: '#FBEAF0', tagColor: '#72243E' },
  volume: { icon: '📊', label: '거래량↑', bg: '#EAF3DE', color: '#27500A', tagBg: '#EAF3DE', tagColor: '#27500A' },
};

const FILTERS = ['전체', '공시', '뉴스', '급등락', '이슈'];

export default function AlertsScreen() {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [filter, setFilter] = useState('전체');

  useEffect(() => { loadAlarms(); }, []);

  const loadAlarms = async () => {
    try {
      const data = await AsyncStorage.getItem('alarms');
      if (data) setAlarms(JSON.parse(data));
    } catch (e) {}
  };

  const markAllRead = async () => {
    const updated = alarms.map(a => ({ ...a, isRead: true }));
    await AsyncStorage.setItem('alarms', JSON.stringify(updated));
    setAlarms(updated);
  };

  const clearAll = () => {
    Alert.alert('전체 삭제', '모든 알림을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('alarms');
          setAlarms([]);
        }
      }
    ]);
  };

  const filtered = alarms.filter(a => {
    if (filter === '전체') return true;
    if (filter === '공시') return a.type === 'dart';
    if (filter === '뉴스') return a.type === 'news';
    if (filter === '급등락') return a.type === 'surge' || a.type === 'drop';
    if (filter === '이슈') return a.type === 'issue';
    return true;
  });

  const unreadCount = alarms.filter(a => !a.isRead).length;

  const groupByDate = () => {
    const groups: { [date: string]: AlarmItem[] } = {};
    filtered.forEach(a => {
      if (!groups[a.date]) groups[a.date] = [];
      groups[a.date].push(a);
    });
    return groups;
  };

  const groups = groupByDate();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topbar}>
        <View>
          <Text style={styles.title}>알림 내역</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `읽지 않음 ${unreadCount}건` : '모두 읽었어요'}
          </Text>
        </View>
        <TouchableOpacity onPress={clearAll}>
          <Text style={styles.clearBtn}>전체 삭제</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnOn]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextOn]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll}>
        {Object.keys(groups).length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="notifications-off-outline" size={48} color="#D3D1C7" />
            <Text style={styles.emptyText}>알림이 없어요</Text>
          </View>
        )}

        {Object.entries(groups).map(([date, items]) => (
          <View key={date}>
            <Text style={styles.dateLabel}>{date}</Text>
            {items.map(item => {
              const cfg = TYPE_CONFIG[item.type];
              return (
                <View
                  key={item.id}
                  style={[
                    styles.alarmCard,
                    !item.isRead && { borderLeftWidth: 3, borderLeftColor: item.isUrgent ? '#c4685a' : '#185FA5' }
                  ]}
                >
                  <View style={[styles.alarmIcon, { backgroundColor: cfg.bg }]}>
                    <Text style={{ fontSize: 16 }}>{cfg.icon}</Text>
                  </View>
                  <View style={styles.alarmBody}>
                    <Text style={styles.alarmTitle}>{item.title}</Text>
                    <Text style={styles.alarmDesc}>{item.desc}</Text>
                    <View style={styles.alarmMeta}>
                      <Text style={styles.alarmTime}>{item.time}</Text>
                      <View style={[styles.tag, { backgroundColor: cfg.tagBg }]}>
                        <Text style={[styles.tagText, { color: cfg.tagColor }]}>{cfg.label}</Text>
                      </View>
                    </View>
                  </View>
                  {!item.isRead && (
                    <View style={[styles.unreadDot, { backgroundColor: item.isUrgent ? '#c4685a' : '#185FA5' }]} />
                  )}
                </View>
              );
            })}
          </View>
        ))}
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
  clearBtn: { fontSize: 12, color: '#A32D2D', fontWeight: '500' },
  filterRow: {
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: '#e8e4dc', flexGrow: 0
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 99,
    borderWidth: 0.5, borderColor: '#D3D1C7', marginRight: 6, backgroundColor: 'transparent'
  },
  filterBtnOn: { backgroundColor: '#185FA5', borderColor: '#185FA5' },
  filterText: { fontSize: 11, fontWeight: '500', color: '#888780' },
  filterTextOn: { color: '#fff' },
  scroll: { flex: 1, padding: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#B4B2A9', marginTop: 12 },
  dateLabel: { fontSize: 11, fontWeight: '700', color: '#888780', marginBottom: 8, paddingLeft: 2 },
  alarmCard: {
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 0.5, borderColor: '#e8e4dc',
    padding: 12, marginBottom: 8,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10
  },
  alarmIcon: {
    width: 36, height: 36, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  alarmBody: { flex: 1 },
  alarmTitle: { fontSize: 12, fontWeight: '700', color: '#1a1814', lineHeight: 18, marginBottom: 3 },
  alarmDesc: { fontSize: 11, color: '#6b6660', lineHeight: 16, marginBottom: 5 },
  alarmMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alarmTime: { fontSize: 10, color: '#9e9992' },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  tagText: { fontSize: 9, fontWeight: '500' },
  unreadDot: { width: 7, height: 7, borderRadius: 4, marginTop: 4, flexShrink: 0 },
});