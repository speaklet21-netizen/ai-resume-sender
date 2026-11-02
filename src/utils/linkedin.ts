/**
 * Utility helper to ensure LinkedIn links always point to genuine, live LinkedIn search results
 * or real profiles without returning "Page not found" or "No results".
 */

export function getHrLinkedinUrl(hrName: string, company: string, rawUrl?: string): string {
  // If user entered a custom valid non-placeholder profile URL, keep it
  if (
    rawUrl &&
    rawUrl.startsWith('https://www.linkedin.com/in/') &&
    !rawUrl.endsWith('-techcorp') &&
    !rawUrl.endsWith('-aicore') &&
    !rawUrl.endsWith('-dataworld') &&
    !rawUrl.endsWith('-cloudnine') &&
    !rawUrl.endsWith('-webstudio') &&
    !rawUrl.endsWith('-fintech') &&
    !rawUrl.endsWith('-healthtech') &&
    !rawUrl.endsWith('-cybershield') &&
    !rawUrl.endsWith('-pulseai') &&
    !rawUrl.endsWith('-robotics')
  ) {
    return rawUrl;
  }

  // Generate a live LinkedIn search URL for HR recruiters at this company
  const query = `${hrName} ${company} Recruiter`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
}

export function getCompanyLinkedinUrl(company: string, rawUrl?: string): string {
  // If user entered a custom valid non-placeholder company URL, keep it
  if (
    rawUrl &&
    rawUrl.startsWith('https://www.linkedin.com/company/') &&
    !rawUrl.endsWith('-global') &&
    !rawUrl.endsWith('-systems') &&
    !rawUrl.endsWith('-labs') &&
    !rawUrl.endsWith('-dev') &&
    !rawUrl.endsWith('-co') &&
    !rawUrl.endsWith('-defense') &&
    !rawUrl.endsWith('-dynamics') &&
    !rawUrl.endsWith('-robotics')
  ) {
    return rawUrl;
  }

  // Generate a live LinkedIn company search URL
  return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(company)}`;
}
