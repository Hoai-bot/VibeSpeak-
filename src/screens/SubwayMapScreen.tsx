import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { auth, db } from '../services/firebaseClient';
import { logoutUser } from '../services/authService';
import { doc, getDoc } from 'firebase/firestore';

// BỘ 4 TRẠM CHÍNH ĐÃ MỞ KHÓA VÀ CẤU TRÚC ĐÚNG LUỒNG GAME
const STATIONS = [
  { 
    id: 1, 
    name: 'TRẠM 1: NEON BEAT PULSE', 
    desc: 'Luyện 3 Tầng: Minimal Pairs, Linking Sounds & Tongue Twisters', 
    color: '#00FFFF', 
    locked: false 
  },
  { 
    id: 2, 
    name: 'TRẠM 2: ĐẤU TRƯỜNG TẤT TAY', 
    desc: 'Cược điểm EXP, thi đấu Real-time với đối thủ', 
    color: '#FF007F', 
    locked: false 
  },
  { 
    id: 3, 
    name: 'TRẠM 3: BÓNG MA (SHADOW BOSS)', 
    desc: 'Thách đấu bản thu âm bóng ma của Top Player tuần trước', 
    color: '#FFD700', 
    locked: false 
  },
  { 
    id: 4, 
    name: 'TRẠM 4: CỨU TRỢ OASIS', 
    desc: 'Thư giãn, chỉnh chậm khẩu hình răng/môi/lưỡi 0.75x', 
    color: '#39FF14', 
    locked: false 
  },
];

export default function SubwayMapScreen({ onSelectStation }: { onSelectStation: (id: number) => void }) {
  const [userData, setUserData] = useState<{ username: string; exp: number; tier: string }>({
    username: auth.currentUser?.displayName || 'Viber_Runner',
    exp: 0,
    tier: 'BRONZE'
  });

  // 🔄 LẤY DỮ LIỆU EXP THỰC TẾ TỪ FIREBASE FIRESTORE
  useEffect(() => {
    const fetchUserProfile = async () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const docRef = doc(db, 'users', uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              username: data.username || auth.currentUser?.displayName || 'Viber_Runner',
              exp: data.exp || 0,
              tier: data.tier || 'BRONZE'
            });
          }
        } catch (error) {
          console.error('Lỗi tải thông tin user:', error);
        }
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <View style={styles.container}>
      {/* 👤 THANH THÔNG TIN NGƯỜI DÙNG & NÚT LOGOUT */}
      <View style={styles.userHeaderBar}>
        <View style={styles.userInfoBox}>
          <Text style={styles.userNameText}>👤 {userData.username}</Text>
          <Text style={styles.userExpText}>
            ⚡ {userData.exp} EXP <Text style={styles.userTierText}>[{userData.tier}]</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
          <Text style={styles.logoutText}>🚪 ĐĂNG XUẤT</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.headerTitle}>[ VIBESPEAK SUBWAY MAP ]</Text>
      <Text style={styles.subHeader}>Chọn lộ trình của bạn, Runner.</Text>

      <ScrollView contentContainerStyle={styles.mapContainer} showsVerticalScrollIndicator={false}>
        {STATIONS.map((station, index) => {
          const isNextLocked = STATIONS[index + 1]?.locked ?? true;

          return (
            <View key={station.id} style={styles.stationWrapper}>
              {index !== STATIONS.length - 1 && (
                <View style={[
                  styles.railLine, 
                  { backgroundColor: isNextLocked ? '#333' : '#00FFFF' }
                ]} />
              )}
              
              <TouchableOpacity
                style={[
                  styles.stationNode,
                  { 
                    borderColor: station.locked ? '#444' : station.color,
                    backgroundColor: station.locked ? '#0D0814' : '#120B2C',
                    shadowColor: station.locked ? 'transparent' : station.color,
                  }
                ]}
                disabled={station.locked}
                onPress={() => onSelectStation(station.id)}
              >
                <View style={[styles.nodeIcon, { borderColor: station.locked ? '#555' : station.color }]}>
                  <Text style={{ fontSize: 20 }}>{station.locked ? '🔒' : '🚉'}</Text>
                </View>
                <View style={styles.nodeInfo}>
                  <Text style={[styles.stationName, { color: station.locked ? '#666' : station.color }]}>
                    {station.name}
                  </Text>
                  <Text style={[styles.stationDesc, { color: station.locked ? '#555' : '#AAA' }]}>
                    {station.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A051B', padding: 20, paddingTop: 40 },
  
  userHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0D0620', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#39FF14', marginBottom: 20 },
  userInfoBox: { flex: 1 },
  userNameText: { color: '#00FFFF', fontSize: 13, fontWeight: '900', fontFamily: 'Courier New' },
  userExpText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold', fontFamily: 'Courier New', marginTop: 2 },
  userTierText: { color: '#FF007F' },
  logoutBtn: { backgroundColor: '#1A0B2E', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FF007F' },
  logoutText: { color: '#FF007F', fontSize: 10, fontWeight: '900', fontFamily: 'Courier New' },

  headerTitle: { color: '#00FFFF', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 4, fontFamily: 'Courier New', textShadowColor: '#00FFFF', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  subHeader: { color: '#FF007F', fontSize: 13, textAlign: 'center', marginBottom: 25, fontStyle: 'italic', fontFamily: 'Courier New' },
  mapContainer: { alignItems: 'center', paddingBottom: 50 },
  stationWrapper: { alignItems: 'center', width: '100%', position: 'relative', marginBottom: 25 },
  
  railLine: { position: 'absolute', width: 4, height: 110, top: 40, zIndex: -1, borderRadius: 2 },
  
  stationNode: { flexDirection: 'row', alignItems: 'center', width: '95%', padding: 15, borderRadius: 12, borderWidth: 2, zIndex: 1, elevation: 10, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10 },
  nodeIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#0A0A1B', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 2 },
  nodeInfo: { flex: 1 },
  stationName: { fontSize: 14, fontWeight: '900', marginBottom: 5, textTransform: 'uppercase', fontFamily: 'Courier New' },
  stationDesc: { fontSize: 11, lineHeight: 16, fontFamily: 'Courier New' },
});