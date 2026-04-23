import { Link } from 'react-router-dom';

export function FormFlowNav() {
  return (
    <nav className="sticky top-0 z-50 bg-[#0D0F14]/90 backdrop-blur-md border-b border-[#2A3045]">
      <div className="max-w-[1240px] mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Left: Portfolio link */}
          <Link
            to="/"
            className="text-sm text-[#8B92A8] hover:text-[#F0F2F8] transition-colors py-3 pr-4"
          >
            ← Portfolio
          </Link>

          {/* Center: FormFlow label (hidden on mobile) */}
          <span className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#F0F2F8]">
            <span className="text-[#6C63FF]">✦</span>
            FormFlow
          </span>

          {/* Right: View Source link */}
          <a
            href="https://github.com/JoshAugust/formflow"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#6C63FF] hover:text-[#8B84FF] transition-colors py-3 pl-4"
          >
            View Source
          </a>
        </div>
      </div>
    </nav>
  );
}
