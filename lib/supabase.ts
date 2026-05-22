const DEFAULT_URL = "https://mhpngjwyzmsxdgakaszg.supabase.co";

const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL
).replace(/\/+$/, "");

export const INVOICE_BUCKET = "tm-invoices";

export function invoicePhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const cleanPath = path.replace(/^\/+/, "");
  return `${SUPABASE_URL}/storage/v1/object/public/${INVOICE_BUCKET}/${cleanPath}`;
}

export function invoicePhotoUrls(
  paths: string[] | null | undefined
): { path: string; url: string }[] {
  if (!paths || paths.length === 0) return [];
  return paths
    .map((path) => {
      const url = invoicePhotoUrl(path);
      return url ? { path, url } : null;
    })
    .filter((p): p is { path: string; url: string } => p !== null);
}
