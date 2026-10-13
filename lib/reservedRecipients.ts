/**
 * Remaining reserved complimentary recipients.
 * These names may book once and receive one complimentary seat.
 * Product copy never uses the word "scholar".
 */

export type ReservedRecipient = {
  preferredName: string;
  officialName: string;
  familyName: string;
};

export const RESERVED_RECIPIENTS: ReservedRecipient[] = [
  { preferredName: "Nayelhi", officialName: "Sara", familyName: "GOMEZ GARCIA" },
  { preferredName: "Gabriel", officialName: "Gabriel", familyName: "HERNANDEZ SOLIS" },
  { preferredName: "Luka", officialName: "Luka", familyName: "PECANAC" },
  { preferredName: "Butter", officialName: "Khanh Ngan", familyName: "TRIEU" },
  { preferredName: "Alexander", officialName: "Alexander", familyName: "LI" },
  { preferredName: "Mareb", officialName: "Mareb", familyName: "OCHIENG" },
  { preferredName: "Melo", officialName: "Simelokuhle", familyName: "NKAMBULE" },
  { preferredName: "Phetegue Abdoul Malick", officialName: "Phetegue Abdoul Malick", familyName: "MEITE" },
  { preferredName: "Kudzaishe Sewereni", officialName: "Kudzaishe Sewereni", familyName: "NKHATA" },
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
  RESERVED_RECIPIENTS.flatMap((row) => {
    const keys = [
      nameKey(row.preferredName, row.familyName),
      nameKey(row.officialName, row.familyName),
    ];
    if (row.officialName.includes(" ")) keys.push(nameKey(row.officialName));
    if (row.preferredName.includes(" ")) keys.push(nameKey(row.preferredName));
    return keys;
  }),
);

export function isReservedRecipient(student: {
  name?: string | null;
  preferredName?: string | null;
  officialName?: string | null;
  familyName?: string | null;
}): boolean {
  const keys = [
    nameKey(student.preferredName, student.familyName),
    nameKey(student.officialName, student.familyName),
    nameKey(student.name),
  ];
  return keys.some((key) => key.length > 0 && RESERVED_KEYS.has(key));
}
