[20/07/2026 - 16:34]

[x] Adicionada página personalizada de rota não encontrada.

[x] Verifiquei que o @media-manager não está renderizando corretamente, mas upload de imagens e criação de pastas estavam funcionando. O erro era por conta da alteração das colunas no banco de dados de "created_at" para "createdAt" e "file_size" para "fileSize".

[28/07/2026 - 17:32]

Alterei o new-article para receber os modos edit e create, dessa forma sendo possível reutilizar o componente. Ainda falta corrigir a visualização da capa no modo edição. No modo de edição, as imagens da galeria também não estão aparecendo.

O componente da parte pública de exibição dos artigos precisa ser corrigido.

[14/08/2026 - 17:27]

[x] O new-article foi atualizado, retirei o controle de galeria de dentro da tabela de artigos para utilizar o model correto de galerias. Foram necessárias alterações no schema, article.service e new-article.tsx. Apenas a parte visual foi implementada no new-article.tsx, falta criar um model para escolha de galeria na edição do artigo.

[21/08/2026 - 16:24]

[x] Criei o model para criação de menus, mas percebi que a forma de visualização deles está confusa. Vou precisar pensar em outra forma de gereciamento para os menus.

[24 a 27/08/2026]

[x] Adicionada função de gerenciamento de popUps na área administrativa. Foi necessário criar um model PopUp, um service PopUp e adicionar uma nova rota. A função de criação, edição, remoção e listagem está funcionando.

[09/09/2026]
[x] Criado gerenciador de destaques.

[11/09/2026]
[x] Corrigido conflito do new-page-modal com o dnd-kit.

[15/09/2026 - 16:00]
[x] Article-block atualizado com animações e rotas. Criados os componentes articles-list, article e article-body-visualizer para auxiliar na organização e visualização das notícias.

[06/11/2026]
Finalizado os cards do dashboard, ajustado para o editor de texto acessar o modal de seleção de imagens, corrigido alguns botões da toolbar do editor de texto, corrigido visualizador de artigos para suportar imagens vindas do banco de dados.
