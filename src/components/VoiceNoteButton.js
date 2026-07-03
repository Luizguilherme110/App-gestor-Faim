import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { radius, spacing, useTheme } from '../theme/theme';

export default function VoiceNoteButton({ onTranscribed }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [gravando, setGravando] = useState(false);
  const recognitionRef = useRef(null); // apenas para Web

  // ── Eventos nativos (Android/iOS via expo-speech-recognition) ──
  useSpeechRecognitionEvent('start', () => setGravando(true));
  useSpeechRecognitionEvent('end', () => setGravando(false));
  useSpeechRecognitionEvent('result', (event) => {
    const texto = event.results[0]?.transcript;
    if (texto) onTranscribed(texto);
  });
  useSpeechRecognitionEvent('error', (event) => {
    setGravando(false);
    if (event.error !== 'aborted') {
      Alert.alert('Erro ao reconhecer voz', event.message || event.error);
    }
  });

  // ── Web ──
  const iniciarWeb = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Alert.alert('Não suportado', 'Tente Chrome ou Edge.');
      return;
    }
    try {
      const r = new SpeechRecognition();
      recognitionRef.current = r;
      r.lang = 'pt-BR';
      r.interimResults = false;
      r.onstart = () => setGravando(true);
      r.onresult = (e) => { onTranscribed(e.results[0]?.[0]?.transcript || ''); setGravando(false); };
      r.onerror = (e) => { setGravando(false); if (e.error !== 'aborted') Alert.alert('Erro', e.error); };
      r.onend = () => setGravando(false);
      r.start();
    } catch (_) { setGravando(false); }
  };

  // ── Native ──
  const iniciarNative = async () => {
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Autorize o microfone para usar esta função.');
      return;
    }
    ExpoSpeechRecognitionModule.start({ lang: 'pt-BR', interimResults: false, continuous: false });
  };

  const handlePress = () => {
    if (gravando) {
      if (Platform.OS === 'web') {
        recognitionRef.current?.stop();
      } else {
        ExpoSpeechRecognitionModule.stop();
      }
    } else {
      Platform.OS === 'web' ? iniciarWeb() : iniciarNative();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.btn, gravando && styles.btnGravando]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <Text style={styles.icon}>{gravando ? '🛑' : '🎤'}</Text>
      <Text style={styles.label}>
        {gravando ? 'Ouvindo… toque para parar' : 'Falar anotação'}
      </Text>
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  btnGravando: {
    backgroundColor: '#fecaca',
    borderWidth: 2,
    borderColor: colors.expense,
  },
  icon: { fontSize: 18, marginRight: spacing.sm },
  label: { fontSize: 14, color: colors.text, fontWeight: '500' },
});
