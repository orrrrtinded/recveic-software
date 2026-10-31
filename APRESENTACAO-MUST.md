# RecVec: roteiro de demonstração e estudo

Entrega do software: versão 6.0.0, 30/10/2026.

Base: “Vitor Scheolin Varuzza - Plano de Ação e Entrega Final (1).pdf”, recebido nesta conversa. Os identificadores M1 a M5 abaixo foram criados para organizar este roteiro; não são códigos do documento original.

## 1. O que apresentar como MUST

| Item do plano | Entrega nesta revisão | Como demonstrar | O que falta comprovar |
| --- | --- | --- | --- |
| M1 — Domínio das tecnologias e da arquitetura | Explicação da arquitetura e do fluxo de acesso neste guia | Cada integrante explica sua parte usando o fluxo abaixo | A equipe precisa estudar e explicar sem ler |
| M2 — Preparação para perguntas | Perguntas técnicas e de negócio com respostas e simulação sugerida | Sortear perguntas entre integrantes | Realizar o ensaio e registrar quem respondeu |
| M3 — Validações de entrada e cadastro | Validações de nome, e-mail, senha e cargo no software; mensagens próximas ao erro; prevenção de conta repetida | Tentar cadastrar dados inválidos, corrigir e mostrar um cadastro de teste | O fluxo de interface foi testado com dados simulados; validar a conta de demonstração no ambiente real antes de gravar |
| M4 — Registrar questões e decisões da avaliação | Modelo de registro e decisões técnicas explicadas abaixo | Mostrar uma pergunta real, a decisão e a evidência correspondente | O plano traz temas gerais, mas não as perguntas literais da banca. A equipe deve acrescentar as questões reais; as perguntas deste guia são de preparação |
| M5 — Entregar os MUST nesta etapa | Código atualizado, verificações e roteiro demonstrável | Mostrar comportamento funcionando, em vez de prometer implementação futura | Não declarar todos os MUST concluídos enquanto estudo, ensaio e registro de perguntas estiverem pendentes |

**Não confundir as prioridades:** revisão visual é **Could** no plano. Segurança e privacidade são **Should**. Elas complementam esta entrega; não substituem as validações nem a preparação da equipe.

## 2. Roteiro de vídeo de aproximadamente 5 minutos

### 0:00–0:30 — Contexto e objetivo

Mostrar o login do software.

Fala sugerida: “O RecVec conecta a operação da oficina no site e no aplicativo. Este software é a área administrativa responsável pelas contas e pelos acessos da equipe. Nesta etapa, priorizamos as validações e a preparação técnica definidas como MUST no nosso plano.”

### 0:30–1:40 — Validações funcionando: MUST M3

Entrar como administrador usando uma conta própria de demonstração. Não exibir senhas reais durante a gravação.

1. Clicar em criar com os campos vazios: mostrar os avisos e o foco no primeiro erro.
2. Informar apenas espaços no nome, um e-mail como `teste` e uma senha curta: mostrar que o cadastro não prossegue.
3. Corrigir o nome e o e-mail. Explicar os limites de 100 caracteres para nome e 254 para e-mail.
4. Informar um e-mail já cadastrado: mostrar o aviso de duplicação. A verificação do Firebase Authentication também impede a criação de duas credenciais com o mesmo e-mail.
5. Escolher “Usuário” e “Administrador”: mostrar a explicação dos canais, antes de salvar.
6. Se for demonstrar a criação real, usar um endereço de teste que a equipe controla. Após criar, mostrar a nova conta na lista.

Fala sugerida: “As verificações acontecem antes do envio. O formulário aponta o campo incorreto e preserva os dados já preenchidos. Isso atende ao MUST que pede impedir entradas vazias, inválidas ou incompatíveis. A autenticação ainda faz suas próprias verificações no serviço.”

O critério de senha permanece com mínimo de 6 caracteres, compatível com o cadastro existente. Isso é uma regra de entrada, não uma afirmação de que uma senha de 6 caracteres é forte.

### 1:40–2:40 — Como as partes conversam: MUST M1

Mostrar a lista e explicar este caminho:

```text
Software Electron
  → interface em HTML + CSS + JavaScript
  → Firebase Authentication verifica a credencial
  → Firestore fornece o perfil associado ao UID
  → perfil ativo e cargo de administrador permitem abrir a gestão
  → alterações em usuarios são acompanhadas pelos outros clientes
```

Fala sugerida: “O Electron transforma a interface em um aplicativo de computador. HTML estrutura os elementos, CSS define a apresentação e JavaScript executa as ações. O Authentication cuida do login. O Firestore guarda nome, cargo, permissões e estado da conta. O UID é a ligação entre a credencial e esse perfil.”

### 2:40–3:35 — Controle de acesso: melhoria SHOULD

Usar uma conta de teste que não seja o próprio administrador.

1. Buscar a conta por nome ou e-mail.
2. Abrir a confirmação de desativação e explicar que a conta permanece cadastrada.
3. Confirmar e mostrar o filtro “Desativados”.
4. Se o site e o app estiverem preparados, demonstrar a perda de acesso da conta de teste nesses clientes.
5. Reativar a conta de teste ao terminar.

Fala sugerida: “Desativar altera o perfil de acesso. A credencial não é apagada do Authentication. O bloqueio dos dados depende das regras publicadas no Firestore, e as interfaces atualizadas acompanham o perfil para encerrar o acesso. No software, a lista agora considera ativo somente quem possui `ativo: true`.”

**Limite da evidência:** os testes desta revisão simularam o Firebase e comprovaram os fluxos locais. Não afirmem que foi realizado um novo teste integrado de bloqueio nas três plataformas em produção. Façam essa conferência com a conta de demonstração antes do vídeo.

### 3:35–4:10 — Interface: melhoria COULD

Mostrar o painel em uma janela normal e menor.

Fala sugerida: “A revisão visual organiza a tarefa do administrador: cadastrar à esquerda e encontrar e gerenciar contas à direita. Reduzimos a variação de tamanho dos textos, tornamos os canais legíveis e colocamos o erro junto do campo. As animações são discretas e respeitam a preferência de redução de movimento.”

Relacionar decisões concretas à rotina da oficina. Não apresentar uma mudança de cor como cumprimento do MUST de validação.

### 4:10–5:00 — Preparação da equipe: MUST M2, M4 e M5

Cada integrante responde a uma pergunta sem ler a resposta. Mostrar uma questão real da avaliação registrada na tabela ao final deste guia.

Fala sugerida: “Além das alterações no código, organizamos a arquitetura, as perguntas e as decisões. Nosso critério de conclusão inclui cada integrante conseguir explicar sua parte e responder às perguntas. As validações já podem ser demonstradas; o estudo e o ensaio são responsabilidade da equipe.”

## 3. O que cada tecnologia faz neste software

| Parte | Tecnologia e arquivo | Responsabilidade |
| --- | --- | --- |
| Aplicativo instalado | Electron; `main.js` | Abre a janela e entrega a interface por um servidor HTTP local ligado apenas ao computador |
| Processo principal | Node.js; `main.js` | Lê os arquivos da interface e obtém a configuração pública do Firebase usada pelo projeto |
| Estrutura da tela | HTML; `renderer/index.html` | Formulários, lista, filtros e diálogos |
| Apresentação | CSS; `style.css` e `refinement.css` | Hierarquia visual, espaços, cores, foco de teclado e animações |
| Comportamento | JavaScript; `renderer/app.js` | Login, cadastro, busca, mudança de cargo e ativação |
| Validações locais | JavaScript; `renderer/validation.js` | Verifica formatos e campos antes do envio; não usa IA |
| Credenciais | Firebase Authentication | Cria a credencial e autentica e-mail/senha; a senha não é gravada pelo formulário no Firestore |
| Perfis e operação | Cloud Firestore | A coleção `usuarios` guarda os perfis. Outras coleções do ERP guardam clientes, veículos, orçamentos, ordens e pagamentos |
| Autorização dos dados | Regras do Firestore | São avaliadas pelo servidor nas operações; precisam estar publicadas no projeto correto |
| Atualização da interface | `onSnapshot` | Escuta alterações do próprio perfil e da lista, sem exigir atualização manual da janela |
| Instalador | electron-builder / NSIS | Empacota o software para instalação no Windows |

O processo visual não recebe acesso direto ao Node.js: `nodeIntegration: false`, isolamento de contexto e sandbox já estavam configurados. Nesta revisão também foi restringida a abertura de novas janelas e a navegação para fora da origem local.

O software precisa de internet para carregar serviços do Firebase e gerenciar contas. O endereço HTTP local serve a interface; não substitui o banco na nuvem.

## 4. Perguntas para ensaio, com respostas

Estas perguntas são propostas de preparação. Não foram transcritas da banca.

**Por que existem Authentication e Firestore?** O primeiro identifica quem está entrando; o segundo armazena os dados do perfil e da operação. Eles se relacionam pelo UID. Ter credencial não significa possuir autorização administrativa.

**Por que validar antes de enviar?** Para dar uma resposta imediata e evitar dados incoerentes. A validação da tela melhora a experiência; não substitui as regras do servidor, pois um cliente pode ser modificado.

**O que acontece quando um usuário é desativado?** O perfil passa a `ativo: false`. A conta e o histórico são preservados. As regras publicadas verificam o perfil para bloquear os dados, e as interfaces atualizadas encerram o acesso ao observar a mudança.

**Uma pessoa que já estava conectada continua trabalhando?** O software observa o perfil em tempo real e fecha a área administrativa quando perde a autorização. O bloqueio efetivo das operações no banco depende das regras publicadas. Esse cenário deve ser ensaiado com uma conta de teste nas três plataformas.

**E se o perfil tiver sido apagado, mas a credencial existir?** O software informa que falta o perfil e não promove automaticamente essa conta a administradora. Um responsável pelo Firebase deve verificar e restaurar o perfil autorizado. Não apagar a autenticação de alguém sem verificar os vínculos e a necessidade.

**O sistema utiliza IA para essas validações?** Não. Nome, e-mail, senha e cargo são verificados por regras determinísticas em JavaScript. As funções de IA de outras partes do projeto devem ser explicadas separadamente.

**Como evitar e-mails duplicados?** A lista oferece uma verificação prévia, desconsiderando maiúsculas e espaços nas pontas. O Firebase Authentication é a verificação definitiva na criação da credencial, inclusive quando duas pessoas tentam cadastrar o mesmo e-mail.

**O que ocorre se a credencial for criada e o perfil falhar?** O software tenta excluir a credencial recém-criada para desfazer o cadastro incompleto. Se essa compensação também falhar, exibe uma mensagem específica para o responsável verificar o perfil. São duas operações em serviços diferentes, não uma transação única.

**Por que não adicionar CPF e CEP ao software administrativo?** O software gerencia membros da equipe, não o endereço dos clientes. CPF, CEP, placa e ano pertencem aos formulários correspondentes do mobile. As mesmas preocupações com validação foram aplicadas conforme os campos de cada produto.

**O que mudou na interface e por quê?** Foi estabelecida uma escala de títulos e textos, reduzida a decoração de fundo e explicitada a relação entre cargo e canais. O objetivo é reduzir dúvidas no cadastro e na gestão de acessos, não acrescentar frases de efeito.

**Qual é o problema e quem é o público?** O projeto atende a organização da operação de uma oficina/recuperadora: relacionar clientes, veículos, orçamentos, serviços e pagamentos. O software permite ao responsável administrar quem pode participar dessa operação. Essa formulação é uma proposta de apresentação; a equipe deve confirmar o público e os benefícios com sua experiência real.

**Como isso poderia ser comercializado?** A equipe pode avaliar licença ou assinatura com implantação e suporte. Não há, nesta revisão, pesquisa de preço ou validação comercial; não apresentem valores, clientes ou economia de tempo como fatos sem evidência.

**Está totalmente seguro?** Não se deve prometer segurança absoluta. A revisão verificou comportamentos locais específicos. As regras publicadas, a configuração do Firebase e os demais clientes exigem testes integrados e revisão própria.

## 5. Registro das perguntas reais — preencher com a equipe

| Pergunta recebida na avaliação | Resposta ou decisão da equipe | Evidência no sistema/documento | Responsável | Situação |
| --- | --- | --- | --- | --- |
| Preencher com a pergunta real, sem inventar | Registrar a decisão e o motivo | Indicar tela, teste ou explicação | Nome do integrante | Pendente / revisado |

## 6. Ensaio e checklist antes de gravar

- [ ] Cada integrante explica a ligação entre sua interface, Authentication, UID e Firestore.
- [ ] Cada integrante responde a pelo menos três perguntas sem apoio de outro colega.
- [ ] As questões reais da avaliação foram registradas com resposta ou decisão.
- [ ] O software aberto é a versão 6.0.0; o instalador antigo não foi usado por engano.
- [ ] Existe uma conta de teste controlada pela equipe, separada do administrador.
- [ ] Foram conferidos cadastro, alteração de cargo, desativação e reativação no ambiente de demonstração.
- [ ] O comportamento entre software, site e aplicativo foi conferido com as regras efetivamente publicadas.
- [ ] Senhas, dados pessoais reais e chaves privadas não aparecem na gravação.
- [ ] O vídeo distingue MUST, SHOULD e COULD conforme o plano.
- [ ] A equipe consegue apontar o que ainda não foi comprovado, sem apresentar planejamento como resultado.

Sugestão de ensaio: 5 minutos de apresentação, 5 minutos de perguntas cruzadas e 5 minutos para corrigir as respostas. Registrar data, participantes e as dúvidas que permaneceram.
