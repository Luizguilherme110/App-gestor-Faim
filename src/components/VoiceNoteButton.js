import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../theme/theme';

// --------------------------------------------------------------------------
// Reconhecimento de voz (speech-to-text)
//
// Web  → usa a Web Speech API nativa do navegador (grátis, sem API key)
// Native → usa @react-native-voice/voice (grátis, usa o STT do Android/iOS)
//          Requer development build (não funciona no Expo Go padrão)
// --------------------------------------------------------------------------

let Voice = null;
if (Platform.OS !== 'web') {
  try {
    Voice = require('@react-native-voice/voice').default;
  } catch (_) {
    // Expo Go sem dev build — funcionalidade desabilitada no celular
  }
}

export default function VoiceNoteButton({ onTranscribed }) {
  const [gravando, setGravando] = useState(false);
  const recognitionRef = useRef(null); // para Web Speech API

  // ---------- limpeza ao desmontar ----------
  useEffect(() => {
    return () => {
      if (Platform.OS === 'web') {
        recognitionRef.current?.abort();
      } else {
        Voice?.destroy().catch(() => {});
      }
    };
  }, []);

  // ======================= WEB =======================
  const iniciarWeb = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      Alert.alert(
        'Não suportado',
        'Seu navegador não suporta reconhecimento de voz. Tente Chrome ou Edge.',
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setGravando(true);

    recognition.onresult = (event) => {
      const texto = event.results[0][0].transcript;
      onTranscribed(texto);
      setGravando(false);
    };

    recognition.onerror = (event) => {
      setGravando(false);
      if (event.error !== 'aborted') {
        Alert.alert('Erro', `Não foi possível reconhecer: ${event.error}`);
      }
    };

    recognition.onend = () => setGravando(false);

    recognition.start();
  };

  const pararWeb = () => {
    recognitionRef.current?.stop();
    setGravando(false);
  };

  // ====================== NATIVE =====================
  const iniciarNative = async () => {
    if (!Voice) {
      Alert.alert(
        'Não disponível',
        'O reconhecimento de voz requer um build de desenvolvimento.\n\nExecute: eas build --profile development',
      );
      return;
    }

    try {
      Voice.onSpeechStart = () => setGravando(true);
      Voice.onSpeechEnd = () => setGravando(false);
      Voice.onSpeechError = (e) => {
        setGravando(false);
        Alert.alert('Erro', e.error?.message || 'Falha no reconhecimento.');
      };
      Voice.onSpeechResults = (e) => {
        const texto = e.value?.[0];
        if (texto) onTranscribed(texto);
        setGravando(false);
      };

      await Voice.start('pt-BR');
    } catch (e) {
      setGravando(false);
      Alert.alert('Erro', 'Não foi possível iniciar o reconhecimento de voz.');
    }
  };

  const pararNative = async () => {
    try {
      await Voice?.stop();
    } catch (_) {}
    setGravando(false);
  };

  // =================== HANDLER UNIFICADO ===================
  const handlePress = () => {
    if (gravando) {
      Platform.OS === 'web' ? pararWeb() : pararNative();
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

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  btnGravando: { backgroundColor: colors.recording ?? '#fca5a5' },
  icon: { fontSize: 18, marginRight: spacing.sm },
  label: { color: colors.text, fontWeight: '600', flex: 1 },
});
