import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { colors, radius, spacing } from '../theme/theme';
import { formatDuration } from '../utils/format';

// Botão de gravação de voz real (expo-audio). Ao parar, entrega
// { uri, durationMillis } via onRecorded. Se já existe áudio, permite remover.
export default function AudioRecorderButton({ audioUri, durationMillis, onRecorded, onClear }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const [busy, setBusy] = useState(false);

  const iniciar = async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permissão negada',
          'Autorize o acesso ao microfone para gravar notas de voz.',
        );
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível iniciar a gravação.');
    }
  };

  const parar = async () => {
    setBusy(true);
    try {
      const duracao = state.durationMillis;
      await recorder.stop();
      if (recorder.uri) {
        onRecorded({ uri: recorder.uri, durationMillis: duracao });
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível finalizar a gravação.');
    } finally {
      setBusy(false);
    }
  };

  // Já existe um áudio anexado → mostra duração + opção de remover.
  if (audioUri && !state.isRecording) {
    return (
      <View style={[styles.pill, styles.pillGravado]}>
        <Text style={styles.pillIcon}>🎧</Text>
        <Text style={styles.pillText}>Áudio {formatDuration(durationMillis)}</Text>
        <TouchableOpacity onPress={onClear} hitSlop={8}>
          <Text style={styles.remover}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state.isRecording) {
    return (
      <TouchableOpacity
        style={[styles.pill, styles.pillGravando]}
        onPress={parar}
        disabled={busy}
      >
        <Text style={styles.pillIcon}>🛑</Text>
        <Text style={styles.pillText}>
          Gravando {formatDuration(state.durationMillis)} — toque p/ parar
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.pill} onPress={iniciar} disabled={busy}>
      <Text style={styles.pillIcon}>🎤</Text>
      <Text style={styles.pillText}>Gravar nota de voz</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  pillGravando: { backgroundColor: colors.recording },
  pillGravado: { backgroundColor: colors.incomeBg },
  pillIcon: { fontSize: 18, marginRight: spacing.sm },
  pillText: { flex: 1, color: colors.text, fontWeight: '600' },
  remover: { color: colors.danger, fontWeight: 'bold', fontSize: 16, paddingHorizontal: spacing.xs },
});
