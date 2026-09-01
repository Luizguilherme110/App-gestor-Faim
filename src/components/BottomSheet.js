import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { radius, shadowFlutuante, spacing, type, useTheme } from '../theme/theme';

// Caixa deslizante que sobe de baixo. Fecha tocando fora ou no botão voltar
// do Android. Substitui os menus de Alert (que quebram no Android com muitas
// opções e não permitem cancelar).
//
// O conteúdo rola: menus longos (a lista de meses da exportação, por exemplo)
// passariam da altura da tela e as últimas opções ficariam inalcançáveis.
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
          {!!titulo && <Text style={styles.titulo} numberOfLines={2}>{titulo}</Text>}
          {!!subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Uma linha de opção. `icone` é um nome de glifo Feather (ver src/components/Icon.js).
export function SheetOption({ icone, titulo, descricao, onPress, destrutivo }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const cor = destrutivo ? colors.danger : colors.text;

  return (
    <TouchableOpacity
      style={styles.opcao}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
    >
      {!!icone && <Icon name={icone} size={20} color={cor} style={styles.opcaoIcone} />}
      <View style={styles.opcaoTextos}>
        <Text style={[styles.opcaoTitulo, { color: destrutivo ? colors.danger : colors.textStrong }]}>
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
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    ...shadowFlutuante,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg,
  },
  titulo: { ...type.titulo, color: colors.textStrong },
  subtitulo: { ...type.meta, color: colors.textMuted, marginTop: spacing.xs },
  scroll: { marginTop: spacing.sm },
  scrollContent: { paddingBottom: spacing.xs },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  opcaoIcone: { width: 24, textAlign: 'center' },
  opcaoTextos: { flex: 1 },
  opcaoTitulo: { ...type.corpoForte },
  opcaoDescricao: { ...type.meta, color: colors.textMuted, marginTop: 1 },
});
