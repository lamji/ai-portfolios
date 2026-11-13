import { portfolio as P } from "@/content/portfolio";

/**
 * The same story as plain semantic HTML — read by screen readers and search
 * engines, visually hidden because the 3D book shows it on its pages.
 */
export function SrContent() {
  return (
    <main className="sr-only">
      <h1>
        {P.name} — {P.role}
      </h1>
      <p>
        {P.years} years of professional experience, since {P.since}.
      </p>
      <p>{P.tagline}</p>

      <section>
        <h2>init() — About</h2>
        {P.about.map((t) => (
          <p key={t}>{t}</p>
        ))}
        <ul>
          {P.stats.map((s) => (
            <li key={s.label}>
              {s.value} {s.label}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>The Stack — Skills</h2>
        {P.skills.map((g) => (
          <div key={g.group}>
            <h3>{g.group}</h3>
            <ul>{g.items.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        ))}
        <h3>Tools</h3>
        <ul>{P.tools.map((i) => <li key={i}>{i}</li>)}</ul>
        <h3>Principles</h3>
        <ul>{P.principles.map((i) => <li key={i}>{i}</li>)}</ul>
      </section>

      <section>
        <h2>Projects</h2>
        {P.projects.map((pr) => (
          <article key={pr.title}>
            <h3>
              <a href={pr.link}>{pr.title}</a>
            </h3>
            <p>
              {pr.kind}, {pr.year}. {pr.description} Impact: {pr.impact}. Built with {pr.stack.join(", ")}.
            </p>
          </article>
        ))}
      </section>

      <section>
        <h2>git log — Experience</h2>
        {P.experience.map((e) => (
          <p key={e.title + e.period}>
            {e.title} at {e.place}, {e.period}. {e.text}
          </p>
        ))}
        {P.education.map((e) => (
          <p key={e.title}>
            {e.title}, {e.place}, {e.period}
          </p>
        ))}
        <ul>{P.achievements.map((a) => <li key={a}>{a}</li>)}</ul>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          <a href={`mailto:${P.contact.email}`}>{P.contact.email}</a>
        </p>
        <ul>
          {P.contact.links.map((l) => (
            <li key={l.href}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
