type EstimateForCsv = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  projectDescription: string;
  preferredTimeline: string | null;
  preferredContactTime: string | null;
  consent: boolean;
  status: string;
  createdAt: Date;
  mediaAssets: {
    storageKey: string;
    publicUrl: string | null;
    mimeType: string;
    fileSize: number;
  }[];
};

function escapeCsv(value: string | number | boolean | null) {
  if (value === null) {
    return "";
  }

  const stringValue = String(value).replace(/"/g, '""');
  return `"${stringValue}"`;
}

export function estimatesToCsv(estimates: EstimateForCsv[]) {
  const headers = [
    "id",
    "createdAt",
    "status",
    "fullName",
    "email",
    "phoneNumber",
    "preferredTimeline",
    "preferredContactTime",
    "consent",
    "projectDescription",
    "mediaCount",
    "mediaStorageKeys",
    "mediaPublicUrls",
  ];

  const rows = estimates.map((estimate) => {
    const mediaStorageKeys = estimate.mediaAssets.map((media) => media.storageKey).join(" | ");
    const mediaPublicUrls = estimate.mediaAssets.map((media) => media.publicUrl || "").join(" | ");

    return [
      estimate.id,
      estimate.createdAt.toISOString(),
      estimate.status,
      estimate.fullName,
      estimate.email,
      estimate.phoneNumber,
      estimate.preferredTimeline || "",
      estimate.preferredContactTime || "",
      estimate.consent,
      estimate.projectDescription,
      estimate.mediaAssets.length,
      mediaStorageKeys,
      mediaPublicUrls,
    ]
      .map((value) => escapeCsv(value))
      .join(",");
  });

  return [headers.map((header) => escapeCsv(header)).join(","), ...rows].join("\n");
}
