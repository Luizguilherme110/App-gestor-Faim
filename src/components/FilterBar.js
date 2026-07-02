import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../theme/theme';

export const TODOS = '__todos__';

// Barra horizontal de chips para filtrar por obra/apartamento.
// A lista de obras é derivada dos próprios lançamentos.
export default function FilterBar({ obras, selecionada, onSelect }) {
  if (!obras.length) return null;

  const opcoes = [TODOS, ...obras];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {opcoes.map((obra) => {
        const ativo = selecionada === obra;
        return (
          <TouchableOpacity
            key={obra}
            style={[styles.chip, ativo && styles.chipAtivo]}
            onPress={() => onSelect(obra)}
          >
            <Text style={[styles.chipText, ativo && styles.chipTextAtivo]}>
              {obra === TODOS ? 'Todos' : obra}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.xs, paddingRight: spacing.md },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.inputBg,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  chipTextAtivo: { color: '#fff' },
});
