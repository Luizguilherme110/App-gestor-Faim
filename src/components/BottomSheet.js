import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, shadow, spacing, useTheme } from '../theme/theme';

// Caixa deslizante que sobe de baixo. Fecha tocando fora ou no botão voltar
// do Android. Substitui os menus de Alert (que quebram no Android com muitas
// opções e não permitem cancelar).
export default function BottomSheet({ visible, onClose, titulo, subtitulo, children }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* onPress vazio "captura" o toque, impedindo que feche ao tocar dentro */}
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          {!!titulo && <Text style={styles.titulo}>{titulo}</Text>}
          {!!subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Uma linha de opção grande, com ícone (emoji), título e descrição.
export function SheetOption({ icone, titulo, descricao, onPress, destrutivo }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity style={styles.opcao} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.opcaoIcone, destrutivo && styles.opcaoIconeDestrutivo]}>
        <Text style={styles.opcaoEmoji}>{icone}</Text>
      </View>
      <View style={styles.opcaoTextos}>
        <Text style={[styles.opcaoTitulo, destrutivo && styles.opcaoTituloDestrutivo]}>
          {titulo}
        </Text>
        {!!descricao && <Text style={styles.opcaoDescricao}>{descricao}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    ...shadow,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitulo: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  opcaoIcone: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  opcaoIconeDestrutivo: { backgroundColor: colors.expenseBg },
  opcaoEmoji: { fontSize: 22 },
  opcaoTextos: { flex: 1 },
  opcaoTitulo: { fontSize: 16, fontWeight: '600', color: colors.text },
  opcaoTituloDestrutivo: { color: colors.expense },
  opcaoDescricao: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
