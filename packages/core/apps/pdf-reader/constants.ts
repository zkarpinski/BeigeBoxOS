/** Session key for opening a PDF from the virtual desktop / My Computer (KarpOS / WinXP). */
export const PDF_READER_PENDING_KEY = 'pdf-reader-pending';

/** Map virtual file `contentKey` → static asset URL (root-relative). */
export const PDF_CONTENT_KEY_TO_URL: Record<string, string> = {
  'resume-pdf': '/karpos/my-resume.pdf',
};
