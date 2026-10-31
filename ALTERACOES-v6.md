# RecVec Controle 6.0.0

## Alterações implementadas

- Nome obrigatório entre 2 e 100 caracteres, com pelo menos uma letra; nome composto não é exigido.
- E-mail obrigatório, formato válido, limite de 254 caracteres e normalização para cadastro.
- Senha de cadastro entre 6 e 128 caracteres; somente espaços não são aceitos. A regra de 6 caracteres foi mantida para compatibilidade, sem classificá-la como senha forte.
- Cargo limitado às opções existentes; canais explicados antes da criação.
- Erros próximos aos campos, foco no primeiro erro, limite de caracteres, mostrar/ocultar senha e prevenção de e-mail repetido.
- Ativo significa exatamente `ativo: true`, também na lista e nos filtros.
- Acesso administrativo verifica cargo, estado ativo e permissão de software quando explicitamente negada.
- Perder autorização fecha os diálogos e limpa a lista local; perfil ausente não é recriado automaticamente como administrador pelo aplicativo.
- Cadastro preserva os dados usados na operação e diferencia a falha de compensação de uma conta incompleta.
- Aviso de indisponibilidade da conexão e falha de carregamento do Firebase.
- Tipografia mais consistente, canais nomeados em português, resultado da busca contado, contraste e foco de teclado, animações discretas com redução de movimento.
- Servidor local limitado aos arquivos necessários e janela impedida de abrir novas janelas ou navegar para outra origem.

## Testes

Foram executados testes de validação e de interface em navegador, com Firebase simulado e dados fictícios: cadastro inválido, duplicação, criação, filtros, desativação, reativação, revogação de autorização, fechamento dos diálogos e layout em 1420 e 1020 pixels de largura. Nenhum usuário real foi alterado nesses testes.

As imagens da revisão estão na pasta `outputs/RecVec-Desktop-MUST-evidencias` do trabalho no Codex. Os testes simulados não comprovam a configuração de produção. As regras do Firestore não foram alteradas nem publicadas nesta entrega.

## Abrir o código atualizado

No PowerShell:

```powershell
Set-Location "C:\Users\zumzu\Desktop\recuperadora-desktop"
npm start
```

## Gerar o instalador

```powershell
npm run dist -- --config.directories.output=dist-v6
```

Usar o instalador `dist-v6/RecVec Controle Setup 6.0.0.exe`. A pasta `dist` contém a versão anterior e foi preservada.

O projeto utiliza Firebase para contas e dados; não é necessário executar `firebase deploy` para instalar uma nova versão do software Windows. A configuração e a publicação de regras do banco são uma operação separada.

## Material de apresentação

`APRESENTACAO-MUST.md` contém a relação exata de prioridades do plano, roteiro do vídeo, arquitetura, perguntas e respostas, e checklist do ensaio. Os MUST de domínio técnico, ensaio e registro das perguntas dependem da participação da equipe e não ficam automaticamente cumpridos por uma mudança de código.
