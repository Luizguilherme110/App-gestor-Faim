import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from './Icon';
import { TIPO } from '../hooks/useTransactions';
import { radius, spacing, tabular, type, useTheme } from '../theme/theme';
import {
  digitsToNumber,
  extractDigits,
  formatBRL,
  formatDigitsAsCurrency,
} from '../utils/currency';
import VoiceNoteButton from './VoiceNoteButton';

// Formulário de cadastro/edição. Quando `editing` é passado, entra em modo
// edição (prefill + botões de atualizar/cancelar). Devolve payload limpo.
// `obraFixa` — quando definido, o campo categoria fica pré-preenchido e bloqueado.
export default function TransactionForm({ editing, obraFixa, onSubmit, onUpdate, onCancelEdit }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tipo, setTipo] = useState(TIPO.GASTO);
  const [valorDigits, setValorDigits] = useState('');
  const [categoria, setCategoria] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const editando = !!editing;
  const ehGasto = tipo === TIPO.GASTO;

  // Sincroniza os campos quando um lançamento é selecionado para edição.
  useEffect(() => {
    if (editing) {
      setTipo(editing.tipo);
      setValorDigits(String(Math.round((Number(editing.valor) || 0) * 100)));
      setCategoria(editing.categoria || '');
      setObservacao(editing.observacao || '');
    }
  }, [editing]);

  const limpar = () => {
    setTipo(TIPO.GASTO);
    setValorDigits('');
    setCategoria(obraFixa || '');
    setObservacao('');
  };

  const handleSalvar = async () => {
    const valor = digitsToNumber(valorDigits);
    const categoriaFinal = obraFixa || categoria;

    if (valor <= 0) {
      Alert.alert('Atenção', 'Informe um valor maior que zero.');
      return;
    }
    if (!categoriaFinal.trim()) {
      Alert.alert(
        'Atenção',
        ehGasto
          ? 'Informe o nome da obra ou fornecedor.'
          : 'Informe o apartamento ou comprador.',
      );
      return;
    }

    const payload = { tipo, valor, categoria: categoriaFinal, observacao };

    try {
      setSalvando(true);
      if (editando) {
        await onUpdate(editing.id, payload);
      } else {
        await onSubmit(payload);
      }
      limpar();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o registro.');
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = () => {
    limpar();
    onCancelEdit?.();
  };

  const corTipo = ehGasto ? colors.expense : colors.income;

  return (
    <View style={[styles.form, editando && { borderColor: colors.primary }]}>
      {editando && (
        <View style={styles.editBanner}>
          <Icon name="edit-3" size={14} color={colors.primary} />
          <Text style={styles.editBannerText} numberOfLines={1}>
            Editando {formatBRL(editing.valor)}
          </Text>
        </View>
      )}

      {/* Segmentado gasto/venda. O ativo ganha fundo elevado e cor no rótulo;
          o inativo fica sobre o trilho neutro. */}
      <View style={styles.segmento}>
        <TouchableOpacity
          style={[styles.segmentoBtn, ehGasto && styles.segmentoAtivo]}
          onPress={() => setTipo(TIPO.GASTO)}
          accessibilityRole="button"
          accessibilityState={{ selected: ehGasto }}
        >
          <Text
            style={[styles.segmentoTxt, ehGasto && { color: colors.expense, fontWeight: '700' }]}
          >
            Registrar gasto
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentoBtn, !ehGasto && styles.segmentoAtivo]}
          onPress={() => setTipo(TIPO.RECEITA)}
          accessibilityRole="button"
          accessibilityState={{ selected: !ehGasto }}
        >
          <Text
            style={[styles.segmentoTxt, !ehGasto && { color: colors.income, fontWeight: '700' }]}
          >
            Venda na planta
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Valor</Text>
        <TextInput
          style={[styles.input, styles.inputValor, { color: corTipo }]}
          placeholder="R$ 0,00"
          placeholderTextColor={colors.textFaint}
          keyboardType="numeric"
          value={formatDigitsAsCurrency(valorDigits)}
          onChangeText={(t) => setValorDigits(extractDigits(t))}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>
          {ehGasto ? 'Obra ou fornecedor' : 'Apartamento ou comprador'}
        </Text>
        <TextInput
          style={[styles.input, obraFixa && styles.inputBloqueado]}
          placeholder={ehGasto ? 'Ex: Edifício Alpha' : 'Ex: Apto 21'}
          placeholderTextColor={colors.textFaint}
          value={obraFixa || categoria}
          onChangeText={obraFixa ? undefined : setCategoria}
          editable={!obraFixa}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Anotação</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 20 sacos de cimento"
          placeholderTextColor={colors.textFaint}
          value={observacao}
          onChangeText={setObservacao}
        />
      </View>

      <VoiceNoteButton
        onTranscribed={(texto) =>
          setObservacao((prev) => (prev ? `${prev} ${texto}` : texto))
        }
      />

      <TouchableOpacity
        style={[styles.salvarBtn, salvando && styles.btnDisabled]}
        onPress={handleSalvar}
        disabled={salvando}
        activeOpacity={0.8}
      >
        <Text style={styles.salvarTxt}>
          {editando ? 'Atualizar registro' : 'Salvar registro'}
        </Text>
      </TouchableOpacity>

      {editando && (
        <TouchableOpacity style={styles.cancelarBtn} onPress={handleCancelar}>
          <Text style={styles.cancelarTxt}>Cancelar edição</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  form: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  editBannerText: { ...type.meta, color: colors.primary, fontWeight: '600' },
  segmento: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: 3,
    marginBottom: spacing.lg,
  },
  segmentoBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm - 3,
    minHeight: 44,
  },
  segmentoAtivo: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentoTxt: { ...type.meta, fontWeight: '600', color: colors.textMuted },
  campo: { marginBottom: spacing.md },
  label: { ...type.micro, color: colors.textMuted, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    fontSize: 16,
    color: colors.text,
    minHeight: 48,
  },
  inputValor: { ...tabular, fontSize: 22, fontWeight: '700' },
  inputBloqueado: { color: colors.textMuted },
  salvarBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 50,
  },
  btnDisabled: { opacity: 0.6 },
  salvarTxt: { ...type.corpoForte, fontSize: 16, fontWeight: '700', color: colors.onPrimary },
  cancelarBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelarTxt: { ...type.corpoForte, color: colors.textMuted },
});
