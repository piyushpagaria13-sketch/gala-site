/**
 * Reserved complimentary recipients from the Class of 2027 list.
 * These names may book once and receive one complimentary seat.
 * Product copy never uses the word "scholar".
 */

export type ReservedRecipient = {
  preferredName: string;
  officialName: string;
  familyName: string;
};

export const RESERVED_RECIPIENTS: ReservedRecipient[] = [
  { preferredName: "Anastasia", officialName: "Anastasia", familyName: "BAKURIYA" },
  { preferredName: "Melo", officialName: "Simelokuhle", familyName: "NKAMBULE" },
  { preferredName: "Asep", officialName: "Asep", familyName: "PUTRA" },
  { preferredName: "Millie", officialName: "Kanha", familyName: "AM" },
  { preferredName: "Roman", officialName: "Roman", familyName: "AJAPNGU NJENDE" },
  { preferredName: "Christ Mignon", officialName: "Christ Mignon", familyName: "AKOUYA-A" },
  { preferredName: "Nayelhi", officialName: "Sara", familyName: "GOMEZ GARCIA" },
  { preferredName: "Benicio", officialName: "Benicio", familyName: "DELGADO MONTERO" },
  { preferredName: "Zoe Alejandra", officialName: "Zoe Alejandra", familyName: "DIAZ PAYANO" },
  { preferredName: "Gabriel", officialName: "Gabriel", familyName: "HERNANDEZ SOLIS" },
  { preferredName: "Alexander", officialName: "Alexander", familyName: "LI" },
  { preferredName: "Kudzaishe Sewereni", officialName: "Kudzaishe Sewereni", familyName: "NKHATA" },
  { preferredName: "Naw Ehka", officialName: "Naw Ehka", familyName: "NORK" },
  { preferredName: "Phetegue Abdoul Malick", officialName: "Phetegue Abdoul Malick", familyName: "MEITE" },
  { preferredName: "Anastasia", officialName: "Anastasia", familyName: "ZAPSA" },
  { preferredName: "Mareb", officialName: "Mareb", familyName: "OCHIENG" },
  { preferredName: "Alesia Samikai", officialName: "Alesia Samikai", familyName: "DIAZ DE LA VEGA GUERRERO" },
  { preferredName: "Kingyel Wangchuk", officialName: "Kingyel Wangchuk", familyName: "DORJI" },
  { preferredName: "Lautaro Gabriel", officialName: "Lautaro Gabriel", familyName: "PEREZ MARTINEZ" },
  { preferredName: "Chanhong", officialName: "Chanhong", familyName: "YAIM" },
  { preferredName: "Emmanuel", officialName: "Emmanuel", familyName: "SORO" },
  { preferredName: "Butter", officialName: "Khanh Ngan", familyName: "TRIEU" },
  { preferredName: "Mina June", officialName: "Mina June", familyName: "ANDRAULT CRUBEZY" },
  { preferredName: "Luka", officialName: "Luka", familyName: "PECANAC" },
  { preferredName: "Sofiia", officialName: "Sofiia", familyName: "VENCHAK" },
];

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function nameKey(...parts: Array<string | undefined | null>): string {
  return parts
    .map((part) => normalize(part ?? ""))
    .filter(Boolean)
    .join(" ");
}

const RESERVED_KEYS = new Set(
  RESERVED_RECIPIENTS.flatMap((row) => [
    nameKey(row.preferredName, row.familyName),
    nameKey(row.officialName, row.familyName),
  ]),
);

export function isReservedRecipient(student: {
  name?: string | null;
  preferredName?: string | null;
  officialName?: string | null;
  familyName?: string | null;
  compSeats?: number | null;
}): boolean {
  if ((student.compSeats ?? 0) > 0) return true;
  const keys = [
    nameKey(student.preferredName, student.familyName),
    nameKey(student.officialName, student.familyName),
    nameKey(student.name),
  ];
  return keys.some((key) => key.length > 0 && RESERVED_KEYS.has(key));
}
