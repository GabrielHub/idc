import { publicReleaseNoteSchema } from "../domain/release-notes";
import releaseNotesCatalogJson from "./release-notes.json";

export const releaseNotesCatalog = publicReleaseNoteSchema.array().parse(releaseNotesCatalogJson);
