import { z } from "zod";

const releaseNoteTextSchema = z
  .string()
  .min(1)
  .refine((value) => !/[\u2013\u2014]/u.test(value), {
    message: "Release note copy must not use en or em dashes.",
  });

export const publicReleaseNoteSectionSchema = z.object({
  title: releaseNoteTextSchema,
  items: z.array(releaseNoteTextSchema).min(1),
});

export const publicReleaseNoteSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/u),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
  headline: releaseNoteTextSchema,
  summary: releaseNoteTextSchema,
  sections: z.array(publicReleaseNoteSectionSchema).min(1),
});

export type PublicReleaseNoteSection = z.infer<typeof publicReleaseNoteSectionSchema>;
export type PublicReleaseNote = z.infer<typeof publicReleaseNoteSchema>;
