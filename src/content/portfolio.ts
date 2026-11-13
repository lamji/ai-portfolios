/**
 * ─────────────────────────────────────────────────────────────
 *  YOUR STORY — edit everything here.
 *  Every page of the book (and the hidden accessible version
 *  of the site) is generated from this file.
 * ─────────────────────────────────────────────────────────────
 */

export const portfolio = {
  name: "Jick Lampago",
  handle: "jick.lampago",
  role: "Software Engineer",
  years: 6,
  since: 2020,
  tagline: "I turn Figma designs into fast, reliable React and Next.js apps.",
  location: "Cebu, Philippines",

  about: [
    "I’m a React and Next.js developer with six years of building for the web: e-commerce, payment gateways, POS and learning platforms.",
    "At Serino360 I take Figma designs to production with an MVVM structure, Redux state and careful API validation, and I package what teams reuse as npm libraries so every project ships faster.",
    "Lately I build with AI: AI-assisted development day to day, and side projects with AI assistants built in, including an AI agent version of me.",
  ],

  quote: {
    text: "Programs must be written for people to read, and only incidentally for machines to execute.",
    by: "Harold Abelson",
  },

  stats: [
    { value: "6+", label: "years building for the web" },
    { value: "18+", label: "client projects shipped" },
    { value: "5", label: "npm packages built" },
    { value: "4", label: "live side projects" },
  ],

  skills: [
    { group: "languages", items: ["JavaScript (ES6)", "TypeScript", "HTML5", "CSS3 / Sass", "PHP"] },
    { group: "frontend", items: ["React", "Next.js", "Redux Toolkit", "React Query", "Material UI", "React Native"] },
    { group: "backend", items: ["Node.js", "Express", "REST APIs", "MongoDB"] },
    { group: "ai", items: ["AI chatbot integrations", "AI-driven development"] },
  ],

  principles: ["Readable over clever", "Ship small, ship often", "Measure, then optimise", "Tests are documentation"],

  tools: ["Git", "Rollup.js", "CI/CD", "Figma", "Vue.js", "jQuery", "Bootstrap 5", "Copilot"],
  exploring: ["AI agents", "Multi-tenant SaaS"],

  projects: [
    {
      title: "Central PH",
      year: "Serino360",
      kind: "E-commerce platform",
      description:
        "An e-commerce platform covering the whole client journey, from ordering to payment, plus the OMS admin dashboard that runs it.",
      impact: "Order → payment → admin, end to end",
      stack: ["Next.js", "TypeScript", "Redux Toolkit", "React Query", "Material UI"],
      link: "",
    },
    {
      title: "Serino Gateway Portal",
      year: "Serino360",
      kind: "Payment gateway",
      description:
        "A payment gateway built security-first: secure API communication, strict server-side validation and safeguards around sensitive payment data.",
      impact: "Security-first payment flows",
      stack: ["Next.js", "TypeScript", "Redux Toolkit", "React Query", "Material UI"],
      link: "",
    },
    {
      title: "POS Admin Portal",
      year: "Serino360",
      kind: "Multi-tenant admin",
      description:
        "One centralized portal to manage every deployed POS system, built multi-tenant with role-based access control and validation.",
      impact: "Every POS, one portal",
      stack: ["Next.js", "TypeScript", "Node.js", "Express", "MongoDB"],
      link: "",
    },
    {
      title: "Serino Table List",
      year: "Serino360",
      kind: "npm component library",
      description:
        "A reusable table-listing component shipped on npm that standardized admin UIs across projects, rendering interactive controls like status selectors right inside rows.",
      impact: "One table, every admin portal",
      stack: ["React", "TypeScript", "Rollup"],
      link: "",
    },
    {
      title: "AutoGo",
      year: "Side project",
      kind: "Car rental SaaS",
      description: "A multi-tenant car rental platform with an AI assistant built in.",
      impact: "Live, multi-tenant, AI-assisted",
      stack: ["Multi-tenant", "AI assistant"],
      link: "https://autogo.brainxai.site",
    },
    {
      title: "OpenDash",
      year: "Side project",
      kind: "Dashboard builder SaaS",
      description: "A SaaS dashboard builder: pick and drop widgets into a dashboard, with AI as your assistant.",
      impact: "Pick, drop, done, with AI help",
      stack: ["SaaS", "Drag and drop", "AI assistant"],
      link: "https://opendash.brainxai.site/",
    },
  ],

  /** Newest first. */
  experience: [
    {
      period: "May 2026 — now",
      title: "Full Stack Web Developer & Google Practitioner",
      place: "Digital Future ME · Dubai",
      text: "Full stack web apps, from interface to API.",
    },
    {
      period: "Feb — Aug 2026",
      title: "Web Developer",
      place: "Wio Ltd (side project)",
      text: "Freelance web development alongside full-time work.",
    },
    {
      period: "2022 — 2026",
      title: "React Developer",
      place: "Serino360 · Makati (remote)",
      text: "Figma to production React and Next.js apps (MVVM, Redux, API integration) and reusable npm packages used across projects.",
    },
    {
      period: "Jun — Aug 2022",
      title: "Front End Developer",
      place: "Elearnified · Makati (project)",
      text: "Redesigned the Philippine Red Cross Moodle LMS to a new UI/UX with Sass, JavaScript and jQuery.",
    },
    {
      period: "2021 — 2022",
      title: "Full Stack Developer",
      place: "Abakada Studios · Pasig (remote)",
      text: "LMS and HRIS platforms for schools and PayMongo payment work, with Vue.js, JavaScript, PHP and Python.",
    },
    {
      period: "Nov — Dec 2020",
      title: "React.js Developer",
      place: "Codally Tech (project)",
      text: "UI for the A+ Learning online-school platform in Next.js and Material UI, in an Agile team.",
    },
  ],

  education: [
    { period: "2020", title: "Full Stack Web Developer Apprenticeship", place: "Tuitt Bootcamp PH · Quezon City" },
    { period: "2011 — 2013", title: "Associate in Information Technology", place: "Cataingan Polytechnic Institute · Masbate" },
  ],

  achievements: ["Published a cross-platform npm package (React Native + Web)", "Built an AI agent version of me", "4 live side projects"],

  contact: {
    email: "lampagojick5@gmail.com",
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/jick-lampago/" },
      { label: "AI Agent", href: "https://www.brainxai.site" },
    ],
  },
};

export type Portfolio = typeof portfolio;
