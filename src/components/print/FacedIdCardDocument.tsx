import BrandEmblem from "@/components/brand/BrandEmblem";
import type { FacedIdCardData } from "@/lib/print/faced-id-print-types";
import QRCode from "react-qr-code";

function displayValue(value: string): string {
  return (value?.trim() || "—").toUpperCase();
}

function locationLine(card: FacedIdCardData): string {
  return displayValue(
    [card.barangay, card.city_mun, card.province].filter(Boolean).join(", ") || "—",
  );
}

function FacedIdCard({ card }: { card: FacedIdCardData }) {
  const qrValue = card.serial_code.trim() || card.uuid.trim();

  return (
    <article className="faced-id-card" aria-label={`FACED ID for ${card.full_name}`}>
      <div className="faced-id-card-header">
        <BrandEmblem size={28} className="faced-id-card-emblem" />
        <div className="faced-id-card-header-text">
          <p className="faced-id-card-kicker">Republic of the Philippines · DSWD</p>
          <p className="faced-id-card-title">FACED Beneficiary ID</p>
        </div>
      </div>
      <div className="faced-id-card-tricolor" aria-hidden />
      <div className="faced-id-card-body">
        <div className="faced-id-photo">PHOTO</div>
        <div className="faced-id-details">
          <p className="faced-id-name">{displayValue(card.full_name)}</p>
          <div className="faced-id-field">
            <span className="faced-id-label">Serial No.</span>
            <span className="faced-id-value faced-id-value--serial">{displayValue(card.serial_code)}</span>
          </div>
          <div className="faced-id-field">
            <span className="faced-id-label">Birthdate</span>
            <span className="faced-id-value">{displayValue(card.birthdate)}</span>
          </div>
          <div className="faced-id-field">
            <span className="faced-id-label">Age / Sex</span>
            <span className="faced-id-value">
              {displayValue([card.age, card.sex].filter(Boolean).join(" · ") || "—")}
            </span>
          </div>
          <div className="faced-id-field faced-id-field--address">
            <span className="faced-id-label">Address</span>
            <span className="faced-id-value">{locationLine(card)}</span>
          </div>
          {qrValue ? (
            <div className="faced-id-field faced-id-field--qr">
              <span className="faced-id-label" aria-hidden="true" />
              <div className="faced-id-qr" aria-label={`QR code for serial ${displayValue(card.serial_code)}`}>
                <QRCode
                  value={qrValue}
                  size={56}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#002878"
                  className="faced-id-qr-code"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <p className="faced-id-card-footer">
        Family Assistance Card in Emergencies and Disasters (FACED) · Not transferable
      </p>
    </article>
  );
}

type FacedIdCardDocumentProps = {
  cards: FacedIdCardData[];
};

export default function FacedIdCardDocument({ cards }: FacedIdCardDocumentProps) {
  return (
    <div className="faced-id-print-stage">
      {cards.map((card) => (
        <FacedIdCard key={`${card.uuid}-${card.serial_code}`} card={card} />
      ))}
    </div>
  );
}
