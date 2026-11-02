/**
 * Utility functions for reliable cross-browser / cross-platform email composition.
 */

export function getGmailComposeUrl(toEmail: string, subject = '', body = ''): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function getOutlookComposeUrl(toEmail: string, subject = '', body = ''): string {
  return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(toEmail)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function openNativeMail(toEmail: string, subject = '', body = ''): void {
  const mailtoUrl = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
}
