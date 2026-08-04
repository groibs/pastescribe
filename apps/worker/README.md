# PasteScribe worker

Worker de mídia da Onda 4, executado fora da Vercel.

## Entregue

- FastAPI apenas para health/readiness;
- runner FFmpeg/ffprobe isolado e testável;
- limites de CPU, memória, tamanho, duração e timeout;
- cancelamento de subprocesso por process group;
- diretório temporário por operação e cleanup obrigatório;
- provider fake determinístico;
- adapter PostgREST/RPC para `claim_next_job`, heartbeat, asset, reserva, avanço, conclusão e falha;
- aquisição local e S3-compatible/R2 por streaming com teto de bytes;
- cálculo configurável de custo estimado e reserva, separado de preço comercial;
- fixture curta de inserção de legenda usada somente em teste arquitetural.

## Ainda bloqueado

O adapter não é iniciado automaticamente. O loop real só será ligado na 4.2c-c, junto com:

- schema/persistência idempotente de transcript;
- cancelamento financeiro seguro;
- heartbeat concorrente;
- `complete_job` somente depois do resultado persistido;
- integração local completa contra Postgres/Storage fake.

```bash
uv sync --extra dev
uv run pytest
uv run pastescribe-worker ./sample.mp4
uv run uvicorn pastescribe_worker.app:app --port 8001
```
