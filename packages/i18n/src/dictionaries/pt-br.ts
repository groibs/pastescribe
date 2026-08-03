import type { Dictionary } from "./en";

export const ptBr: Dictionary = {
  meta: {
    title: "PasteScribe — Cole qualquer vídeo. Receba o texto pronto para usar.",
    description:
      "Transforme links de vídeos públicos e arquivos seus de áudio ou vídeo em transcrições limpas, legendas, resumos e mais. Em desenvolvimento ativo.",
  },
  nav: {
    features: "Recursos",
    pricing: "Preços",
    api: "API",
    resources: "Conteúdo",
    signIn: "Entrar",
    getStarted: "Começar grátis",
    comingSoon: "Em breve",
    languageLabel: "Idioma",
  },
  home: {
    heroTagline: "Cole qualquer vídeo. Receba o texto pronto para usar.",
    heroLead:
      "A forma mais rápida e precisa de transcrever, resumir e extrair informações de links de vídeo. IA de nível profissional, sem fricção.",
    transcribeLabel: "Cole o link de um vídeo",
    transcribePlaceholder: "Cole um link do YouTube, TikTok, Vimeo ou Loom aqui…",
    transcribeButton: "Transcrever",
    transcribeDisabledHint:
      "Ainda não aceita links — a fundação de custo e segurança vem primeiro.",
    platformsLabel: "Plataformas suportadas",
    platforms: {
      youtube: "YouTube",
      tiktok: "TikTok",
      instagram: "Instagram",
      facebook: "Facebook",
      x: "X",
      vimeo: "Vimeo",
      loom: "Loom",
      upload: "Upload",
    },
    demoHeading: "Clareza instantânea.",
    demoLead: "Veja como um vídeo bruto vira dado estruturado.",
    demoUrl: "youtube.com/watch?v=…",
    demoTabs: {
      transcript: "Transcrição",
      summary: "Resumo",
      actionItems: "Ações",
    },
    demoLines: [
      {
        time: "00:00",
        speaker: "Falante 1",
        text: "Bem-vindos à revisão de arquitetura de hoje. Vamos cobrir a nova estratégia de deploy e o impacto na latência dos nós principais.",
      },
      {
        time: "00:15",
        speaker: "Falante 2",
        text: "Revisei a proposta. A orquestração parece sólida, mas tenho algumas preocupações com o tempo de cold start das funções de borda.",
      },
      {
        time: "00:28",
        speaker: "Falante 1",
        text: "Faz sentido. Implementamos uma estratégia de pré-aquecimento que deve mitigar esses picos.",
      },
    ],
    featuresHeading: "Mais que transcrição.",
    featuresLead:
      "Transforme áudio bruto em conteúdo pronto para publicar, compartilhar ou analisar.",
    features: [
      {
        title: "Resumos executivos",
        description:
          "Gere na hora visões gerais, pontos principais e listas a partir de reuniões ou podcasts de horas de duração.",
      },
      {
        title: "Capítulos inteligentes",
        description:
          "Segmente automaticamente o vídeo com timestamps clicáveis com base na mudança de assunto.",
      },
      {
        title: "Exportação sem esforço",
        description: "Exporte para Notion, Google Docs, PDF ou JSON bruto para seu fluxo de desenvolvimento.",
      },
      {
        title: "Artigos de blog",
        description:
          "Transforme um vídeo com apresentador em um post de blog formatado e pronto para SEO, com títulos e parágrafos.",
      },
    ],
  },
  pricing: {
    heading: "Preço simples e transparente",
    lead: "Escolha o plano para sua necessidade de transcrição. Faça upgrade, downgrade ou cancele quando quiser.",
    draftNotice:
      "Preços em rascunho — apenas ilustrativos. Os valores finais dependem de dados reais de uso e ainda não foram aprovados.",
    billingMonthly: "Mensal",
    billingYearly: "Anual",
    billingSave: "Economize 20%",
    plans: [
      {
        name: "Grátis",
        priceMonthly: "R$0",
        priceYearly: "R$0",
        period: "/mês",
        description: "Para uso ocasional",
        features: ["15 min/mês", "Transcrição básica", "Exportação em TXT"],
        cta: "Plano atual",
      },
      {
        name: "Creator",
        priceMonthly: "R$19",
        priceYearly: "R$15",
        period: "/mês",
        description: "Para criadores de conteúdo",
        features: ["300 min/mês", "Resumos com IA", "Todos os formatos de exportação", "Identificação de falantes"],
        cta: "Começar",
        badge: "Mais popular",
      },
      {
        name: "Pro",
        priceMonthly: "R$49",
        priceYearly: "R$39",
        period: "/mês",
        description: "Para profissionais e equipes",
        features: ["1.200 min/mês", "Tradução", "Acesso à API", "Processamento prioritário"],
        cta: "Começar",
      },
    ],
    creditsHeading: "Precisa de mais minutos de vez em quando?",
    creditsBody: "Compre um pacote de créditos: 100 minutos por R$10. Sem data de expiração.",
    creditsCta: "Comprar créditos",
    faqHeading: "Perguntas frequentes",
    faq: [
      {
        question: "Posso cancelar minha assinatura quando quiser?",
        answer:
          "Sim. Cancele nas configurações da sua conta quando quiser — você mantém o acesso até o fim do período pago e nunca mais é cobrado depois disso.",
      },
      {
        question: "O que acontece se meus minutos acabarem?",
        answer:
          "Você vê o saldo restante antes de esgotar. Pode concluir o vídeo em andamento, comprar um pacote de créditos ou fazer upgrade do plano — nada é cobrado automaticamente sem sua ação.",
      },
      {
        question: "Meus dados estão seguros?",
        answer:
          "Sua mídia é processada e excluída numa janela curta de retenção; as transcrições permanecem privadas até você decidir compartilhá-las. Veja nossas páginas de segurança e privacidade para detalhes.",
      },
    ],
    payAsYouGoNotice: "Sem assinatura obrigatória no modelo avulso",
  },
  footer: {
    brand: "PasteScribe",
    copyright: "© {year} PasteScribe. Todos os direitos reservados.",
    tools: "Ferramentas",
    platforms: "Plataformas",
    privacy: "Política de Privacidade",
    terms: "Termos de Serviço",
    apiDocs: "Documentação da API",
    honesty:
      "Funciona com vídeos públicos de fontes compatíveis ou arquivos enviados por você. Sem conteúdo privado, sem contornar DRM.",
  },
};
