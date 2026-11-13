/** Copy that belongs to this design only. Everything personal comes from `@/content/portfolio`. */
export const COPY = {
  headline: ["Software that ships.", "Systems that last."],
  callout: ["That’s my desk,", "six years in."],
  aboutTitle: "Six years of shipping software people rely on.",
  workIntro: "A few builds I’m proud of: what they were for, and what changed because of them.",
  skillsTitle: "Toolkit.",
  principlesTitle: "How I work.",
  contactKicker: "Still scrolling? Good sign.",
  contactTitle: ["Got a role", "in mind?"],
};

/** Typographic transitions: the phrase that scatters, and the section title it reassembles into. */
export const MORPH = {
  experience: { from: "Who I am.", to: "Experience." },
  work: { from: "Where I’ve been.", to: "Selected Work." },
  skills: { from: "What I’ve built.", to: COPY.skillsTitle },
  principles: { from: "What I use.", to: COPY.principlesTitle },
};

/** One line under each principle from the content file, in the same order. */
export const PRINCIPLE_NOTES = [
  "Code is read far more often than it is written, so I write for the next person.",
  "Small, frequent releases keep risk low and feedback fast.",
  "I profile before I tune, and I keep the numbers that prove it worked.",
  "A good test tells you what the code is for, not just that it runs.",
];
