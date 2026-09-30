// src/screens/Station4Screen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { evaluateSpeaking, AssessmentResult } from '../services/arena/assessmentService';
import { generateStation4Scenario, Station4Scenario } from '../services/arena/station4Service';
import { updateUserProgress } from '../services/userService';

interface Props {
  onBack: () => void;
}

export default function Station4Screen({ onBack }: Props) {
  const [cefrLevel, setCefrLevel] = useState<string>('B2');
  const [loading, setLoading] = useState<boolean>(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);
  
  const [scenario, setScenario] = useState<Station4Scenario null |>(null);
  const [battleState, setBattleState] = useState<'idle' | 'battling' | 'analyzing' | 'ended'>('idle');
  
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob null |>(null);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);

  const [result, setResult] = useState<AssessmentResult null |>(null);

  const mediaRecorderRef = useRef<MediaRecorder null |>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement null |>(null);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  // 🔊 GIỌNG ĐỌC TỰ NHIÊN QUA GOOGLE TTS & BROWSERS NATURAL VOICE
  const playPromptTTS = (textToSpeak: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    try {
      setIsPlayingTTS(true);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      const encodedText = encodeURIComponent(textToSpeak);
      const ttsUrl = `[https://translate.google.com/translate_tts?ie=UTF-8&q=$](https://translate.google.com/translate_tts?ie=UTF-8&q=$){encodedText}&tl=en&client=tw-ob`;

      const audio = new Audio(ttsUrl);
      currentAudioRef.current = audio;
      
      audio.onplay = () => setIsPlayingTTS(true);
      audio.onended = () => setIsPlayingTTS(false);
      audio.onerror = () => {
        fallbackBrowserTTS(textToSpeak);
      };

      audio.play().catch(() => fallbackBrowserTTS(textToSpeak));
    } catch (err) {
      fallbackBrowserTTS(textToSpeak);
    }
  };

  const fallbackBrowserTTS = (textToSpeak: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const premiumVoice = voices.find(v => 
        v.lang.includes('en') && (
          v.name.includes('Google') || 
          v.name.includes('Natural') || 
          v.name.includes('Samantha') || 
          v.name.includes('Daniel')
        )
      );

      if (premiumVoice) {
        utterance.voice = premiumVoice;
      }

      utterance.onstart = () => setIsPlayingTTS(true);
      utterance.onend = () => setIsPlayingTTS(false);
      utterance.onerror = () => setIsPlayingTTS(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const loadScenario = async (level: string) => {
    setLoading(true);
    resetState();
    const data = await generateStation4Scenario(level);
    setScenario(data);
    setLoading(false);

    if (data && data.context) {
      setTimeout(() => {
        playPromptTTS(data.context);
      }, 400);
    }
  };

  useEffect(() => {
    loadScenario(cefrLevel);
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [cefrLevel]);

  const resetState = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    setBattleState('idle');
    setIsRecording(false);
    setIsPlayingTTS(false);
    setRecordedAudio(null);
    setHasRecorded(false);
    setResult(null);
    audioChunksRef.current = [];
  };

  const handleToggleRecord = async () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingTTS(false);
    }

    if (!isRecording) {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          let options = {};
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options = { mimeType: 'audio/webm;codecs=opus' };
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
          }

          const mediaRecorder = new MediaRecorder(stream, options);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const recordedBlob = new Blob(audioChunksRef.current, { type: mimeType });
            
            if (recordedBlob.size > 8000) {
              setRecordedAudio(recordedBlob);
              setHasRecorded(true);
            } else {
              setRecordedAudio(null);
              setHasRecorded(false);
              alert("⚠️ Chưa ghi nhận giọng nói rõ ràng! Vui lòng bấm giữ nút và đưa ra phản hồi.");
            }
            stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start(200);