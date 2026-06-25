export type CountTotals = {
  male_cum: number;
  male_now: number;
  female_cum: number;
  female_now: number;
  total_cum: number;
  total_now: number;
};

export type AgeRow = {
  label: string;
  range: string;
  group: string;
  male_cum: number;
  male_now: number;
  female_cum: number;
  female_now: number;
  total_cum: number;
  total_now: number;
};

export type SectoralRow = {
  label: string;
  male_cum: number;
  male_now: number;
  female_cum: number;
  female_now: number;
  total_cum: number;
  total_now: number;
};

export type BarangayRow = {
  barangay: string;
  families_cum: number;
  families_now: number;
  persons_cum: number;
  persons_now: number;
  shelter?: {
    totally: number;
    partially: number;
    not_identified: number;
  };
};

export type InsideEcGroup = {
  ec_name: string;
  ec_address: string;
  by_barangay: BarangayRow[];
  totals: {
    families_cum: number;
    families_now: number;
    persons_cum: number;
    persons_now: number;
    shelter?: BarangayRow["shelter"];
  };
};

export type InfoBoardGroup = {
  ec_name: string;
  ec_address: string;
  region: string;
  address: string;
  families_cum: number;
  families_now: number;
  persons_cum: number;
  persons_now: number;
  age_distribution: AgeRow[];
  sectoral: SectoralRow[];
};

export type ShelterPayload = {
  damage: {
    totally: number;
    partially: number;
    not_identified: number;
    total: number;
  };
  ownership: {
    owner: number;
    renter: number;
    sharer: number;
    informal_settler: number;
    not_identified: number;
    total: number;
  };
};

export type MunicipalityOption = {
  city_mun: string;
  heads_count: number;
};

export type ReportsBundle = {
  inside_ec: {
    ec_name: string;
    ec_sites_count: number;
    totals: {
      families_cum: number;
      families_now: number;
      persons_cum: number;
      persons_now: number;
    };
    groups: InsideEcGroup[];
  };
  sex_age_sectoral: {
    age_distribution: AgeRow[];
    sectoral: SectoralRow[];
    totals: CountTotals;
  };
  info_board: {
    region: string;
    families_cum: number;
    families_now: number;
    persons_cum: number;
    persons_now: number;
    groups: InfoBoardGroup[];
  };
  shelter: ShelterPayload;
  municipalities: MunicipalityOption[];
  city_mun_filter: string;
  total_records: number;
  inside_ec_records: number;
};
