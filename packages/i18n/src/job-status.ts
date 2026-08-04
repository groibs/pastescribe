import type { Locale } from "./index";

export type ProcessingCopy = {
  pageTitle: string;
  pageLead: string;
  progressLabel: string;
  stages: {
    received: string;
    preparing: string;
    transcribing: string;
    finalizing: string;
    completed: string;
  };
  states: Record<string, string>;
  statusLabel: string;
  durationLabel: string;
  attemptsLabel: string;
  updatedLabel: string;
  transcriptHeading: string;
  transcriptEmpty: string;
  awaitingTitle: string;
  awaitingBody: string;
  failedTitle: string;
  failedBody: string;
  cancelledTitle: string;
  cancelledBody: string;
  expiredTitle: string;
  expiredBody: string;
  refreshError: string;
  cancelButton: string;
  cancellingButton: string;
  cancelError: string;
  cancelRequested: string;
  backToDashboard: string;
  recentJobsHeading: string;
  recentJobsEmpty: string;
  openJob: string;
};

const en: ProcessingCopy = {
  pageTitle: "Transcription status",
  pageLead: "This page follows the real processing state. It does not trigger transcription again.",
  progressLabel: "Transcription progress",
  stages: {
    received: "Received",
    preparing: "Preparing media",
    transcribing: "Transcribing",
    finalizing: "Finalizing",
    completed: "Completed",
  },
  states: {
    created: "Created",
    validating: "Validating",
    awaiting_user_confirmation: "Waiting for confirmation",
    queued: "Queued",
    resolving_metadata: "Reading metadata",
    fetching_captions: "Checking captions",
    acquiring_media: "Acquiring media",
    extracting_audio: "Extracting audio",
    normalizing_audio: "Normalizing audio",
    transcribing: "Transcribing",
    diarizing: "Identifying speakers",
    postprocessing: "Post-processing",
    indexing: "Indexing",
    completed: "Completed",
    failed: "Failed",
    cancel_requested: "Cancellation requested",
    cancelled: "Cancelled",
    expired: "Expired",
  },
  statusLabel: "Status",
  durationLabel: "Duration",
  attemptsLabel: "Attempts",
  updatedLabel: "Last update",
  transcriptHeading: "Transcript",
  transcriptEmpty: "The transcript will appear here after processing completes.",
  awaitingTitle: "Confirmation required",
  awaitingBody: "The media is longer than the current free allowance. No paid processing has started.",
  failedTitle: "Processing failed",
  failedBody: "The job stopped after its allowed retries. No transcript was marked complete.",
  cancelledTitle: "Processing cancelled",
  cancelledBody: "The worker stopped the job and released any applicable reservation.",
  expiredTitle: "Job expired",
  expiredBody: "This job was not processed before its validity window ended.",
  refreshError: "The latest status could not be loaded. The last known state is still shown.",
  cancelButton: "Cancel processing",
  cancellingButton: "Requesting cancellation…",
  cancelError: "Cancellation could not be requested.",
  cancelRequested: "Cancellation was requested. The worker will stop at a safe point.",
  backToDashboard: "Back to dashboard",
  recentJobsHeading: "Recent transcriptions",
  recentJobsEmpty: "No transcription job has been created yet.",
  openJob: "Open status",
};

const ptBr: ProcessingCopy = {
  pageTitle: "Status da transcrição",
  pageLead: "Esta página acompanha o estado real do processamento. Ela não dispara a transcrição novamente.",
  progressLabel: "Progresso da transcrição",
  stages: {
    received: "Recebido",
    preparing: "Preparando mídia",
    transcribing: "Transcrevendo",
    finalizing: "Finalizando",
    completed: "Concluído",
  },
  states: {
    created: "Criado",
    validating: "Validando",
    awaiting_user_confirmation: "Aguardando confirmação",
    queued: "Na fila",
    resolving_metadata: "Lendo metadados",
    fetching_captions: "Verificando legendas",
    acquiring_media: "Obtendo mídia",
    extracting_audio: "Extraindo áudio",
    normalizing_audio: "Normalizando áudio",
    transcribing: "Transcrevendo",
    diarizing: "Identificando falantes",
    postprocessing: "Pós-processando",
    indexing: "Indexando",
    completed: "Concluído",
    failed: "Falhou",
    cancel_requested: "Cancelamento solicitado",
    cancelled: "Cancelado",
    expired: "Expirado",
  },
  statusLabel: "Status",
  durationLabel: "Duração",
  attemptsLabel: "Tentativas",
  updatedLabel: "Última atualização",
  transcriptHeading: "Transcrição",
  transcriptEmpty: "A transcrição aparecerá aqui quando o processamento terminar.",
  awaitingTitle: "Confirmação necessária",
  awaitingBody: "A mídia excede a franquia gratuita atual. Nenhum processamento pago foi iniciado.",
  failedTitle: "O processamento falhou",
  failedBody: "O job parou após as tentativas permitidas. Nenhuma transcrição foi marcada como concluída.",
  cancelledTitle: "Processamento cancelado",
  cancelledBody: "O worker interrompeu o job e liberou a reserva aplicável.",
  expiredTitle: "Job expirado",
  expiredBody: "O job não foi processado dentro da janela de validade.",
  refreshError: "Não foi possível carregar o status mais recente. O último estado conhecido continua exibido.",
  cancelButton: "Cancelar processamento",
  cancellingButton: "Solicitando cancelamento…",
  cancelError: "Não foi possível solicitar o cancelamento.",
  cancelRequested: "O cancelamento foi solicitado. O worker vai parar em um ponto seguro.",
  backToDashboard: "Voltar ao painel",
  recentJobsHeading: "Transcrições recentes",
  recentJobsEmpty: "Nenhum job de transcrição foi criado ainda.",
  openJob: "Abrir status",
};

const es: ProcessingCopy = {
  pageTitle: "Estado de la transcripción",
  pageLead: "Esta página sigue el estado real del procesamiento. No vuelve a iniciar la transcripción.",
  progressLabel: "Progreso de la transcripción",
  stages: {
    received: "Recibido",
    preparing: "Preparando el medio",
    transcribing: "Transcribiendo",
    finalizing: "Finalizando",
    completed: "Completado",
  },
  states: {
    created: "Creado",
    validating: "Validando",
    awaiting_user_confirmation: "Esperando confirmación",
    queued: "En cola",
    resolving_metadata: "Leyendo metadatos",
    fetching_captions: "Verificando subtítulos",
    acquiring_media: "Obteniendo el medio",
    extracting_audio: "Extrayendo audio",
    normalizing_audio: "Normalizando audio",
    transcribing: "Transcribiendo",
    diarizing: "Identificando hablantes",
    postprocessing: "Posprocesando",
    indexing: "Indexando",
    completed: "Completado",
    failed: "Falló",
    cancel_requested: "Cancelación solicitada",
    cancelled: "Cancelado",
    expired: "Expirado",
  },
  statusLabel: "Estado",
  durationLabel: "Duración",
  attemptsLabel: "Intentos",
  updatedLabel: "Última actualización",
  transcriptHeading: "Transcripción",
  transcriptEmpty: "La transcripción aparecerá aquí cuando termine el procesamiento.",
  awaitingTitle: "Se requiere confirmación",
  awaitingBody: "El medio supera la franquicia gratuita actual. No se inició ningún procesamiento de pago.",
  failedTitle: "El procesamiento falló",
  failedBody: "El job se detuvo después de los reintentos permitidos. Ninguna transcripción se marcó como completa.",
  cancelledTitle: "Procesamiento cancelado",
  cancelledBody: "El worker detuvo el job y liberó la reserva aplicable.",
  expiredTitle: "Job expirado",
  expiredBody: "El job no se procesó dentro de su ventana de validez.",
  refreshError: "No fue posible cargar el estado más reciente. Se mantiene el último estado conocido.",
  cancelButton: "Cancelar procesamiento",
  cancellingButton: "Solicitando cancelación…",
  cancelError: "No fue posible solicitar la cancelación.",
  cancelRequested: "La cancelación fue solicitada. El worker se detendrá en un punto seguro.",
  backToDashboard: "Volver al panel",
  recentJobsHeading: "Transcripciones recientes",
  recentJobsEmpty: "Todavía no se creó ningún job de transcripción.",
  openJob: "Abrir estado",
};

const COPY: Record<Locale, ProcessingCopy> = { en, "pt-br": ptBr, es };

export function getProcessingCopy(locale: Locale): ProcessingCopy {
  return COPY[locale];
}
