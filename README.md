# ⚔️ PORTAL OFICIAL DO CLÃ ALCATRAZZ

> **"ALCATRAZZ — HONRA, LEALDADE E PODER."**  
> Desenvolvido por [**Luiz Jaques**](https://www.instagram.com/luiz_jaques23?srtk=MW5pamVsYXJveG05aA%3D%3D&utm_source=qr)

Portal completo, moderno, responsivo e funcional para gerenciamento do clã **ALCATRAZZ**, inspirado na estética medieval sombria de **Priston Tale**. Salva dados automaticamente no servidor sem necessidade de banco de dados tradicional, com confirmação por senha de segurança (`232356`).

---

## 🎨 Identidade Visual & Design

- **Paleta Oficial**:
  - Preto Profundo: `#090909`
  - Vermelho Sangue: `#790D16`
  - Dourado Metálico: `#D6A33A`
  - Laranja / Fogo: `#D66A19`
  - Cinza Pedra: `#292929`
- **Brasão Oficial**: `/public/assets/alcatrazz-crest.jpg`
- **Cenário Medieval**: `/public/assets/hero-castle.jpg`
- **Tipografia**: `Cinzel` (títulos medievais) e `Inter` (leitura de interface)

---

## 🛡️ Módulos Implementados

1. **Página Inicial Cinematográfica**:
   - Brasão oficial, slogan, boas-vindas, história institucional do clã em Priston Tale, estatísticas em tempo real, destaque para o Líder (`LordZephira`), próximos eventos e últimos comunicados.
2. **Sistema de Membros**:
   - Cards ornamentados com nickname, classe (Cavaleiro, Pike, Atalanta, Sacerdotisa, Mago, Mecânico, Lutador, Arqueira, Assassina, Xamã, Guerreira), tribo (Tempskron/Morion), level, cargo, data de entrada, foto, status e observações administrativas.
   - Pesquisa instantânea por nickname e filtros combinados por classe, cargo, level mínimo e status.
   - Operações CRUD completas (Cadastrar, Consultar ficha, Editar e Excluir com confirmação).
3. **Hierarquia do Clã**:
   - Cargos configuráveis (`Líder`, `Vice-líder`, `General`, `Oficial`, `Veterano`, `Membro`, `Recruta`) com cores hexadecimais e insígnias exclusivas.
   - Promoção e rebaixamento direto de integrantes + criação/customização de patentes e permissões.
4. **Mural de Avisos**:
   - Categorias (`Avisos gerais`, `Regras do clã`, `Recrutamento`, `Eventos`, `Guerras`, `Comunicados administrativos`), prioridades, imagem opcional e fixação no topo.
5. **Calendário de Eventos e SoD (Siege of the Darkness)**:
   - Categoria especial para **SoD (Siege of the Darkness)** em Bellatra/Navisko e **Bless Castle**.
   - Visão Mensal interativa, Visão Semanal e consulta de Eventos Anteriores.
   - Confirmação de presença em tempo real pelos membros do clã.
6. **Ranking dos Jogadores**:
   - Ordenação dinâmica por **Pontuação**, **Level**, **Participação em eventos** e **Contribuição ao clã**.
   - Pódio Imperial com **Medalhas de Ouro (1º), Prata (2º) e Bronze (3º)** + tabela geral e ajuste administrativo de pontos.
7. **Painel Administrativo & Segurança Real no Servidor**:
   - Autenticação criptográfica no servidor (`/api/auth`) com hash `scrypt`, cookies `HttpOnly` assinados com `HMAC-SHA256` e integração nativa com Supabase Auth/PostgreSQL (`supabase/migrations/20261117000001_alcatrazz_complete_schema.sql`).
   - Controle de permissões RBAC validado no backend em todas as rotas de escrita (`/api/portal`).
   - Persistência dupla automática: opera imediatamente salvando dados no servidor local (`data/alcatrazz-db.json` + backup em `localStorage`) sem exigir banco externo configurado, e conecta-se automaticamente ao Supabase quando `.env.local` está preenchido.
   - Dados demonstrativos identificados com a tag `[EXEMPLO]`.

---

## 🚀 Como Executar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.
