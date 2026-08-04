# PasteScribe worker

Fundação da Onda 4, fatia 4.2c. Este pacote executa mídia fora da Vercel e nasce com:

- FastAPI apenas para health/readiness;
- runner FFmpeg/ffprobe isolado e testável;
- limites de CPU, memória, tamanho de arquivo, duração e timeout;
- cancelamento de subprocesso por process group;
- diretório temporário por operação e cleanup obrigatório;
- provider de transcrição fake determinístico;
- fixture curta de inserção de legenda usada somente em teste arquitetural.

Ainda não há polling do Supabase, download do R2 ou persistência de transcript. Esses adapters entram na próxima subfatia 4.2c-b; a CLI atual aceita um arquivo local para validar o pipeline base.

```bash
uv sync --extra dev
uv run pytest
uv run pastescribe-worker ./sample.mp4
uv run uvicorn pastescribe_worker.app:app --port 8001
```
