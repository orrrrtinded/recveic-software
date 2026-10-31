# RecVeic — software administrativo

Aplicativo desktop para administração das contas e permissões do RecVeic, sistema de gestão para recuperadoras de veículos. Permite cadastrar usuários, consultar contas, alterar cargos e desativar ou reativar perfis.

## Tecnologias

- Electron e Node.js para a aplicação de computador.
- HTML, CSS e JavaScript para as telas e validações.
- Firebase Authentication para autenticação e criação de credenciais.
- Cloud Firestore para perfis, cargos, permissões e estado das contas.

O software usa o mesmo projeto Firebase das outras interfaces. A desativação altera o perfil do usuário; a proteção dos dados depende das regras efetivamente publicadas no Firestore e do comportamento das versões instaladas dos demais aplicativos. A conta de autenticação não é apagada ao desativar o perfil.

## Executar

Com Node.js e npm instalados:

```bash
npm ci
npm start
```

O software precisa de internet para obter a configuração do Firebase e utilizar seus serviços. É necessária uma conta autorizada de administrador para gerenciar usuários.

## Criar instalador Windows

```bash
npm run dist
```

O instalador é gerado na pasta `dist/`, que não faz parte do repositório. O arquivo `ALTERACOES-v6.md` descreve a versão e as verificações feitas; `APRESENTACAO-MUST.md` contém material para o vídeo e o ensaio da equipe.

## Segurança e publicação

Não envie senhas, arquivos `.env`, chaves privadas ou arquivos de conta de serviço ao repositório. O arquivo `firestore.rules` documenta regras do banco; instalá-las ou publicá-las é uma operação separada, que deve ser avaliada antes de alterar o projeto Firebase.
