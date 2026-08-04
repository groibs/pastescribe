/**
 * Interface pluggable de antivírus — skill pastescribe-upload-url-security
 * §2: "antivírus pluggable pela interface (ativação opcional, nunca
 * removida)". Nenhum provider real está ativo (custo — THREAT_MODEL.md
 * "riscos aceitos nesta fase"); `noopAntivirusScanner` sempre aprova,
 * mas o seam real está no caminho de validação do upload — trocar por
 * um scanner de verdade não muda quem chama isto.
 */
export type ScanResult = {
  clean: boolean;
  reason?: string;
};

export interface AntivirusPort {
  scan(bytes: Uint8Array): Promise<ScanResult>;
}

export const noopAntivirusScanner: AntivirusPort = {
  async scan(): Promise<ScanResult> {
    return { clean: true };
  },
};
