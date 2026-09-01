import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from './Icon';
import { radius, spacing, tabular, type, useTheme } from '../theme/theme';
import { formatBRL } from '../utils/currency';

// Card que representa uma obra na HomeScreen.
// Toque abre a ObraScreen; toque longo abre o menu de renomear/excluir.
//
// A dica de uso saiu daqui: repetida em cada card ela virava ruído. Agora
// aparece uma vez só, acima da lista.
export default function ObraCard({ obra, gastos, ganhos, saldo, onPress, onLongPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const corSaldo = saldo < 0 ? colors.expense : colors.income;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      delayLongPress={500}
      accessibilityRole="button"
      accessibilityLabel={`${obra.nome}, saldo ${formatBRL(saldo)}`}
      accessibilityHint="Toque para abrir. Toque longo para renomear ou excluir."
    >
      <View style={styles.topo}>
        <Text style={styles.nome} numberOfLines={1}>{obra.nome}</Text>
        <Icon name="chevron-right" size={18} color={colors.textFaint} />
      </View>

      <Text style={[styles.saldo, { color: corSaldo }]} numberOfLines={1}>
        {formatBRL(saldo)}
      </Text>

      <View style={styles.meta}>
        <Text style={styles.metaItem}>
          <Text style={styles.metaLabel}>Gastos </Text>
          <Text style={[styles.metaValor, { color: colors.expense }]}>{formatBRL(gastos)}</Text>
        </Text>
        <Text style={styles.metaItem}>
          <Text style={styles.metaLabel}>Vendas </Text>
          <Text style={[styles.metaValor, { color: colors.income }]}>{formatBRL(ganhos)}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  nome: { ...type.titulo, color: colors.textStrong, flex: 1 },
  saldo: { ...type.valor, ...tabular, marginTop: spacing.sm },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  metaItem: { ...type.meta },
  metaLabel: { color: colors.textMuted },
  metaValor: { ...tabular, fontWeight: '600' },
});
