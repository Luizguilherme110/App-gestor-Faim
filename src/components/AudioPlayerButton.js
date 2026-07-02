import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors, radius, spacing } from '../theme/theme';
import { formatDuration } from '../utils/format';

// Botão de reprodução de uma nota de voz. Renderizado apenas quando existe
// uri (garante que o hook useAudioPlayer sempre recebe uma fonte válida).
export default function AudioPlayerButton({ uri, durationMillis }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const tocando = status.playing;

  const alternar = () => {
    if (tocando) {
      player.pause();
    } else {
      // Se já chegou ao fim, reinicia do começo.
      if (status.didJustFinish || status.currentTime >= (status.duration || 0)) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  return (
    <TouchableOpacity style={styles.btn} onPress={alternar} hitSlop={6}>
      <Text style={styles.icon}>{tocando ? '⏸️' : '▶️'}</Text>
      <Text style={styles.text}>{formatDuration(durationMillis)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.inputBg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  icon: { fontSize: 13, marginRight: spacing.xs },
  text: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
});
