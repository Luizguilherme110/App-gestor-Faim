import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { radius, shadow, spacing, useTheme } from '../theme/theme';
import { formatBRL } from '../utils/currency';

// Card que representa uma obra na HomeScreen.
// Mostra nome, saldo e totais. Pressionar abre a ObraScreen.
export default function ObraCard({ obra, gastos, ganhos, saldo, onPress, onLongPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const saldoNegativo = saldo < 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
      delayLongPress={500}
    >
      <View style={styles.header}>
        <Text style={styles.nome} numberOfLines={1}>{obra.nome}</Text>
        <Text style={[styles.saldo, { color: saldoNegativo ? colors.expense : colors.income }]}>
          {formatBRL(saldo)}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.pill, { backgroundColor: colors.expenseBg }]}>
          <Text style={[styles.pillLabel, { color: colors.expense }]}>
            Gastos: {formatBRL(gastos)}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: colors.incomeBg }]}>
          <Text style={[styles.pillLabel, { color: colors.income }]}>
            Receitas: {formatBRL(ganhos)}
          </Text>
        </View>
      </View>

      <Text style={styles.hint}>Toque para abrir · Segure para renomear/excluir</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  saldo: { fontSize: 16, fontWeight: 'bold' },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  pill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  pillLabel: { fontSize: 12, fontWeight: '600' },
  hint: { fontSize: 11, color: colors.textFaint, marginTop: spacing.xs },
});
