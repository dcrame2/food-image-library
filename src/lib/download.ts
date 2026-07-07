import JSZip from "jszip";
import { downloadUrlFor, type LibraryItem } from "@/lib/items";

export type SaveResult = "shared" | "downloaded" | "cancelled";
export type SaveManyResult = "shared" | "zipped" | "cancelled" | "failed";

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

/**
 * Save several cutouts at once.
 * - Phones/tablets: one native share sheet with every PNG as a file, so iOS
 *   offers "Save N Images" straight to Photos. No zip to fumble with on mobile.
 * - Desktop (or where multi-file share is unsupported): a single .zip download.
 */
export async function saveManyItems(items: LibraryItem[]): Promise<SaveManyResult> {
  if (items.length === 0) return "failed";

  if (isTouchDevice() && typeof navigator.canShare === "function") {
    try {
      const files = await Promise.all(
        items.map(async (item) => {
          const res = await fetch(item.publicUrl);
          const blob = await res.blob();
          return new File([blob], `${item.slug}.png`, { type: "image/png" });
        }),
      );
      if (navigator.canShare({ files })) {
        await navigator.share({ files });
        return "shared";
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
      // Fall through to the zip download.
    }
  }

  try {
    const zip = new JSZip();
    await Promise.all(
      items.map(async (item) => {
        const res = await fetch(item.publicUrl);
        const blob = await res.blob();
        zip.file(`${item.category}/${item.slug}.png`, blob);
      }),
    );
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `cutouts-${new Date().toISOString().slice(0, 10)}.zip`);
    URL.revokeObjectURL(url);
    return "zipped";
  } catch {
    return "failed";
  }
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
