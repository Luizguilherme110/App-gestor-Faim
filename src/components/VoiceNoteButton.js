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

// No celular (Expo Go), o nativo do Voice é null — desabilitado por padrão.
// Só funciona em dev/production builds com EAS.
// Por segurança, sempre desabilitamos no celular — Voice falha no Expo Go.
const voiceModuleAvailable = false; // Mude para true apenas após dev build EAS

export default function VoiceNoteButton({ onTranscribed }) {
  const [gravando, setGravando] = useState(false);
  const [usando, setUsando] = useState(null); // 'web' | 'native' | null
  const recognitionRef = useRef(null);

  // Botão desabilitado se não tiver voice no celular
  const desabilitado = Platform.OS !== 'web' && !voiceModuleAvailable;

  useEffect(() => {
    return () => {
      if (usando === 'web') {
        recognitionRef.current?.abort();
      }
    };
  }, [usando]);

  // ======================= WEB / FALLBACK =======================
  const iniciarWeb = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      Alert.alert(
        'Não suportado',
        'Seu navegador não suporta reconhecimento de voz. Tente Chrome, Edge ou Firefox.',
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setGravando(true);
        setUsando('web');
      };

      recognition.onresult = (event) => {
        const texto = event.results[0]?.[0]?.transcript;
        if (texto) {
          onTranscribed(texto);
        }
        setGravando(false);
      };

      recognition.onerror = (event) => {
        setGravando(false);
        if (event.error !== 'aborted') {
          Alert.alert('Erro de reconhecimento', `${event.error}`);
        }
      };

      recognition.onend = () => {
        setGravando(false);
        setUsando(null);
      };

      recognition.start();
    } catch (e) {
      setGravando(false);
      Alert.alert('Erro', 'Não foi possível iniciar o reconhecimento.');
    }
  };

  const pararWeb = () => {
    try {
      recognitionRef.current?.stop();
    } catch (_) {}
    setGravando(false);
  };

  // ====================== NATIVE (Android/iOS) =====================
  // Nunca chamado pois voiceModuleAvailable = false no Expo Go
  const iniciarNative = async () => {};
  const pararNative = async () => {};

  // =================== HANDLER UNIFICADO ===================
  const handlePress = () => {
    if (desabilitado) {
      Alert.alert(
        '⚠️ Reconhecimento de voz não disponível',
        'Este recurso só funciona com um build de desenvolvimento (EAS).\n\nPor enquanto, use o campo de texto para digitar suas anotações.',
      );
      return;
    }

    if (gravando) {
      if (usando === 'web') {
        pararWeb();
      } else if (usando === 'native') {
        pararNative();
      }
    } else {
      if (Platform.OS === 'web') {
        iniciarWeb();
      } else {
        iniciarNative();
      }
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        gravando && styles.btnGravando,
        desabilitado && styles.btnDesabilitado,
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
      disabled={desabilitado}
    >
      <Text style={styles.icon}>{gravando ? '🛑' : desabilitado ? '🔒' : '🎤'}</Text>
      <Text style={[styles.label, desabilitado && styles.labelDesabilitado]}>
        {desabilitado
          ? 'Falar anotação (indisponível no Expo Go)'
          : gravando
          ? 'Ouvindo… toque para parar'
          : 'Falar anotação'}
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
  btnGravando: {
    backgroundColor: '#fecaca',
    borderWidth: 2,
    borderColor: colors.expense,
  },
  btnDesabilitado: {
    backgroundColor: '#e5e7eb',
    opacity: 0.6,
  },
  icon: { fontSize: 18, marginRight: spacing.sm },
  label: { fontSize: 14, color: colors.text, fontWeight: '500' },
  labelDesabilitado: { color: colors.textMuted },
});
