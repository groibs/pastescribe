"use client";

import { useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload } from "lucide-react";

import { Alert } from "@pastescribe/ui";
import type { ProcessingCopy } from "@pastescribe/i18n";
import type { Locale } from "@pastescribe/i18n";

import { ALLOWED_MEDIA_MIME_TYPES, MAX_UPLOAD_SIZE_LABEL, validateSelectedFile } from "@/lib/uploads/limits";

type Phase = "idle" | "uploading" | "validating" | "error";

type UploadDropzoneProps = {
  locale: Locale;
  workspaceId: string;
  copy: ProcessingCopy["upload"];
};

function putWithProgress(url: string, file: File, onProgress: (ratio: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded / event.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("upload network error"));
    xhr.send(file);
  });
}

/**
 * Upload real (Onda 4.3b) — o input de link ao lado continua desabilitado
 * (source_kind=url é só estrutural, sem adapter ainda, docs/DECISIONS.md).
 * Fluxo: POST /api/uploads (presigned) -> PUT direto pro storage com
 * progresso -> POST /api/uploads/[id]/complete -> redireciona pra tela
 * de status do job criado. Validação client-side é só UX; o servidor
 * sempre revalida tamanho/MIME de verdade (skill
 * pastescribe-upload-url-security).
 */
export function UploadDropzone({ locale, workspaceId, copy }: UploadDropzoneProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  async function startUpload(file: File) {
    setError(null);

    const validationError = validateSelectedFile(file);
    if (validationError === "too_large") {
      setError(copy.errorTooLarge.replace("{size}", MAX_UPLOAD_SIZE_LABEL));
      return;
    }
    if (validationError === "unsupported_type") {
      setError(copy.errorUnsupportedType);
      return;
    }

    setPhase("uploading");
    setProgress(0);

    try {
      const createResponse = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          workspaceId,
          filename: file.name,
          declaredContentType: file.type,
          declaredSizeBytes: file.size,
        }),
      });
      if (!createResponse.ok) {
        throw new Error("create_failed");
      }
      const created: unknown = await createResponse.json();
      if (
        !created ||
        typeof created !== "object" ||
        !("mediaAssetId" in created) ||
        !("uploadUrl" in created)
      ) {
        throw new Error("invalid_create_response");
      }
      const { mediaAssetId, uploadUrl } = created as { mediaAssetId: string; uploadUrl: string };

      await putWithProgress(uploadUrl, file, setProgress);

      setPhase("validating");
      const completeResponse = await fetch(`/api/uploads/${mediaAssetId}/complete`, {
        method: "POST",
        credentials: "same-origin",
      });
      const completed: unknown = await completeResponse.json();

      if (!completeResponse.ok) {
        const code =
          completed && typeof completed === "object" && "error" in completed
            ? String((completed as { error: unknown }).error)
            : null;
        if (code === "size_exceeded") {
          setError(copy.errorTooLarge.replace("{size}", MAX_UPLOAD_SIZE_LABEL));
        } else if (code === "unsupported_type") {
          setError(copy.errorUnsupportedType);
        } else {
          setError(copy.errorGeneric);
        }
        setPhase("error");
        return;
      }

      const job =
        completed && typeof completed === "object" && "job" in completed
          ? (completed as { job: { id: string; state: string } | null }).job
          : null;
      const jobError =
        completed && typeof completed === "object" && "jobError" in completed
          ? (completed as { jobError: string | null }).jobError
          : null;

      if (job) {
        router.push(`/${locale}/app/jobs/${job.id}`);
        return;
      }

      setError(jobError === "quota_exceeded" ? copy.errorQuotaExceeded : copy.errorGeneric);
      setPhase("error");
    } catch {
      setError(copy.errorGeneric);
      setPhase("error");
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      void startUpload(file);
    }
  }

  const isBusy = phase === "uploading" || phase === "validating";

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file && !isBusy) {
      void startUpload(file);
    }
  }

  return (
    <div className="flex-1">
      <label
        htmlFor="upload-dropzone-input"
        onDragOver={(event) => {
          event.preventDefault();
          if (!isBusy) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex min-h-[160px] w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isBusy
            ? "cursor-wait border-outline-variant bg-surface-container-low"
            : "cursor-pointer border-outline-variant bg-surface-container-low hover:border-primary/50 hover:bg-surface-container focus-within:border-primary focus-within:ring-4 focus-within:ring-primary-container/20"
        } ${isDragOver ? "border-primary/50 bg-surface-container" : ""}`}
      >
        <input
          id="upload-dropzone-input"
          type="file"
          accept={[...ALLOWED_MEDIA_MIME_TYPES].join(",")}
          onChange={handleFileChange}
          disabled={isBusy}
          className="sr-only"
        />
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-surface-container-high text-primary"
        >
          <CloudUpload className="size-6" />
        </span>
        {isBusy ? (
          <div className="w-full max-w-xs">
            <p className="text-sm font-semibold text-on-surface">
              {phase === "uploading" ? copy.uploadingLabel : copy.validatingLabel}
            </p>
            <div
              role="progressbar"
              aria-valuenow={phase === "uploading" ? Math.round(progress * 100) : undefined}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-container-high"
            >
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${phase === "uploading" ? Math.round(progress * 100) : 100}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-on-surface">{copy.dropzoneTitle}</p>
            <p className="max-w-sm text-sm text-on-surface-variant">
              {copy.dropzoneHint.replace("{size}", MAX_UPLOAD_SIZE_LABEL)}
            </p>
          </>
        )}
      </label>

      {error ? (
        <Alert variant="error" title={error} className="mt-4" />
      ) : null}
    </div>
  );
}
