import { portfolio as P } from "@/content/portfolio";

/** Everything search engines and AI answer engines read about the site, built from the content file. */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || P.site).replace(/\/$/, "");

export const SEO_TITLE = `${P.name} — ${P.role} · React & Next.js`;

export const SEO_DESCRIPTION = `${P.name} is a ${P.role.toLowerCase()} in ${P.location} with ${P.years} years building fast, reliable React and Next.js apps: e-commerce, payment gateways, POS and AI products.`;

const allSkills = [...P.skills.flatMap((g) => g.items), ...P.tools];

export const SEO_KEYWORDS = [P.name, P.role, "React developer", "Next.js developer", "Full stack developer", "Frontend developer", ...P.location.split(", "), ...allSkills.slice(0, 12)];

const [current] = P.experience;
const company = (place: string) => place.split(" · ")[0].replace(/\s*\(.*\)$/, "");

/** schema.org graph: the profile page, the person it is about, the site, and the projects. */
export function jsonLd() {
  const person = {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: P.name,
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image`,
    jobTitle: current.title,
    description: SEO_DESCRIPTION,
    email: `mailto:${P.contact.email}`,
    address: { "@type": "PostalAddress", addressLocality: P.location.split(",")[0].trim(), addressCountry: "PH" },
    worksFor: { "@type": "Organization", name: company(current.place) },
    alumniOf: P.education.map((e) => ({ "@type": "EducationalOrganization", name: company(e.place) })),
    knowsAbout: allSkills,
    sameAs: P.contact.links.map((l) => l.href),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: P.name,
        description: SEO_DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": `${SITE_URL}/#person` },
      },
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}/#profile`,
        url: SITE_URL,
        name: SEO_TITLE,
        description: SEO_DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: { "@id": `${SITE_URL}/#person` },
      },
      person,
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/#work`,
        name: `Selected work by ${P.name}`,
        itemListElement: P.projects.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "CreativeWork",
            name: p.title,
            description: `${p.description} ${p.impact}`,
            genre: p.kind,
            keywords: p.stack.join(", "),
            creator: { "@id": `${SITE_URL}/#person` },
            ...(p.link ? { url: p.link } : {}),
          },
        })),
      },
    ],
  };
}

/** Plain-text summary for AI crawlers (llms.txt), so answer engines can quote the profile accurately. */
export function llmsTxt() {
  const lines = [
    `# ${P.name}`,
    "",
    `> ${SEO_DESCRIPTION}`,
    "",
    ...P.about,
    "",
    "## Experience",
    ...P.experience.map((e) => `- ${e.period}: ${e.title}, ${e.place}. ${e.text}`),
    "",
    "## Selected work",
    ...P.projects.map((p) => `- ${p.title} (${p.kind}, ${p.year}): ${p.description} Impact: ${p.impact}. Stack: ${p.stack.join(", ")}.${p.link ? ` ${p.link}` : ""}`),
    "",
    "## Skills",
    ...P.skills.map((g) => `- ${g.group}: ${g.items.join(", ")}`),
    `- tools: ${P.tools.join(", ")}`,
    "",
    "## Education",
    ...P.education.map((e) => `- ${e.period}: ${e.title}, ${e.place}`),
    "",
    "## Contact",
    `- Email: ${P.contact.email}`,
    ...P.contact.links.map((l) => `- ${l.label}: ${l.href}`),
    `- Website: ${SITE_URL}`,
    "",
  ];
  return lines.join("\n");
}
