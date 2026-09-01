import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { radius, shadowFlutuante, spacing, type, useTheme } from '../theme/theme';

// Passos curtos em linguagem simples, pensados para quem tem pouca
// familiaridade com tecnologia.
const PASSOS = [
  {
    icone: 'plus-square',
    titulo: '1. Crie uma obra',
    texto:
      'Toque em "Nova obra" e dê um nome (ex: Casa da Rua 10). Cada obra guarda seus próprios gastos e vendas.',
  },
  {
    icone: 'edit-3',
    titulo: '2. Registre gastos e vendas',
    texto:
      'Toque no card da obra para abri-la. Escolha "Registrar gasto" ou "Venda na planta", digite o valor e salve.',
  },
  {
    icone: 'trash-2',
    titulo: '3. Editar ou excluir',
    texto:
      'Toque em um lançamento para editar. Segure para excluir. Segure o card de uma obra para renomear ou excluir a obra.',
  },
  {
    icone: 'share',
    titulo: '4. Gerar relatório',
    texto:
      'Abra a obra e toque em "Exportar". Você escolhe entre planilha do Excel ou PDF, pronto para enviar pelo WhatsApp.',
  },
  {
    icone: 'hard-drive',
    titulo: '5. Cópia de segurança (importante)',
    texto:
      'Seus dados ficam guardados só neste celular. Em "Opções", use "Salvar cópia de segurança" para gerar um arquivo. Ao trocar de celular, use "Restaurar" para recuperar tudo.',
  },
];

export default function AjudaModal({ visible, onClose }) {
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
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          <Text style={styles.titulo}>Como usar o app</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {PASSOS.map((p) => (
              <View key={p.titulo} style={styles.passo}>
                <Icon name={p.icone} size={20} color={colors.primary} style={styles.passoIcone} />
                <View style={styles.passoTextos}>
                  <Text style={styles.passoTitulo}>{p.titulo}</Text>
                  <Text style={styles.passoTexto}>{p.texto}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.botao} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.botaoTxt}>Entendi</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
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
  titulo: { ...type.titulo, fontSize: 20, color: colors.textStrong },
  scroll: { marginTop: spacing.lg },
  passo: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  passoIcone: { width: 24, textAlign: 'center', marginTop: 2 },
  passoTextos: { flex: 1 },
  passoTitulo: { ...type.corpoForte, color: colors.textStrong, marginBottom: 2 },
  passoTexto: { ...type.meta, color: colors.textMuted, lineHeight: 20 },
  botao: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
    minHeight: 48,
    justifyContent: 'center',
  },
  botaoTxt: { ...type.corpoForte, fontSize: 16, color: colors.onPrimary },
});
