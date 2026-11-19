// src/components/VoiceConsentModal.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { supabase } from '../utils/supabase';
import { getSavedStudentProfile } from '../utils/studentSession';

const CONSENT_STORAGE_KEY = 'vibespeak_voice_consent_v1_2026';

export function hasUserAcceptedVoiceConsent(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  return window.localStorage.getItem(CONSENT_STORAGE_KEY) === 'ACCEPTED';
}

interface Props {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function VoiceConsentModal({ visible, onAccept, onDecline }: Props) {
  const [checkedAgree, setCheckedAgree] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const handleConfirm = async () => {
    if (!checkedAgree || saving) return;
    setSaving(true);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, 'ACCEPTED');
      }

      if (supabase) {
        const profile = getSavedStudentProfile();
        await supabase.from('voice_consent_logs').insert([
          {
            student_code: profile.studentCode || 'GUEST',
            student_name: profile.studentName || 'Học viên VibeSpeak',
            class_code: profile.classCode || 'PUBLIC',
            consent_version: 'v1.0-2026',
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          },
        ]);
      }
    } catch {
      // Không chặn trải nghiệm học nếu log mạng tạm gián đoạn
    } finally {
      setSaving(false);
      onAccept();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.badge}>🛡️ QUYỀN RIÊNG TƯ & BẢO MẬT DỮ LIỆU GIỌNG NÓI</Text>
          <Text style={styles.title}>CHẤP THUẬN THU THẬP & XỬ LÝ ÂM THANH</Text>

          <ScrollView style={styles.bodyBox} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>1. Mục đích thu thập bản ghi âm:</Text>
            <Text style={styles.paragraph}>
              • Hệ thống VibeSpeak chỉ kích hoạt micro khi bạn bấm nút ghi âm nhằm phân tích phát âm, ngữ điệu, ngữ pháp bằng AI và gửi bài nộp cho Giảng viên phụ trách lớp thẩm định điểm.
            </Text>

            <Text style={styles.sectionTitle}>2. Phạm vi chia sẻ & Lưu trữ:</Text>
            <Text style={styles.paragraph}>
              • Bản ghi âm được mã hóa truyền tải (HTTPS) và chỉ hiển thị cho chính bạn cùng Giảng viên quản lý mã lớp bạn đã tham gia. Chúng tôi không bán hoặc sử dụng giọng nói của bạn cho mục đích quảng cáo.
            </Text>

            <Text style={styles.sectionTitle}>3. Thời hạn lưu trữ & Tự động hủy dữ liệu:</Text>
            <Text style={styles.paragraph}>
              • Toàn bộ tệp âm thanh gốc được <Text style={{ color: '#00FFFF', fontWeight: 'bold' }}>tự động xóa vĩnh viễn sau 180 ngày (6 tháng)</Text> kể từ ngày nộp bài nhằm bảo vệ quyền riêng tư và tối ưu hạ tầng lưu trữ. Hệ thống chỉ giữ lại kết quả điểm số và văn bản đánh giá phục vụ đối chiếu học tập.
            </Text>
          </ScrollView>

          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.8}
            onPress={() => setCheckedAgree((prev) => !prev)}
          >
            <View style={[styles.checkbox, checkedAgree && styles.checkboxChecked]}>
              {checkedAgree && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Tôi đã đọc, hiểu rõ và đồng ý cho phép VibeSpeak ghi âm giọng nói phục vụ chấm điểm học tập.
            </Text>
          </TouchableOpacity>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
              <Text style={styles.declineText}>TỪ CHỐI</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acceptBtn, !checkedAgree && { opacity: 0.45 }]}
              disabled={!checkedAgree || saving}
              onPress={handleConfirm}
            >
              <Text style={styles.acceptText}>
                {saving ? '⏳ ĐANG LƯU...' : '🎙️ ĐỒNG Ý & BẬT MICRO'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 2, 13, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0D0620',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#00FFFF',
    padding: 18,
  },
  badge: {
    color: '#39FF14',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#FFD700',
    fontSize: 13.5,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  bodyBox: {
    maxHeight: 240,
    backgroundColor: '#070212',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#221144',
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#00FFFF',
    fontSize: 10.5,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 3,
  },
  paragraph: {
    color: '#E0E0F5',
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#39FF14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#39FF14',
  },
  checkmark: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
  },
  checkboxLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8888AA',
    alignItems: 'center',
  },
  declineText: {
    color: '#8888AA',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  acceptBtn: {
    flex: 1.6,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#39FF14',
    alignItems: 'center',
  },
  acceptText: {
    color: '#000',
    fontSize: 10.5,
    fontWeight: '900',
  },
});