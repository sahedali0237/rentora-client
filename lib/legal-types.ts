export type LegalBullet = {
  label?: string;
  detail: string;
};

export type LegalBlock = {
  heading?: string;
  text?: string;
  bullets?: LegalBullet[];
};

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDoc = {
  brandName: string;
  lastUpdatedLabel: string;
  contactEmail: string;
  sections: LegalSection[];
};
