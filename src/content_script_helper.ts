export function checkDomainFilterMode(
  mode: "include" | "exclude",
  excludedDomains: DomainEntry[],
  includedDomains: DomainEntry[],
  currentDomain: string
): boolean {
  if (mode === "exclude") {
    // もしexcludedに含まれていれば false(ブロック)
    return !excludedDomains.some(d => d.domain === currentDomain);
  } else {
    // includeの場合、含まれていれば true(実行OK)
    return includedDomains.some(d => d.domain === currentDomain);
  }
}

