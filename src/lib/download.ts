import { downloadUrlFor, type LibraryItem } from "@/lib/items";

export type SaveResult = "shared" | "downloaded" | "cancelled";

function isTouchDevice(): boolean {
  return typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
}

/**
 * Save a cutout the way the platform expects:
 * - Phones/tablets: native share sheet with the PNG as a file, so iOS shows
 *   "Save Image" straight to Photos.
 * - Desktop: direct download via Supabase's ?download= URL.
 */
export async function saveItem(item: LibraryItem): Promise<SaveResult> {
  const filename = `${item.slug}.png`;

  if (isTouchDevice() && typeof navigator.canShare === "function") {
    try {
      const res = await fetch(item.publicUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return "shared";
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
      // Fall through to the anchor download.
    }
  }

  triggerDownload(downloadUrlFor(item.storagePath, filename));
  return "downloaded";
}

export function triggerDownload(href: string, downloadName?: string) {
  const a = document.createElement("a");
  a.href = href;
  if (downloadName) a.download = downloadName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function copyItemToClipboard(item: LibraryItem): Promise<boolean> {
  try {
    const res = await fetch(item.publicUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}
