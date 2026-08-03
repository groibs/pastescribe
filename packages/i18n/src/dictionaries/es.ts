import type { Dictionary } from "./en";

export const es: Dictionary = {
  meta: {
    title: "PasteScribe — Pega cualquier video. Recibe el texto listo para usar.",
    description:
      "Convierte enlaces de videos públicos y tus propios archivos de audio o video en transcripciones limpias, subtítulos, resúmenes y más. En desarrollo activo.",
  },
  nav: {
    features: "Funciones",
    pricing: "Precios",
    api: "API",
    resources: "Recursos",
    signIn: "Iniciar sesión",
    getStarted: "Empezar gratis",
    comingSoon: "Próximamente",
    languageLabel: "Idioma",
  },
  home: {
    heroTagline: "Pega cualquier video. Recibe el texto listo para usar.",
    heroLead:
      "La forma más rápida y precisa de transcribir, resumir y extraer información de enlaces de video. IA de nivel profesional, sin fricción.",
    transcribeLabel: "Pega el link de un video",
    transcribePlaceholder: "Pega un link de YouTube, TikTok, Vimeo o Loom aquí…",
    transcribeButton: "Transcribir",
    transcribeDisabledHint:
      "Todavía no acepta links — primero viene la base de costos y seguridad.",
    platformsLabel: "Plataformas compatibles",
    platforms: {
      youtube: "YouTube",
      tiktok: "TikTok",
      instagram: "Instagram",
      facebook: "Facebook",
      x: "X",
      vimeo: "Vimeo",
      loom: "Loom",
      upload: "Subir archivo",
    },
    demoHeading: "Claridad instantánea.",
    demoLead: "Mira cómo un video en bruto se convierte en datos estructurados.",
    demoUrl: "youtube.com/watch?v=…",
    demoTabs: {
      transcript: "Transcripción",
      summary: "Resumen",
      actionItems: "Acciones",
    },
    demoLines: [
      {
        time: "00:00",
        speaker: "Orador 1",
        text: "Bienvenidos a la revisión de arquitectura de hoy. Vamos a cubrir la nueva estrategia de despliegue y su impacto en la latencia de los nodos principales.",
      },
      {
        time: "00:15",
        speaker: "Orador 2",
        text: "Revisé la propuesta. La orquestación se ve sólida, pero tengo algunas dudas sobre los tiempos de arranque en frío de las funciones edge.",
      },
      {
        time: "00:28",
        speaker: "Orador 1",
        text: "Buen punto. Implementamos una estrategia de precalentamiento que debería mitigar esos picos.",
      },
    ],
    featuresHeading: "Más que transcripción.",
    featuresLead:
      "Convierte audio en bruto en contenido listo para publicar, compartir o analizar.",
    features: [
      {
        title: "Resúmenes ejecutivos",
        description:
          "Genera al instante resúmenes generales, puntos clave y listas a partir de reuniones o podcasts de horas de duración.",
      },
      {
        title: "Capítulos inteligentes",
        description:
          "Segmenta automáticamente el video con marcas de tiempo clicables según los cambios de tema.",
      },
      {
        title: "Exportación sin esfuerzo",
        description: "Exporta a Notion, Google Docs, PDF o JSON en bruto para tu flujo de desarrollo.",
      },
      {
        title: "Artículos de blog",
        description:
          "Convierte un video con presentador en un artículo de blog formateado y listo para SEO, con títulos y párrafos.",
      },
    ],
  },
  pricing: {
    heading: "Precios simples y transparentes",
    lead: "Elige el plan para tu necesidad de transcripción. Mejora, reduce o cancela cuando quieras.",
    draftNotice:
      "Precios en borrador — solo ilustrativos. Los valores finales dependen de datos reales de uso y aún no están aprobados.",
    billingMonthly: "Mensual",
    billingYearly: "Anual",
    billingSave: "Ahorra 20%",
    plans: [
      {
        name: "Gratis",
        priceMonthly: "US$0",
        priceYearly: "US$0",
        period: "/mes",
        description: "Para uso ocasional",
        features: ["15 min/mes", "Transcripción básica", "Exportación en TXT"],
        cta: "Plan actual",
      },
      {
        name: "Creator",
        priceMonthly: "US$19",
        priceYearly: "US$15",
        period: "/mes",
        description: "Para creadores de contenido",
        features: ["300 min/mes", "Resúmenes con IA", "Todos los formatos de exportación", "Identificación de hablantes"],
        cta: "Empezar",
        badge: "Más popular",
      },
      {
        name: "Pro",
        priceMonthly: "US$49",
        priceYearly: "US$39",
        period: "/mes",
        description: "Para profesionales y equipos",
        features: ["1200 min/mes", "Traducción", "Acceso a la API", "Procesamiento prioritario"],
        cta: "Empezar",
      },
    ],
    creditsHeading: "¿Necesitas más minutos de vez en cuando?",
    creditsBody: "Compra un paquete de créditos: 100 minutos por US$10. Sin fecha de vencimiento.",
    creditsCta: "Comprar créditos",
    faqHeading: "Preguntas frecuentes",
    faq: [
      {
        question: "¿Puedo cancelar mi suscripción cuando quiera?",
        answer:
          "Sí. Cancela desde la configuración de tu cuenta cuando quieras — conservas el acceso hasta el final del período pagado y nunca se te vuelve a cobrar después.",
      },
      {
        question: "¿Qué pasa si se me acaban los minutos?",
        answer:
          "Verás tu saldo restante antes de que se agote. Puedes terminar el video en curso, comprar un paquete de créditos o mejorar tu plan — nada se cobra automáticamente sin tu acción.",
      },
      {
        question: "¿Mis datos están seguros?",
        answer:
          "Tu contenido se procesa y elimina en una ventana corta de retención; las transcripciones permanecen privadas hasta que decidas compartirlas. Consulta nuestras páginas de seguridad y privacidad para más detalles.",
      },
    ],
    payAsYouGoNotice: "Sin suscripción obligatoria en el modelo por uso",
  },
  footer: {
    brand: "PasteScribe",
    copyright: "© {year} PasteScribe. Todos los derechos reservados.",
    tools: "Herramientas",
    platforms: "Plataformas",
    privacy: "Política de Privacidad",
    terms: "Términos de Servicio",
    apiDocs: "Documentación de la API",
    honesty:
      "Funciona con videos públicos de fuentes compatibles o archivos que tú subas. Sin contenido privado, sin eludir DRM.",
  },
};
