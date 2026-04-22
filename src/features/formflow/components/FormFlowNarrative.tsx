const sections = [
  {
    title: 'The Problem',
    body: 'The fill side has been waiting twenty years. The average web form has barely improved since 2005. Forms ask humans to conform to databases — type your date in MM/DD/YYYY, pick your country from a 195-item dropdown, format your phone number just so. The result: $260 billion in abandoned ecommerce transactions, $2.4 billion in student financial aid unclaimed, and millions of people locked out by accessibility failures.',
  },
  {
    title: 'The Insight',
    body: 'Every AI form tool on the market — Jotform, Typeform, Fillout — invested in AI for form builders. Describe the form you want, AI generates it. But nobody optimised the fill side. The experience of actually completing a form is unchanged. FormFlow fills that gap: AI that operates at fill-time, understanding what you mean and translating it to what the system needs.',
  },
  {
    title: 'How It Works',
    body: undefined,
    bullets: [
      {
        label: 'Natural Language Resolution',
        text: 'Type "England," get "United Kingdom." Type "next Friday," get an ISO date.',
      },
      {
        label: 'Semantic Validation',
        text: '"Did you mean gmail.com?" catches meaning, not just format.',
      },
      {
        label: 'Adaptive Intelligence',
        text: 'The form changes based on your answers, hides irrelevant fields, and justifies every question it asks.',
      },
    ],
  },
];

export function FormFlowNarrative() {
  return (
    <section
      className="py-16 px-4 border-t border-[#2A3045]"
      aria-label="About FormFlow"
    >
      <div className="max-w-3xl mx-auto space-y-12">
        {sections.map((section) => (
          <article key={section.title}>
            <h2 className="text-xl font-bold text-[#F0F2F8] mb-4">{section.title}</h2>
            {section.body && (
              <p className="text-[#8B92A8] leading-relaxed">{section.body}</p>
            )}
            {section.bullets && (
              <ol className="space-y-4" aria-label={section.title}>
                {section.bullets.map((bullet, i) => (
                  <li key={bullet.label} className="flex gap-3">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full bg-[#6C63FF]/20 border border-[#6C63FF]/40 text-[#6C63FF] text-xs font-bold flex items-center justify-center mt-0.5"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <span className="text-[#F0F2F8] font-medium">{bullet.label}</span>
                      <span className="text-[#8B92A8]"> — {bullet.text}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
