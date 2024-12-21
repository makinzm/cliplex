import { checkDomainFilterMode } from "../../src/content_script_helper"; 

describe("Domain filter mode logic", () => {
  it("exclude mode => block if domain is in excludedDomains", () => {
    const mode = "exclude";
    const excluded = [{ domain: "abc.com" }];
    const included = [{ domain: "xyz.com" }]; // irrelevant
    const current = "abc.com";

    const result = checkDomainFilterMode(mode, excluded, included, current);
    // result => false means "stop content script"
    expect(result).toBe(false);
  });

  it("include mode => block if domain is not in includedDomains", () => {
    const mode = "include";
    const excluded = [{ domain: "abc.com" }]; // irrelevant
    const included = [{ domain: "xyz.com" }];
    const current = "abc.com";

    const result = checkDomainFilterMode(mode, excluded, included, current);
    expect(result).toBe(false);
  });

  it("include mode => pass if domain is in includedDomains", () => {
    const mode = "include";
    const included = [{ domain: "xyz.com" }];
    const current = "xyz.com";

    const result = checkDomainFilterMode(mode, [], included, current);
    // result => true means "let the script run"
    expect(result).toBe(true);
  });
});

