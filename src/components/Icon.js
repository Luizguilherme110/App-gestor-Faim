import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../theme/theme';

// Única porta de entrada para ícones do app.
//
// Importa direto de `@expo/vector-icons/Feather` (e não do índice do pacote)
// para que só a fonte Feather entre no bundle, em vez de todas as famílias.
//
// Regra: uma família só. Se faltar um glifo, procure o nome equivalente em
// Feather antes de considerar outra família — misturar traço grosso com traço
// fino na mesma tela é o que faz a interface parecer montada de peças soltas.
export default function Icon({ name, size = 20, color, style }) {
  const { colors } = useTheme();
  return <Feather name={name} size={size} color={color ?? colors.text} style={style} />;
}
