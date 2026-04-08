import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function SettingsScreen() {
  const [notifEnabled, setNotifEnabled] = useState(true);

  const requestNotifPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      Alert.alert('알림 허용됨', '주식 알람을 받을 수 있어요!');
      setNotifEnabled(true);
    } else {
      Alert.alert('알림 거부됨', '설정에서 알림을 허용해 주세요.');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      '전체 데이터 삭제',
      '모든 종목과 설정이 삭제돼요. 계속할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('삭제됐어요', '앱을 재시작해 주세요.');
          }
        }
      ]
    );
  };

  const MENU_ITEMS = [
    {
      section: '알림 설정',
      items: [
        {
          icon: 'notifications-outline',
          label: '푸시 알림',
          desc: '주식 알람 수신 허용',
          right: <Switch value={notifEnabled} onValueChange={setNotifEnabled} trackColor={{ true: '#185FA5' }} />,
        },
        {
          icon: 'key-outline',
          label: '알림 권한 설정',
          desc: '알림이 안 오면 여기서 허용',
          onPress: requestNotifPermission,
          arrow: true,
        },
      ]
    },
    {
      section: '데이터',
      items: [
        {
          icon: 'refresh-outline',
          label: '데이터 새로고침',
          desc: '모든 데이터 즉시 업데이트',
          onPress: () => Alert.alert('새로고침', '각 화면에서 아래로 당기면 새로고침돼요!'),
          arrow: true,
        },
        {
          icon: 'trash-outline',
          label: '전체 데이터 삭제',
          desc: '종목, 설정 모두 초기화',
          onPress: clearAllData,
          arrow: true,
          danger: true,
        },
      ]
    },
    {
      section: '정보',
      items: [
        {
          icon: 'information-circle-outline',
          label: '앱 버전',
          desc: 'v1.0.0',
        },
        {
          icon: 'shield-outline',
          label: '투자 주의사항',
          desc: '이 앱은 참고용이며 투자 책임은 본인에게 있어요',
        },
        {
          icon: 'server-outline',
          label: '데이터 출처',
          desc: 'Yahoo Finance · DART · 네이버 금융',
        },
      ]
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.topbar}>
        <View>
          <Text style={styles.title}>설정</Text>
          <Text style={styles.subtitle}>앱 환경 설정</Text>
        </View>
        <Ionicons name="settings-outline" size={20} color="#185FA5" />
      </View>

      <ScrollView style={styles.scroll}>
        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.profileIcon}>
            <Ionicons name="bar-chart-outline" size={28} color="#185FA5" />
          </View>
          <View>
            <Text style={styles.profileTitle}>주식 알람</Text>
            <Text style={styles.profileSub}>실시간 주식 알림 앱</Text>
          </View>
        </View>

        {MENU_ITEMS.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.section}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item: any, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[
                    styles.menuItem,
                    ii < section.items.length - 1 && styles.menuItemBorder
                  ]}
                  onPress={item.onPress}
                  disabled={!item.onPress && !item.right}
                >
                  <View style={[styles.menuIcon, item.danger && styles.menuIconDanger]}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={item.danger ? '#A32D2D' : '#185FA5'}
                    />
                  </View>
                  <View style={styles.menuInfo}>
                    <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                      {item.label}
                    </Text>
                    <Text style={styles.menuDesc}>{item.desc}</Text>
                  </View>
                  {item.right && item.right}
                  {item.arrow && (
                    <Ionicons name="chevron-forward" size={16} color="#B4B2A9" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.footer}>
          © 2025 주식알람 · 투자 손익에 대한 책임은 본인에게 있습니다
        </Text>
        <View style={{ height: 30 }} />
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
  scroll: { flex: 1 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', margin: 12, padding: 16,
    borderRadius: 12, borderWidth: 0.5, borderColor: '#e8e4dc'
  },
  profileIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#E6F1FB', alignItems: 'center', justifyContent: 'center'
  },
  profileTitle: { fontSize: 16, fontWeight: '700', color: '#1a1814' },
  profileSub: { fontSize: 12, color: '#9e9992', marginTop: 2 },
  section: { marginHorizontal: 12, marginBottom: 8 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#9e9992',
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6, paddingLeft: 2
  },
  menuCard: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 0.5, borderColor: '#e8e4dc', overflow: 'hidden'
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13
  },
  menuItemBorder: { borderBottomWidth: 0.5, borderBottomColor: '#f5f6fa' },
  menuIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#E6F1FB', alignItems: 'center', justifyContent: 'center'
  },
  menuIconDanger: { backgroundColor: '#FCEBEB' },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 13, fontWeight: '600', color: '#1a1814' },
  menuLabelDanger: { color: '#A32D2D' },
  menuDesc: { fontSize: 11, color: '#9e9992', marginTop: 2 },
  footer: {
    fontSize: 11, color: '#B4B2A9', textAlign: 'center',
    marginHorizontal: 20, marginTop: 8, lineHeight: 16
  },
});