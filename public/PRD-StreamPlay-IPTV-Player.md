# PRD - StreamPlay IPTV Player

## 📋 Documento de Requisitos do Produto

**Versão:** 1.0  
**Data:** Dezembro 2025  
**Plataforma de Desenvolvimento:** Lovable.dev  
**Inspiração:** IPTV Smarters Pro

---

## 1. Visão Geral do Produto

### 1.1 Descrição
O **StreamPlay** é um leitor de IPTV web responsivo que permite aos usuários assistir TV ao vivo, séries e filmes através de listas M3U. O aplicativo oferece uma experiência de usuário moderna e intuitiva, inspirada nos padrões de UX do IPTV Smarters Pro, com foco em simplicidade de navegação e qualidade de streaming.

### 1.2 Objetivo
Criar uma aplicação web IPTV completa e funcional que:
- Carregue e parse listas M3U de URLs externas
- Organize conteúdo automaticamente em categorias (TV Aberta, Séries, Filmes)
- Ofereça player de vídeo de alta qualidade com suporte HLS
- Inclua controle parental com senha
- Apresente interface escura, moderna e intuitiva

### 1.3 Público-Alvo
- Usuários domésticos que possuem assinaturas IPTV legítimas
- Famílias que desejam controle parental sobre o conteúdo
- Usuários que preferem interface web a apps nativos

---

## 2. Arquitetura e Stack Técnica

### 2.1 Stack Recomendada (Lovable.dev)
```
Frontend:
- React 18+ com TypeScript
- Tailwind CSS para estilização
- Lucide React para ícones
- HLS.js para streaming de vídeo
- React Router para navegação

State Management:
- React Context API para estado global
- localStorage para persistência de configurações

Bibliotecas Auxiliares:
- iptv-playlist-parser ou parser M3U customizado
```

### 2.2 Estrutura de Arquivos
```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   ├── home/
│   │   ├── CategoryCard.tsx
│   │   └── HomeScreen.tsx
│   ├── content/
│   │   ├── ContentGrid.tsx
│   │   ├── ContentCard.tsx
│   │   ├── SearchBar.tsx
│   │   ├── CategoryFilter.tsx
│   │   └── ContentDetail.tsx
│   ├── player/
│   │   ├── VideoPlayer.tsx
│   │   ├── PlayerControls.tsx
│   │   └── PlayerOverlay.tsx
│   ├── settings/
│   │   ├── SettingsModal.tsx
│   │   ├── PlaylistConfig.tsx
│   │   ├── ParentalControl.tsx
│   │   └── EPGConfig.tsx
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       ├── Modal.tsx
│       └── PinInput.tsx
├── contexts/
│   ├── PlaylistContext.tsx
│   ├── SettingsContext.tsx
│   └── ParentalContext.tsx
├── hooks/
│   ├── useM3UParser.ts
│   ├── useVideoPlayer.ts
│   ├── useSearch.ts
│   └── useLocalStorage.ts
├── services/
│   ├── m3uParser.ts
│   ├── epgParser.ts
│   └── categoryClassifier.ts
├── types/
│   ├── playlist.ts
│   ├── channel.ts
│   └── settings.ts
├── utils/
│   ├── formatters.ts
│   └── validators.ts
└── App.tsx
```

---

## 3. Funcionalidades Detalhadas

### 3.1 Tela Inicial (Home)

#### Design e Layout
```
┌─────────────────────────────────────────────────────────┐
│  🎬 StreamPlay                              ⚙️ Settings │
├─────────────────────────────────────────────────────────┤
│                                                         │
│     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│     │             │  │             │  │             │  │
│     │   📺 TV     │  │   🎬 SÉRIES │  │   🎥 FILMES │  │
│     │   ABERTA    │  │             │  │             │  │
│     │             │  │             │  │             │  │
│     │  X canais   │  │  X títulos  │  │  X títulos  │  │
│     └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📌 Continuar Assistindo                               │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                      │
│  │     │ │     │ │     │ │     │                      │
│  └─────┘ └─────┘ └─────┘ └─────┘                      │
│                                                         │
│  ⭐ Favoritos                                          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                      │
│  │     │ │     │ │     │ │     │                      │
│  └─────┘ └─────┘ └─────┘ └─────┘                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Especificações
- **Cards de Categoria Principal:** 3 cards grandes e clicáveis
  - TV Aberta: Ícone de TV, contador de canais disponíveis
  - Séries: Ícone de claquete, contador de séries
  - Filmes: Ícone de filme, contador de filmes
- **Seção "Continuar Assistindo":** Últimos 10 itens acessados (localStorage)
- **Seção "Favoritos":** Itens marcados com estrela pelo usuário
- **Header:** Logo à esquerda, ícone de configurações à direita

---

### 3.2 Tela de Listagem de Conteúdo (TV/Séries/Filmes)

#### Design e Layout
```
┌─────────────────────────────────────────────────────────┐
│  ← Voltar    TV ABERTA                      ⚙️ Settings │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔍 Buscar canais...                             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Categorias: [Todos] [Esportes] [Notícias] [Filmes]... │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  │   │
│  │  │ 📺  │  │ 📺  │  │ 📺  │  │ 📺  │  │ 📺  │  │   │
│  │  │Logo │  │Logo │  │Logo │  │Logo │  │Logo │  │   │
│  │  │     │  │     │  │     │  │     │  │     │  │   │
│  │  │Name │  │Name │  │Name │  │Name │  │Name │  │   │
│  │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  │   │
│  │                                                 │   │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  │   │
│  │  │ 📺  │  │ 📺  │  │ 📺  │  │ 📺  │  │ 📺  │  │   │
│  │  │Logo │  │Logo │  │Logo │  │Logo │  │Logo │  │   │
│  │  │     │  │     │  │     │  │     │  │     │  │   │
│  │  │Name │  │Name │  │Name │  │Name │  │Name │  │   │
│  │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Especificações
- **Barra de Busca:** Busca em tempo real enquanto digita (debounce 300ms)
  - Busca por nome do canal/série/filme
  - Highlight do texto encontrado nos resultados
- **Filtro de Categorias:** Pills horizontais com scroll
  - Extraídas automaticamente do `group-title` do M3U
  - "Todos" sempre como primeira opção
- **Grid de Conteúdo:** Layout responsivo
  - Desktop: 5-6 cards por linha
  - Tablet: 3-4 cards por linha
  - Mobile: 2 cards por linha
- **Card de Conteúdo:**
  - Imagem/Logo (tvg-logo do M3U ou placeholder)
  - Nome do canal/título
  - Categoria (badge pequeno)
  - Ícone de favorito (estrela)
  - Hover: scale up + shadow + overlay com botão "Assistir"

---

### 3.3 Tela de Detalhe (Séries)

#### Design e Layout
```
┌─────────────────────────────────────────────────────────┐
│  ← Voltar    BREAKING BAD                   ⚙️ Settings │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────┐  BREAKING BAD                       │
│  │               │  ⭐⭐⭐⭐⭐ | Drama | 2008-2013      │
│  │   [Poster]    │                                      │
│  │               │  Um professor de química com câncer  │
│  │               │  terminal se junta a um ex-aluno...  │
│  └───────────────┘                                      │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Temporadas: [T1] [T2] [T3] [T4] [T5]                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ S01E01 - Pilot                        ▶️ 58min  │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ S01E02 - Cat's in the Bag...          ▶️ 48min  │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ S01E03 - ...And the Bag's in the River ▶️ 48min │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ S01E04 - Cancer Man                   ▶️ 48min  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Especificações
- **Header da Série:** Poster, título, rating, gênero, anos
- **Seletor de Temporadas:** Tabs ou dropdown
- **Lista de Episódios:** Nome, duração, botão play
- **Progresso:** Barra de progresso se o usuário já assistiu parte

---

### 3.4 Player de Vídeo

#### Design e Layout
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│                    [VIDEO STREAM]                       │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Nome do Canal/Título                                   │
│  ━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━  45:23 / 1:32:45 │
│  ◀◀  ▶️/⏸️  ▶▶  🔊━━━━━  ⚙️  📺  ⬜  ❌                │
└─────────────────────────────────────────────────────────┘
```

#### Especificações
- **Player HLS:** Usando hls.js para compatibilidade
- **Controles:**
  - Play/Pause
  - Seek (para VOD/séries/filmes)
  - Volume
  - Qualidade (se disponível)
  - Picture-in-Picture
  - Fullscreen
  - Fechar/Voltar
- **Overlay:** Mostra/esconde com movimento do mouse
- **Auto-hide:** Controles somem após 3s de inatividade
- **Teclas de Atalho:**
  - Espaço: Play/Pause
  - F: Fullscreen
  - M: Mute
  - Setas: Seek ±10s (VOD)
  - Esc: Sair fullscreen/fechar player

---

### 3.5 Tela de Configurações

#### Design e Layout
```
┌─────────────────────────────────────────────────────────┐
│                    ⚙️ CONFIGURAÇÕES                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📋 PLAYLIST                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ URL da Lista M3U:                               │   │
│  │ http://example.com/playlist.m3u                 │   │
│  │                                    [Atualizar]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📅 EPG (Guia de Programação) - Opcional               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ URL do EPG:                                     │   │
│  │ http://example.com/epg.xml                      │   │
│  │                                    [Atualizar]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🔒 CONTROLE PARENTAL                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Controle Parental: [🔘 Ativado] [ Desativado]   │   │
│  │                                                 │   │
│  │ Alterar Senha:                                  │   │
│  │ Senha Atual:    [••••••]                        │   │
│  │ Nova Senha:     [••••••]                        │   │
│  │ Confirmar:      [••••••]                        │   │
│  │                                     [Salvar]    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📊 INFORMAÇÕES                                        │
│  Canais carregados: 1,234                              │
│  Séries: 156                                           │
│  Filmes: 2,345                                         │
│  Última atualização: 20/12/2025 14:30                  │
│                                                         │
│                                         [Fechar]       │
└─────────────────────────────────────────────────────────┘
```

#### Especificações
- **Configuração de Playlist:**
  - Campo de texto para URL M3U
  - Validação de URL
  - Botão "Atualizar" com loading state
  - Feedback de sucesso/erro
- **Configuração de EPG (Opcional):**
  - Campo de texto para URL do EPG XML
  - Carregamento e parse do EPG
- **Controle Parental:**
  - Toggle on/off
  - Campos de alteração de senha (PIN de 4-6 dígitos)
  - Senha padrão inicial: 0000
  - Validação de senha atual antes de permitir alteração
- **Informações:**
  - Estatísticas da playlist carregada
  - Data/hora da última atualização

---

## 4. Parser M3U - Especificações Técnicas

### 4.1 Estrutura do Parser

```typescript
// types/playlist.ts
interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group?: string;
  tvgId?: string;
  tvgName?: string;
  type: 'live' | 'movie' | 'series';
  // Para séries
  seriesInfo?: {
    seriesName: string;
    season: number;
    episode: number;
    episodeTitle?: string;
  };
}

interface ParsedPlaylist {
  channels: Channel[];
  liveTV: Channel[];
  movies: Channel[];
  series: SeriesGroup[];
  categories: string[];
  totalCount: number;
}

interface SeriesGroup {
  name: string;
  poster?: string;
  seasons: {
    number: number;
    episodes: Channel[];
  }[];
}
```

### 4.2 Lógica de Classificação

```typescript
// services/categoryClassifier.ts
function classifyContent(channel: Channel): 'live' | 'movie' | 'series' {
  const name = channel.name.toLowerCase();
  const group = (channel.group || '').toLowerCase();
  
  // Palavras-chave para séries
  const seriesKeywords = ['series', 'série', 'temporada', 'season', 'episode', 'episodio', 's0', 'e0'];
  const seriesPattern = /s\d{1,2}e\d{1,2}|temporada\s*\d|season\s*\d|episod/i;
  
  // Palavras-chave para filmes
  const movieKeywords = ['filmes', 'movies', 'filme', 'movie', 'vod', 'cinema'];
  const moviePattern = /\(\d{4}\)|\[\d{4}\]/; // Ano entre parênteses ou colchetes
  
  // Palavras-chave para TV ao vivo
  const liveKeywords = ['ao vivo', 'live', '24h', '24 horas', 'canal', 'tv aberta', 'aberto'];
  
  // Verificação
  if (seriesKeywords.some(k => name.includes(k) || group.includes(k)) || seriesPattern.test(name)) {
    return 'series';
  }
  
  if (movieKeywords.some(k => group.includes(k)) || moviePattern.test(name)) {
    return 'movie';
  }
  
  return 'live';
}
```

### 4.3 Extração de Metadados de Séries

```typescript
// services/seriesParser.ts
function parseSeriesInfo(name: string): SeriesInfo | null {
  // Padrões comuns: "Breaking Bad S01E02", "Serie Nome - Temporada 1 Episódio 5"
  const patterns = [
    /(.+?)\s*[sS](\d{1,2})[eE](\d{1,3})\s*(?:-\s*(.+))?$/,
    /(.+?)\s*(?:temporada|season)\s*(\d{1,2})\s*(?:episod[io]|ep\.?)\s*(\d{1,3})\s*(?:-\s*(.+))?$/i,
    /(.+?)\s*(\d{1,2})x(\d{1,3})\s*(?:-\s*(.+))?$/
  ];
  
  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return {
        seriesName: match[1].trim(),
        season: parseInt(match[2]),
        episode: parseInt(match[3]),
        episodeTitle: match[4]?.trim()
      };
    }
  }
  
  return null;
}
```

---

## 5. Design System

### 5.1 Paleta de Cores

```css
:root {
  /* Background */
  --bg-primary: #0f0f0f;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #242424;
  --bg-card: #1e1e1e;
  --bg-card-hover: #2a2a2a;
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --text-muted: #666666;
  
  /* Accent */
  --accent-primary: #e50914; /* Vermelho Netflix-like */
  --accent-secondary: #ff6b6b;
  --accent-gradient: linear-gradient(135deg, #e50914 0%, #b20710 100%);
  
  /* Status */
  --success: #46d369;
  --warning: #f5a623;
  --error: #e50914;
  
  /* Border */
  --border-color: #333333;
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  
  /* Shadow */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
}
```

### 5.2 Tipografia

```css
/* Fonte principal: Outfit (Google Fonts) - Moderna e legível */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

:root {
  --font-family: 'Outfit', sans-serif;
  
  --font-size-xs: 0.75rem;   /* 12px */
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-base: 1rem;    /* 16px */
  --font-size-lg: 1.125rem;  /* 18px */
  --font-size-xl: 1.25rem;   /* 20px */
  --font-size-2xl: 1.5rem;   /* 24px */
  --font-size-3xl: 2rem;     /* 32px */
  --font-size-4xl: 2.5rem;   /* 40px */
  
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### 5.3 Componentes Base

#### Card de Conteúdo
```css
.content-card {
  background: var(--bg-card);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.content-card:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-lg);
  background: var(--bg-card-hover);
}

.content-card__image {
  aspect-ratio: 16/9; /* Para TV */
  /* aspect-ratio: 2/3; Para Filmes/Séries (poster) */
  background: var(--bg-tertiary);
  object-fit: cover;
}

.content-card__title {
  padding: 12px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

#### Botão Primário
```css
.btn-primary {
  background: var(--accent-gradient);
  color: var(--text-primary);
  border: none;
  border-radius: var(--border-radius-sm);
  padding: 12px 24px;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(229, 9, 20, 0.4);
}
```

---

## 6. Fluxo de Primeiro Uso

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│           🎬 Bem-vindo ao StreamPlay!                   │
│                                                         │
│   Para começar, configure sua lista IPTV               │
│                                                         │
│   ┌─────────────────────────────────────────────────┐  │
│   │ URL da Lista M3U:                               │  │
│   │ [                                             ] │  │
│   └─────────────────────────────────────────────────┘  │
│                                                         │
│   ┌─────────────────────────────────────────────────┐  │
│   │ URL do EPG (opcional):                          │  │
│   │ [                                             ] │  │
│   └─────────────────────────────────────────────────┘  │
│                                                         │
│                    [Carregar Lista]                     │
│                                                         │
│   💡 Dica: Cole a URL M3U fornecida pelo seu          │
│      provedor de IPTV                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Estados e Feedbacks

### 7.1 Loading States
- **Carregando Playlist:** Spinner + "Carregando lista..." + Barra de progresso
- **Carregando Stream:** Spinner central no player
- **Buscando:** Skeleton cards no grid

### 7.2 Estados de Erro
- **URL Inválida:** "URL inválida. Verifique o endereço e tente novamente."
- **Falha ao Carregar:** "Não foi possível carregar a lista. Verifique sua conexão."
- **Stream Indisponível:** "Este conteúdo não está disponível no momento."
- **Erro de CORS:** "Não foi possível acessar o stream. O servidor pode não permitir acesso externo."

### 7.3 Estados Vazios
- **Sem Resultados de Busca:** "Nenhum resultado encontrado para '[termo]'"
- **Categoria Vazia:** "Nenhum conteúdo disponível nesta categoria"
- **Sem Favoritos:** "Você ainda não adicionou favoritos"

---

## 8. Controle Parental - Detalhamento

### 8.1 Funcionamento
1. **Ativação:** Toggle nas configurações (requer senha atual)
2. **Bloqueio:** Conteúdo adulto/bloqueado exibe overlay com cadeado
3. **Desbloqueio:** Usuário insere PIN para assistir
4. **Sessão:** PIN válido por 30 minutos ou até fechar o app

### 8.2 Detecção de Conteúdo Adulto
```typescript
const adultKeywords = [
  'adult', 'adulto', 'xxx', '18+', '+18', 
  'erotic', 'erótico', 'mature', 'maduro'
];

function isAdultContent(channel: Channel): boolean {
  const name = channel.name.toLowerCase();
  const group = (channel.group || '').toLowerCase();
  
  return adultKeywords.some(keyword => 
    name.includes(keyword) || group.includes(keyword)
  );
}
```

### 8.3 UI de PIN
```
┌─────────────────────────────────────┐
│                                     │
│       🔒 Conteúdo Bloqueado        │
│                                     │
│   Digite o PIN para continuar:     │
│                                     │
│      [ • ] [ • ] [ • ] [ • ]       │
│                                     │
│            [Desbloquear]            │
│                                     │
│   Esqueceu o PIN? Acesse as        │
│   configurações para redefinir     │
│                                     │
└─────────────────────────────────────┘
```

---

## 9. Responsividade

### 9.1 Breakpoints
```css
/* Mobile */
@media (max-width: 639px) {
  .content-grid { grid-template-columns: repeat(2, 1fr); }
  .category-cards { flex-direction: column; }
}

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px) {
  .content-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Desktop */
@media (min-width: 1024px) and (max-width: 1279px) {
  .content-grid { grid-template-columns: repeat(4, 1fr); }
}

/* Large Desktop */
@media (min-width: 1280px) {
  .content-grid { grid-template-columns: repeat(5, 1fr); }
}

/* TV/4K */
@media (min-width: 1920px) {
  .content-grid { grid-template-columns: repeat(6, 1fr); }
}
```

### 9.2 Player Responsivo
- Mobile: Player em tela cheia obrigatório
- Tablet: Player inline com opção fullscreen
- Desktop: Player inline ou popup com opção fullscreen

---

## 10. Persistência de Dados (localStorage)

```typescript
// Keys do localStorage
const STORAGE_KEYS = {
  PLAYLIST_URL: 'streamplay_playlist_url',
  EPG_URL: 'streamplay_epg_url',
  PARENTAL_PIN: 'streamplay_parental_pin',
  PARENTAL_ENABLED: 'streamplay_parental_enabled',
  FAVORITES: 'streamplay_favorites',
  WATCH_HISTORY: 'streamplay_watch_history',
  WATCH_PROGRESS: 'streamplay_watch_progress',
  LAST_UPDATED: 'streamplay_last_updated'
};

// Estrutura do histórico
interface WatchHistory {
  id: string;
  name: string;
  logo?: string;
  type: 'live' | 'movie' | 'series';
  timestamp: number;
  progress?: number; // Porcentagem assistida
}
```

---

## 11. Acessibilidade

### 11.1 Requisitos
- **Navegação por Teclado:** Tab, Enter, Escape, Setas
- **ARIA Labels:** Em todos os elementos interativos
- **Contraste:** Mínimo 4.5:1 para texto
- **Focus States:** Visíveis e consistentes
- **Screen Reader:** Suporte básico

### 11.2 Implementação
```tsx
// Exemplo de card acessível
<button
  role="button"
  aria-label={`Assistir ${channel.name}`}
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  className="content-card"
>
  <img 
    src={channel.logo} 
    alt={`Logo de ${channel.name}`}
    loading="lazy"
  />
  <span className="content-card__title">{channel.name}</span>
</button>
```

---

## 12. Performance

### 12.1 Otimizações
- **Lazy Loading:** Imagens e componentes
- **Virtualização:** Lista de canais com react-window
- **Debounce:** Busca em tempo real (300ms)
- **Memoização:** useMemo/useCallback para cálculos pesados
- **Code Splitting:** Lazy load de rotas

### 12.2 Métricas Alvo
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Largest Contentful Paint: < 2.5s

---

## 13. Considerações de Segurança

### 13.1 PIN Parental
- PIN armazenado com hash simples (não é crítico para segurança)
- Reset disponível apenas limpando localStorage

### 13.2 URLs Externas
- Validação básica de formato de URL
- Aviso sobre CORS para URLs que não funcionam
- Não executar JavaScript de fontes externas

### 13.3 Disclaimer Legal
```
AVISO: Este aplicativo é um player de mídia. 
Não fornecemos, hospedamos ou distribuímos conteúdo.
O usuário é responsável por utilizar apenas listas M3U 
de provedores legítimos e autorizados.
```

---

## 14. Roadmap de Desenvolvimento

### Fase 1: MVP (Sprint 1-2)
- [x] Setup do projeto
- [ ] Parser M3U básico
- [ ] Tela inicial com 3 categorias
- [ ] Grid de conteúdo básico
- [ ] Player de vídeo HLS
- [ ] Configurações de URL

### Fase 2: Core Features (Sprint 3-4)
- [ ] Busca e filtros
- [ ] Classificação automática de conteúdo
- [ ] Controle parental
- [ ] Favoritos
- [ ] Histórico de assistidos

### Fase 3: Polish (Sprint 5)
- [ ] Tela de detalhes de séries
- [ ] Suporte a EPG
- [ ] Melhorias de UX
- [ ] Testes e correções
- [ ] Responsividade completa

### Fase 4: Extras (Futuro)
- [ ] Picture-in-Picture
- [ ] PWA / Instalável
- [ ] Chromecast support
- [ ] Múltiplas listas M3U
- [ ] Temas customizáveis

---

## 15. Prompt para Lovable.dev

```
Crie um aplicativo IPTV web chamado "StreamPlay" com as seguintes características:

TECNOLOGIA:
- React com TypeScript
- Tailwind CSS
- Lucide React para ícones
- HLS.js para streaming de vídeo

FUNCIONALIDADES PRINCIPAIS:

1. TELA INICIAL:
- 3 cards grandes clicáveis: "TV Aberta", "Séries", "Filmes"
- Cada card com ícone, nome e contador de itens
- Seção "Continuar Assistindo" com últimos itens acessados
- Seção "Favoritos" 
- Header com logo "StreamPlay" e botão de configurações (ícone engrenagem)

2. CONFIGURAÇÕES (Modal):
- Campo para URL da lista M3U (http://...)
- Campo opcional para URL do EPG
- Controle Parental:
  - Toggle ativar/desativar
  - Campos para alterar PIN (4 dígitos, padrão: 0000)
- Estatísticas: quantidade de canais, séries, filmes carregados
- Persistir tudo em localStorage

3. LISTAGEM DE CONTEÚDO:
- Barra de busca no topo com busca em tempo real
- Filtros por categoria (pills horizontais extraídas do group-title do M3U)
- Grid responsivo de cards com:
  - Imagem/logo (tvg-logo do M3U)
  - Nome do canal/título
  - Ícone de favorito (estrela)
  - Hover: scale up + shadow
- Para SÉRIES: ao clicar, mostrar tela de detalhes com temporadas e episódios

4. PLAYER DE VÍDEO:
- Player HLS fullscreen ou inline
- Controles: play/pause, volume, seek (para VOD), fullscreen, fechar
- Auto-hide dos controles após 3 segundos
- Overlay com título do conteúdo

5. PARSER M3U:
- Carregar M3U de URL externa
- Extrair: name, url, logo (tvg-logo), group (group-title)
- Classificar automaticamente em:
  - Live TV: canais sem padrão de série/filme
  - Séries: contém SxxExx, "temporada", "season", "episod"
  - Filmes: grupo contém "filme", "movie" ou nome tem ano (2024)
- Agrupar séries por nome e temporada

DESIGN:
- Tema escuro (fundo #0f0f0f)
- Cores de destaque: vermelho (#e50914)
- Fonte: Outfit (Google Fonts)
- Cards com border-radius, hover effects, transições suaves
- Layout inspirado no Netflix/IPTV Smarters Pro
- Totalmente responsivo (mobile, tablet, desktop)

CONTROLE PARENTAL:
- Detectar conteúdo adulto por keywords (adult, xxx, 18+, etc)
- Mostrar overlay com cadeado em conteúdo bloqueado
- Solicitar PIN para desbloquear
- PIN válido por 30 minutos

Por favor, crie a aplicação completa com todas essas funcionalidades, código limpo e bem organizado.
```

---

## 16. Exemplos de Código Chave

### 16.1 Parser M3U
```typescript
// services/m3uParser.ts
export interface M3UEntry {
  duration: number;
  name: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  groupTitle?: string;
}

export function parseM3U(content: string): M3UEntry[] {
  const lines = content.split('\n');
  const entries: M3UEntry[] = [];
  let currentEntry: Partial<M3UEntry> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      // Parse EXTINF line
      const durationMatch = line.match(/#EXTINF:(-?\d+)/);
      currentEntry.duration = durationMatch ? parseInt(durationMatch[1]) : -1;

      // Parse attributes
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);

      if (tvgIdMatch) currentEntry.tvgId = tvgIdMatch[1];
      if (tvgNameMatch) currentEntry.tvgName = tvgNameMatch[1];
      if (tvgLogoMatch) currentEntry.tvgLogo = tvgLogoMatch[1];
      if (groupMatch) currentEntry.groupTitle = groupMatch[1];

      // Get channel name (after last comma)
      const nameMatch = line.match(/,(.+)$/);
      if (nameMatch) currentEntry.name = nameMatch[1].trim();

    } else if (line && !line.startsWith('#') && currentEntry.name) {
      // This is the URL line
      currentEntry.url = line;
      entries.push(currentEntry as M3UEntry);
      currentEntry = {};
    }
  }

  return entries;
}
```

### 16.2 Hook de Player
```typescript
// hooks/useVideoPlayer.ts
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export function useVideoPlayer(url: string) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    if (Hls.isSupported() && url.includes('.m3u8')) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(url);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Erro ao carregar o stream');
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = url;
      video.play().catch(() => {});
    } else {
      // Non-HLS URL
      video.src = url;
      video.play().catch(() => {});
    }
  }, [url]);

  // Time update handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setProgress(video.currentTime);
      setDuration(video.duration || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const play = () => videoRef.current?.play();
  const pause = () => videoRef.current?.pause();
  const seek = (time: number) => {
    if (videoRef.current) videoRef.current.currentTime = time;
  };
  const toggleFullscreen = () => videoRef.current?.requestFullscreen();

  return {
    videoRef,
    isPlaying,
    progress,
    duration,
    error,
    play,
    pause,
    seek,
    toggleFullscreen,
  };
}
```

---

**Fim do PRD**

*Este documento serve como guia completo para desenvolvimento do StreamPlay IPTV Player no Lovable.dev. Ajuste conforme necessário durante o desenvolvimento.*
