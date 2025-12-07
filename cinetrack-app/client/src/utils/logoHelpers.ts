import type { LogoImage } from "../types/types";
import { TMDB_IMAGE_BASE_URL } from "../constants/constants";

/**
 * Select the best logo from a list of logos.
 * Priority: English SVG > Any SVG > English PNG > First available
 */
export function selectBestLogo(logos: LogoImage[] | undefined): LogoImage | null {
    if (!logos || logos.length === 0) return null;

    // English SVG
    let bestLogo = logos.find(
        (l) => l.iso_639_1 === "en" && l.file_path.endsWith(".svg")
    );
    if (bestLogo) return bestLogo;

    // Any SVG
    bestLogo = logos.find((l) => l.file_path.endsWith(".svg"));
    if (bestLogo) return bestLogo;

    // English PNG
    bestLogo = logos.find((l) => l.iso_639_1 === "en");
    if (bestLogo) return bestLogo;

    // First available
    return logos[0];
}

/**
 * Get the full URL for a logo image
 */
export function getLogoUrl(logo: LogoImage | null): string {
    if (!logo) return "";
    return `${TMDB_IMAGE_BASE_URL.replace("w500", "original")}${logo.file_path}`;
}
