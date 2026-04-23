export function FormFlowFooter() {
  return (
    <footer
      className="border-t border-[#2A3045] bg-[#161A24] py-8 px-4 text-center"
      aria-label="FormFlow footer"
    >
      <div className="max-w-[1240px] mx-auto space-y-3">
        <p className="text-sm font-semibold text-[#F0F2F8]">
          FormFlow — Built by Josh Augustine
        </p>
        <p className="text-xs text-[#545B72] max-w-xl mx-auto">
          Grounded in research from Baymard Institute, NNGroup, WebAIM, and 50+ academic sources.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 pt-1">
          <a
            href="https://github.com/JoshAugust/portfolio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#6C63FF] hover:text-[#8B84FF] transition-colors underline underline-offset-2"
          >
            View Source on GitHub
          </a>
          <span className="hidden sm:inline text-[#2A3045]" aria-hidden="true">·</span>
          <a
            href="/"
            className="text-xs text-[#8B92A8] hover:text-[#F0F2F8] transition-colors"
          >
            ← Back to Portfolio
          </a>
        </div>
      </div>
    </footer>
  );
}
