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
import { radius, shadow, spacing, useTheme } from '../theme/theme';

// Passos curtos em linguagem simples, pensados para quem tem pouca
// familiaridade com tecnologia.
const PASSOS = [
  {
    icone: '🏗️',
    titulo: '1. Crie uma obra',
    texto:
      'Toque em "+ Nova obra" e dê um nome (ex: Casa da Rua 10). Cada obra guarda seus próprios gastos e vendas.',
  },
  {
    icone: '💰',
    titulo: '2. Registre gastos e vendas',
    texto:
      'Toque no card da obra para abri-la. Escolha "Registrar Gasto" ou "Venda na Planta", digite o valor e salve.',
  },
  {
    icone: '✏️',
    titulo: '3. Editar ou excluir',
    texto:
      'Toque em um lançamento para editar. Segure para excluir. Segure o card de uma obra para renomear ou excluir a obra.',
  },
  {
    icone: '📊',
    titulo: '4. Gerar relatório',
    texto:
      'Em "Opções" → "Exportar planilha" você cria um relatório para abrir no Excel ou enviar pelo WhatsApp.',
  },
  {
    icone: '💾',
    titulo: '5. Cópia de segurança (importante!)',
    texto:
      'Seus dados ficam guardados só neste celular. Em "Opções" → "Salvar cópia de segurança" você guarda um arquivo. Ao trocar de celular, use "Restaurar" para recuperar tudo.',
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {PASSOS.map((p) => (
              <View key={p.titulo} style={styles.passo}>
                <Text style={styles.passoIcone}>{p.icone}</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  passo: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  passoIcone: { fontSize: 26, marginRight: spacing.md, marginTop: 2 },
  passoTextos: { flex: 1 },
  passoTitulo: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
  passoTexto: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  botao: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  botaoTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
