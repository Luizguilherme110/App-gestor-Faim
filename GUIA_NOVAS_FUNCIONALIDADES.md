# 📱 App Faim - Guia das Novas Funcionalidades

## ✅ O que foi implementado

### 1️⃣ **Persistência Completa de Dados**
- Todos os dados (obras e transações) são salvos automaticamente no dispositivo
- Cada vez que você cria uma obra, adiciona uma transação ou edita algo, é salvo imediatamente
- Os dados permanecem mesmo se você fechar e reabrir o app

### 2️⃣ **Exportar Planilha Excel (Novo!)**
Agora você pode exportar todos os dados em uma planilha Excel profissional!

**Como usar:**
1. Vá para a tela inicial
2. Procure pelo botão **"📊 Exportar"** (ao lado de "+ Nova Obra")
3. Clique nele
4. Espere alguns segundos enquanto a planilha é gerada
5. Uma opção de compartilhar aparecerá - você pode:
   - Salvar no Google Drive, OneDrive, Dropbox
   - Enviar por email
   - Salvar localmente no dispositivo

**O que a planilha contém:**
- **Uma aba para cada obra** com todas as transações
- Data, tipo (GASTO/RECEITA), valor, observações, duração de áudio
- **Resumo em cada aba** com totais de gastos, receitas e saldo
- **Aba especial "Resumo Geral"** com totais de todas as obras e quantidade de transações

### 3️⃣ **Deletar Obra com Segurança (Melhorado!)**
Agora é mais fácil e seguro deletar uma obra quando terminar um projeto

**Como usar:**
1. Na tela inicial, **toque por 2 segundos** na obra que quer deletar
2. Escolha **"Excluir obra"**
3. Você terá 2 opções (escolha uma):
   - **"Deletar (mantendo transações)"** - Remove a obra mas guarda todos os lançamentos
   - **"Deletar tudo"** ⚠️ - Remove a obra E todos os seus lançamentos

**Exemplo de uso:**
- Se você terminou um projeto e quer limpar a lista, escolha "Deletar tudo"
- Se só quer reorganizar sem perder dados, escolha "Deletar (mantendo transações)"

---

## 📊 Fluxo Completo de Uso

```
1. Criar Obra
   ↓
2. Adicionar Transações (Gastos/Receitas)
   ↓
3. Visualizar Totais no Dashboard
   ↓
4. Quando precisar:
   a) Exportar Planilha → "📊 Exportar"
   b) Deletar Obra → Toque longo + escolha opção
```

---

## 💾 Dados Salvos Automaticamente
- ✅ Nomes das obras
- ✅ Todas as transações (valor, tipo, categoria, observações)
- ✅ Áudios das notas de voz (se houver)
- ✅ Datas de criação
- ✅ Histórico de edições

---

## 🔧 Tecnologia

As novas funcionalidades usam:
- **AsyncStorage** - Persistência local segura
- **XLSX** - Geração de arquivos Excel
- **Expo FileSystem & Sharing** - Gerenciamento e compartilhamento de arquivos

---

## ⚠️ Avisos Importantes

1. **Backup Regular**: Recomenda-se exportar a planilha regularmente como backup
2. **Deletar é Permanente**: Quando você escolhe "Deletar tudo", não há como recuperar
3. **Limite de Dados**: O AsyncStorage tem limite de armazenamento (geralmente 10MB), suficiente para milhares de transações

---

## 📞 Dúvidas?

Se algo não funcionar:
1. Feche e reabra o app
2. Verifique se há espaço disponível no dispositivo
3. Tente exportar novamente

Bom uso! 🚀
