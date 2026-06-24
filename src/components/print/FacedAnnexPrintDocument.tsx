import type { FamilyHead, FamilyMember } from "@/lib/print/faced-print-types";
import {
  displayVal,
  formatBirth,
  formatAgeDisplay,
  formatSexDisplay,
  headOthersLine,
  headVulnerability,
  markChecked,
  matchDamage,
  matchHouseOwnership,
  memberDisplayName,
  memberRows,
  membersForHead,
  headExtraField,
} from "@/lib/print/facedAnnexPrint";
import FacedAnnexGovHeader from "./FacedAnnexGovHeader";

type CopyKind = "beneficiary" | "social-worker";

const COPY_LABEL: Record<CopyKind, string> = {
  beneficiary: "BENEFICIARY'S COPY",
  "social-worker": "SOCIAL WORKER'S COPY",
};

const HOUSE_OPTIONS = ["OWNER", "RENTER", "SHARER", "INFORMAL SETTLER", "NOT IDENTIFIED"] as const;
const DAMAGE_OPTIONS = ["PARTIALLY DAMAGED", "TOTALLY DAMAGED", "NOT IDENTIFIED"] as const;
const RECORD_ROWS = 8;

function FieldLine({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`faced-field ${wide ? "faced-field--wide" : ""}`}>
      <span className="faced-field-label">{label}</span>
      <span className="faced-field-value">{value}</span>
    </div>
  );
}

function SectionBar({ children }: { children: React.ReactNode }) {
  return <div className="faced-section-bar">{children}</div>;
}

function FacedAnnexCard({
  head,
  members,
  copy,
}: {
  head: FamilyHead;
  members: FamilyMember[];
  copy: CopyKind;
}) {
  const rows = memberRows(members, 5);
  const barangay = head.location_barangay?.trim() || head.barangay_origin?.trim();

  return (
    <div className={`faced-card faced-card--form faced-card--${copy}`}>
      <div className="faced-card-top">
        <FacedAnnexGovHeader
          copyLabel={COPY_LABEL[copy]}
          serialCode={displayVal(head.serial_code)}
        />

        <SectionBar>LOCATION OF THE AFFECTED FAMILY</SectionBar>
        <div className="faced-grid-2">
          <FieldLine label="1. REGION" value={displayVal(head.region)} />
          <FieldLine label="4. DISTRICT" value={displayVal(head.district)} />
          <FieldLine label="2. PROVINCE" value={displayVal(head.province)} />
          <FieldLine label="5. BARANGAY" value={displayVal(barangay)} />
          <FieldLine label="3. CITY/ MUNICIPALITY" value={displayVal(head.city_mun)} />
          <FieldLine label="6. EVACUATION CENTER/ SITE" value={displayVal(head.evacuation_center)} />
        </div>

        <SectionBar>HEAD OF THE FAMILY</SectionBar>
        <div className="faced-grid-2">
          <FieldLine label="7. LAST NAME" value={displayVal(head.last_name)} />
          <FieldLine label="15. CIVIL STATUS" value={displayVal(head.civil_status)} />
          <FieldLine label="8. FIRST NAME" value={displayVal(head.first_name)} />
          <FieldLine label="16. MOTHER'S MAIDEN NAME" value={displayVal(head.mothers_maiden_name)} />
          <FieldLine label="9. MIDDLE NAME" value={displayVal(head.middle_name)} />
          <FieldLine label="17. RELIGION" value={displayVal(head.religion)} />
          <FieldLine label="10. NAME EXT. (Jr., Sr., I)" value={displayVal(head.ext_name)} />
          <FieldLine label="18. OCCUPATION" value={displayVal(head.occupation)} />
          <FieldLine
            label="11. DATE OF BIRTH (MM-DD-YYYY)"
            value={displayVal(formatBirth(head.birth_mm, head.birth_dd, head.birth_yyyy))}
          />
          <FieldLine label="19. MONTHLY FAMILY NET INCOME" value={displayVal(head.monthly_income)} />
          <FieldLine label="12. AGE" value={displayVal(formatAgeDisplay(head.age_display))} />
          <FieldLine label="20. ID CARD PRESENTED" value={displayVal(head.id_card_type)} />
          <FieldLine label="13. PLACE OF BIRTH" value={displayVal(head.birthplace)} />
          <FieldLine label="21. ID CARD NUMBER" value={displayVal(head.id_card_number)} />
          <div className="faced-field">
            <span className="faced-field-label">14. SEX</span>
            <span className="faced-field-value faced-checks">
              {markChecked("MALE", head.sex === "M")} {markChecked("FEMALE", head.sex === "F")}
            </span>
          </div>
          <FieldLine label="22. CONTACT NUMBER" value={displayVal(head.contact_number)} />
        </div>

        <FieldLine label="23. PERMANENT ADDRESS" value={displayVal(head.permanent_address)} wide />
        <div className="faced-address-hint">
          House/Block/Lot No. &nbsp; Street &nbsp; Subd./Village &nbsp; Barangay &nbsp; City/Municipality &nbsp; Province &nbsp; Zip Code
        </div>

        <FieldLine label="24. TYPE OF VULNERABILITY" value={displayVal(headVulnerability(head))} wide />
        <div className="faced-field faced-field--wide faced-field--others">
          <span className="faced-field-label">OTHERS</span>
          <span className="faced-field-value faced-others-line">
            {head.four_ps_beneficiary === "Y" ? markChecked("4Ps Beneficiary", true) : "☐ 4Ps Beneficiary"}{" "}
            {head.indigenous_person === "Y"
              ? markChecked(
                  `IP (Type of Ethnicity: ${displayVal(head.ethnicity).replace(/\u00a0/g, "") || "_______"})`,
                  true,
                )
              : `☐ IP (Type of Ethnicity: ${displayVal(head.ethnicity).replace(/\u00a0/g, "") || "_______"})`}
            {!head.four_ps_beneficiary && !head.indigenous_person && headOthersLine(head).trim() !== "" && (
              <span>{displayVal(headOthersLine(head))}</span>
            )}
          </span>
        </div>
      </div>

      <div className="faced-card-fill">
        <SectionBar>FAMILY INFORMATION</SectionBar>
        <div className="faced-members-table-wrap">
          <table className="faced-members-table faced-members-table--fill">
            <thead>
              <tr>
                <th>FAMILY MEMBERS</th>
                <th>RELATION TO FAMILY HEAD</th>
                <th>DATE OF BIRTH</th>
                <th>AGE</th>
                <th>SEX</th>
                <th>HIGHEST EDUCATIONAL ATTAINMENT</th>
                <th>OCCUPATION</th>
                <th>TYPE OF VULNERABILITY</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m, i) => (
                <tr key={`${copy}-m-${i}`}>
                  <td className="faced-members-name">{displayVal(memberDisplayName(m))}</td>
                  <td>{displayVal(m.relation_to_head)}</td>
                  <td>{displayVal(formatBirth(m.birth_mm, m.birth_dd, m.birth_yyyy))}</td>
                  <td>{displayVal(formatAgeDisplay(m.age_display))}</td>
                  <td>{displayVal(formatSexDisplay(m.sex))}</td>
                  <td>{displayVal(m.education)}</td>
                  <td>{displayVal(m.occupation)}</td>
                  <td>{displayVal(m.vulnerability)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="faced-card-bottom">
        <SectionBar>ACCOUNT INFORMATION</SectionBar>
        <p className="faced-note">
          Note: In case the family head does not have a bank or an e-wallet account, any of the family members with a
          validated account can be indicated.
        </p>
        <div className="faced-grid-2">
          <FieldLine
            label="27. BANK/E-WALLET"
            value={displayVal(head.bank_ewallet || headExtraField(head, "bank_ewallet"))}
          />
          <FieldLine
            label="29. ACCOUNT TYPE"
            value={displayVal(head.account_type || headExtraField(head, "account_type"))}
          />
          <FieldLine
            label="28. ACCOUNT NAME"
            value={displayVal(head.account_name || headExtraField(head, "account_name"))}
          />
          <FieldLine
            label="30. ACCOUNT NUMBER"
            value={displayVal(head.account_number || headExtraField(head, "account_number"))}
          />
        </div>

        <div className="faced-ownership-section">
          <div className="faced-ownership-bar">
            <span>31. HOUSE OWNERSHIP</span>
            <span>32. SHELTER DAMAGE CLASSIFICATION</span>
          </div>
          <div className="faced-ownership-body">
            <div className="faced-ownership-body-col">
              <div className="faced-check-row">
                {HOUSE_OPTIONS.map((o) => markChecked(o, matchHouseOwnership(head.house_ownership, o))).join("  ")}
              </div>
            </div>
            <div className="faced-ownership-body-col">
              <div className="faced-check-row">
                {DAMAGE_OPTIONS.map((o) => markChecked(o, matchDamage(head.damage_classification, o))).join("  ")}
              </div>
            </div>
          </div>
        </div>

        <div className="faced-signatures">
          <div className="faced-thumb-box">Right Thumbmark</div>
          <div className="faced-sig-grid">
            <div className="faced-sig-line" />
            <div className="faced-sig-line" />
            <div className="faced-sig-caption">Signature/ Thumbmark of Family Head</div>
            <div className="faced-sig-caption">Name/ Signature of Administering Staff</div>
            <div className="faced-sig-line" />
            <div className="faced-sig-line" />
            <div className="faced-sig-caption">Date Registered</div>
            <div className="faced-sig-caption">Name/ Signature of Barangay Captain</div>
            <div className="faced-sig-spacer" />
            <div className="faced-sig-line" />
            <div className="faced-sig-spacer" />
            <div className="faced-sig-caption">Name/ Signature of LSWDO Head</div>
          </div>
        </div>

        <div className="faced-privacy">
          <SectionBar>33. DATA PRIVACY DECLARATION</SectionBar>
          <p>
            All data and information indicated herein shall be used for identification purposes for the implementation of
            disaster risk reduction and management (DRRM) programs, projects, and activities and its disclosure shall be
            in compliance to Republic Act 10173 (Data Privacy Act of 2012).
          </p>
        </div>
      </div>
    </div>
  );
}

function AssistanceRecordTable({ copy, serialCode }: { copy: CopyKind; serialCode: string }) {
  return (
    <div className={`faced-record-card faced-record-card--${copy}`}>
      <FacedAnnexGovHeader copyLabel={COPY_LABEL[copy]} variant="record" serialCode={displayVal(serialCode)} />
      <SectionBar>35. FAMILY ASSISTANCE RECORD</SectionBar>
      <div className="faced-record-table-wrap">
        <table className="faced-record-table faced-record-table--fill">
          <thead>
            <tr>
              <th rowSpan={2}>DATE</th>
              <th rowSpan={2}>NAME OF RECEIVING FAMILY MEMBER</th>
              <th colSpan={4}>ASSISTANCE PROVIDED</th>
              <th rowSpan={2}>SIGNATURE/ THUMBMARK</th>
            </tr>
            <tr>
              <th>EMERGENCY/ DISASTER ASSISTANCE</th>
              <th>UNIT</th>
              <th>QUANTITY</th>
              <th>COST</th>
            </tr>
            <tr className="faced-record-provider-row">
              <th />
              <th />
              <th colSpan={4} className="faced-record-provider-head">
                PROVIDER
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: RECORD_ROWS }, (_, i) => (
              <tr key={`${copy}-rec-${i}`}>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FacedFamilyAnnexPages({ head, members }: { head: FamilyHead; members: FamilyMember[] }) {
  return (
    <div className="faced-family-pack">
      <div className="faced-print-page faced-print-page--form">
        <FacedAnnexCard head={head} members={members} copy="beneficiary" />
        <FacedAnnexCard head={head} members={members} copy="social-worker" />
      </div>
      <div className="faced-print-page faced-print-page--record">
        <AssistanceRecordTable copy="beneficiary" serialCode={head.serial_code} />
        <AssistanceRecordTable copy="social-worker" serialCode={head.serial_code} />
      </div>
    </div>
  );
}

type Props = {
  heads: FamilyHead[];
  membersByHead: Map<string, FamilyMember[]>;
  standalone?: boolean;
};

export default function FacedAnnexPrintDocument({ heads, membersByHead, standalone = false }: Props) {
  if (!heads.length) return null;

  return (
    <div
      className={`faced-print-root${standalone ? " faced-print-root--standalone" : " print-only"}`}
      aria-hidden={standalone ? undefined : true}
    >
      {heads.map((head) => (
        <FacedFamilyAnnexPages
          key={head.serial_code}
          head={head}
          members={membersForHead(head, membersByHead)}
        />
      ))}
    </div>
  );
}
