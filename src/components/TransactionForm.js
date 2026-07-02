import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { TIPO } from '../hooks/useTransactions';
import { colors, radius, shadow, spacing } from '../theme/theme';
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
  const [tipo, setTipo] = useState(TIPO.GASTO);
  const [valorDigits, setValorDigits] = useState('');
  const [categoria, setCategoria] = useState('');
  const [observacao, setObservacao] = useState('');

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
          ? 'Informe o nome da obra/fornecedor.'
          : 'Informe o apartamento/comprador.',
      );
      return;
    }

    const payload = {
      tipo,
      valor,
      categoria: categoriaFinal,
      observacao,
    };

    try {
      if (editando) {
        await onUpdate(editing.id, payload);
      } else {
        await onSubmit(payload);
      }
      limpar();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o registro.');
    }
  };

  const handleCancelar = () => {
    limpar();
    onCancelEdit?.();
  };

  return (
    <View style={[styles.form, editando && styles.formEditando]}>
      {editando && (
        <View style={styles.editBanner}>
          <Text style={styles.editBannerText}>
            Editando: {editing.categoria} ({formatBRL(editing.valor)})
          </Text>
        </View>
      )}

      <View style={styles.switch}>
        <TouchableOpacity
          style={[styles.tipoBtn, ehGasto && styles.gastoAtivo]}
          onPress={() => setTipo(TIPO.GASTO)}
        >
          <Text style={[styles.tipoTxt, ehGasto && styles.tipoAtivoTxt]}>
            (-) Registrar Gasto
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tipoBtn, !ehGasto && styles.receitaAtivo]}
          onPress={() => setTipo(TIPO.RECEITA)}
        >
          <Text style={[styles.tipoTxt, !ehGasto && styles.tipoAtivoTxt]}>
            (+) Venda na Planta
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Valor (R$)"
        placeholderTextColor={colors.textFaint}
        keyboardType="numeric"
        value={formatDigitsAsCurrency(valorDigits)}
        onChangeText={(t) => setValorDigits(extractDigits(t))}
      />

      <TextInput
        style={[styles.input, obraFixa && styles.inputBloqueado]}
        placeholder={ehGasto ? 'Nome da Obra / Fornecedor' : 'Apartamento / Comprador'}
        placeholderTextColor={colors.textFaint}
        value={obraFixa || categoria}
        onChangeText={obraFixa ? undefined : setCategoria}
        editable={!obraFixa}
      />

      <TextInput
        style={styles.input}
        placeholder="Alguma anotação extra..."
        placeholderTextColor={colors.textFaint}
        value={observacao}
        onChangeText={setObservacao}
      />

      <VoiceNoteButton
        onTranscribed={(texto) =>
          setObservacao((prev) => (prev ? `${prev} ${texto}` : texto))
        }
      />

      <TouchableOpacity style={styles.salvarBtn} onPress={handleSalvar}>
        <Text style={styles.salvarTxt}>
          {editando ? 'Atualizar Registro' : 'Salvar Registro'}
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

const styles = StyleSheet.create({
  form: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    ...shadow,
  },
  formEditando: { borderWidth: 1, borderColor: colors.primary },
  editBanner: {
    backgroundColor: '#dbeafe',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  editBannerText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  switch: { flexDirection: 'row', marginBottom: spacing.md },
  tipoBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  gastoAtivo: { borderBottomColor: colors.expense },
  receitaAtivo: { borderBottomColor: colors.income },
  tipoTxt: { fontWeight: '600', color: colors.textMuted },
  tipoAtivoTxt: { color: colors.textStrong, fontWeight: 'bold' },
  input: {
    backgroundColor: colors.inputBg,
    padding: spacing.md,
    borderRadius: radius.sm,
    fontSize: 16,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  inputBloqueado: {
    backgroundColor: colors.border,
    color: colors.textMuted,
  },
  salvarBtn: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: radius.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  salvarTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelarBtn: { padding: spacing.md, alignItems: 'center', marginTop: spacing.xs },
  cancelarTxt: { color: colors.textMuted, fontWeight: '600' },
});
