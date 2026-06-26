import Image from "next/image";
import QRCode from "react-qr-code";

type Props = {
  copyLabel?: string;
  variant?: "form" | "record";
  showOfficial?: boolean;
  showTitle?: boolean;
  serialCode?: string;
};

export default function FacedAnnexGovHeader({
  copyLabel,
  variant = "form",
  showOfficial = true,
  showTitle = true,
  serialCode,
}: Props) {
  const isRecord = variant === "record";
  const qrValue = serialCode?.trim() ?? "";

  return (
    <div className={`faced-gov-block ${isRecord ? "faced-gov-block--record" : ""}`}>
      <div className={`faced-gov-header ${isRecord ? "faced-gov-header--record" : ""}`}>
        <div className="faced-gov-header-brand">
          <div className="faced-gov-header-logos">
            <Image
              src="/print/dswd_logo.jpg"
              alt="DSWD"
              width={56}
              height={44}
              className="faced-gov-logo faced-gov-logo--dswd"
              unoptimized
            />
            <Image
              src="/print/bagong_pilipinas_logo.png"
              alt="Bagong Pilipinas"
              width={27}
              height={33}
              className="faced-gov-logo faced-gov-logo--bp"
              unoptimized
            />
          </div>
          {qrValue ? (
            <div className="faced-gov-header-qr" aria-label={`QR code for serial ${qrValue}`}>
              <QRCode
                value={qrValue}
                size={48}
                level="M"
                bgColor="#ffffff"
                fgColor="#002060"
                className="faced-gov-header-qr-code"
              />
            </div>
          ) : null}
        </div>
        <div className="faced-gov-header-text">
          <div className="faced-republic">Republic of the Philippines</div>
          <div className="faced-dept">Department of Social Welfare and Development</div>
          {showTitle && (
            <div className={`faced-title-block${isRecord ? " faced-title-block--record" : ""}`}>
              <div className="faced-title">FAMILY ASSISTANCE CARD IN</div>
              <div className="faced-title faced-title--sub">EMERGENCIES AND DISASTERS (FACED)</div>
            </div>
          )}
        </div>
        <div className="faced-gov-header-side">
          <div className="faced-not-for-sale">THIS CARD IS NOT FOR SALE</div>
          {copyLabel && <div className="faced-copy-label">{copyLabel}</div>}
          {showOfficial && (
            <div className="faced-official-box">
              <div className="faced-official-box-head">OFFICIAL USE ONLY</div>
              {serialCode !== undefined && (
                <div className="faced-official-box-body">
                  <span className="faced-serial-label">SERIAL NUMBER:</span>
                  <span className="faced-serial-value">{serialCode.trim() || "\u00A0"}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
