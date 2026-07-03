import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, shadow, spacing, useTheme } from '../theme/theme';
import { formatBRL } from '../utils/currency';

// Painel de resumo (gastos, vendas e saldo). Componente puro de apresentação.
export default function Dashboard({ totalGastos, totalGanhos, saldo }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const saldoNegativo = saldo < 0;

  return (
    <View style={styles.dashboard}>
      <Text style={styles.title}>Gestão de Obras & Vendas</Text>

      <View style={styles.cards}>
        <View style={[styles.card, { backgroundColor: colors.expenseBg }]}>
          <Text style={styles.cardLabel}>Gastos Obras</Text>
          <Text style={[styles.cardValue, { color: colors.expense }]}>
            {formatBRL(totalGastos)}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.incomeBg }]}>
          <Text style={styles.cardLabel}>Vendas Planta</Text>
          <Text style={[styles.cardValue, { color: colors.income }]}>
            {formatBRL(totalGanhos)}
          </Text>
        </View>
      </View>

      <Text style={styles.saldoLabel}>
        Saldo Disponível:{' '}
        <Text
          style={[
            styles.saldoValue,
            { color: saldoNegativo ? colors.expense : colors.income },
          ]}
        >
          {formatBRL(saldo)}
        </Text>
      </Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  dashboard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.md,
    ...shadow,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  cards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  card: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  cardLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  cardValue: { fontSize: 16, fontWeight: 'bold', marginTop: spacing.xs },
  saldoLabel: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  saldoValue: { fontWeight: 'bold' },
});
