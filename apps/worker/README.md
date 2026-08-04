# PasteScribe worker

Worker de mídia da Onda 4, executado fora da Vercel.

## Entregue

- FastAPI apenas para health/readiness;
- runner FFmpeg/ffprobe isolado e testável;
- limites de CPU, memória, tamanho, duração e timeout;
- cancelamento de subprocesso por process group;
- diretório temporário por job e cleanup obrigatório;
- provider fake determinístico;
- adapter PostgREST/RPC para fila e resultados;
- aquisição local e S3-compatible/R2 por streaming com teto de bytes;
- cálculo configurável de custo estimado e reserva;
- heartbeat concorrente e cancelamento cooperativo;
- ciclo `claim → asset → download → ffprobe → reserve → fake → persist → complete`;
- persistência atômica de transcript, segmentos, custo e estado final;
- retry finito via `fail_job`;
- espera sem processamento pago quando o job vai para `awaiting_user_confirmation`.

## Ativação

O loop nasce desligado. Para ativá-lo, o ambiente precisa de:

- `WORKER_AUTOSTART=true`;
- URL e service role do Supabase;
- storage local ou S3 configurado;
- migrations `0001`–`0015` aplicadas;
- período de orçamento aberto para o envelope utilizado.

Sem isso, o serviço continua oferecendo somente `/health`, `/ready` e a CLI local.

```bash
uv sync --extra dev
uv run pytest
uv run pastescribe-worker ./sample.mp4
uv run uvicorn pastescribe_worker.app:app --port 8001
```

## Ainda não entregue

- OpenAI real;
- ingestão por URL;
- host de produção;
- sweeper de leases/temporários órfãos;
- UI de processamento e leitura RLS para usuários;
- renderização de vídeo com legendas inseridas.
