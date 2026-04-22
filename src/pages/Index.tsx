import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Palette, Radio } from "lucide-react";

const PALETTES = [
  { // Default Dark
    background: '0 0% 4%',
    foreground: '0 0% 82%',
    primary: '0 0% 100%',
    primaryForeground: '0 0% 4%',
    destructive: '0 84.2% 60.2%',
  },
  { // Midnight Blue
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    primary: '217.2 91.2% 59.8%',
    primaryForeground: '222.2 47.4% 11.2%',
    destructive: '0 84.2% 60.2%',
  },
  { // Forest Green
    background: '145 45% 7%',
    foreground: '145 20% 90%',
    primary: '142 71% 45%',
    primaryForeground: '144 100% 11%',
    destructive: '0 84.2% 60.2%',
  },
  { // Sunset / Amber
    background: '20 50% 10%',
    foreground: '20 20% 90%',
    primary: '38 92% 50%',
    primaryForeground: '48 96% 89%',
    destructive: '0 84.2% 60.2%',
  },
  { // Deep Purple
    background: '270 50% 8%',
    foreground: '270 20% 90%',
    primary: '262 83% 58%',
    primaryForeground: '210 40% 98%',
    destructive: '0 84.2% 60.2%',
  }
];

const ColorPaletteButton = () => {
  const randomizeColor = () => {
    const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    const root = document.documentElement;
    root.style.setProperty('--background', palette.background);
    root.style.setProperty('--foreground', palette.foreground);
    root.style.setProperty('--primary', palette.primary);
    root.style.setProperty('--primary-foreground', palette.primaryForeground);
    root.style.setProperty('--destructive', palette.destructive);
  };

  return (
    <button
      onClick={randomizeColor}
      className="fixed left-6 md:left-8 lg:left-12 top-1/2 -translate-y-1/2 z-50 p-3 border border-border rounded-full hover:bg-muted transition-colors opacity-50 hover:opacity-100 bg-background cursor-pointer shadow-sm hover:shadow-md"
      title="Randomize Color Palette"
    >
      <Palette className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
    </button>
  );
};

interface KeywordBadgeProps {
  children: string;
  onHover: () => void;
}

const KeywordBadge = ({ children, onHover }: KeywordBadgeProps) => (
  <span
    className="badge-keyword"
    onMouseEnter={onHover}
  >
    {children}
  </span>
);

interface HighlightProps {
  children: React.ReactNode;
  isRevealed: boolean;
}

const Highlight = ({ children, isRevealed }: HighlightProps) => {
  const [hovered, setHovered] = useState(false);
  const [recentlyRevealed, setRecentlyRevealed] = useState(false);

  useEffect(() => {
    if (isRevealed) {
      setRecentlyRevealed(true);
      const timer = setTimeout(() => {
        setRecentlyRevealed(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isRevealed]);

  return (
    <span
      className={`transition-colors duration-1000 cursor-default ${hovered || recentlyRevealed ? "text-destructive" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </span>
  );
};

const NavBar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-12">
    <div className="flex items-center gap-8 text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
      <a href="#" className="text-foreground transition-colors">Home</a>
      <Link to="/poker" className="hover:text-foreground transition-colors">Poker</Link>
      <Link to="/prospector" className="hover:text-foreground transition-colors">Prospector</Link>
      <Link to="/finchex" className="hover:text-foreground transition-colors">Finchex</Link>
      <Link to="/music" className="hover:text-foreground transition-colors">Music</Link>
    </div>
    <div className="flex items-center gap-2">
      <Link
        to="/orchestra"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors text-[11px] tracking-[0.15em] uppercase font-mono text-muted-foreground hover:text-foreground"
      >
        <Radio className="w-3.5 h-3.5" style={{ color: '#FF5C00' }} />
        Orchestra
      </Link>
    </div>
  </nav>
);

const Index = () => {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const reveal = useCallback((step: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      for (let i = 0; i <= step; i++) next.add(i);
      return next;
    });
  }, []);

  const blur = (step: number) =>
    `transition-all duration-700 ease-out ${revealed.has(step) ? "opacity-100 blur-0" : "opacity-30 blur-[6px]"}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 md:px-16 lg:px-24 relative selection:bg-primary selection:text-primary-foreground">
      <NavBar />
      <ColorPaletteButton />

      <main className="max-w-[48rem] text-center leading-[1.7] md:leading-[1.85] lg:leading-[1.9]">
        <p className="text-[0.95rem] md:text-[1.2rem] lg:text-[1.35rem] font-display tracking-[-0.01em]">
          <span>Hello! I'm </span>
          <KeywordBadge onHover={() => reveal(1)}>JOSHUA</KeywordBadge>

          <span className={blur(1)}> Augustine. I build <Highlight isRevealed={revealed.has(1)}>agentic AI systems</Highlight> and I'm a </span>
          <KeywordBadge onHover={() => reveal(2)}>CAMBRIDGE</KeywordBadge>

          <span className={blur(2)}> MBA candidate. My background is in Mechanical </span>
          <KeywordBadge onHover={() => reveal(3)}>ENGINEERING</KeywordBadge>

          <span className={blur(3)}>, but I fell in love with everything at the intersection of AI and </span>
          <KeywordBadge onHover={() => reveal(4)}>STRATEGY</KeywordBadge>

          <span className={blur(4)}>. I'm part of the <Highlight isRevealed={revealed.has(4)}>OpenClaw</Highlight> open-source community, building tools for autonomous </span>
          <KeywordBadge onHover={() => reveal(5)}>AGENTS</KeywordBadge>

          <span className={blur(5)}> — from <Highlight isRevealed={revealed.has(5)}>multi-agent orchestration</Highlight> to real-time control interfaces. Before that, I bridged the gap between engineering and non-technical </span>
          <KeywordBadge onHover={() => reveal(6)}>STAKEHOLDERS</KeywordBadge>

          <span className={blur(6)}> to drive adoption of agile methodologies at enterprise scale. I've managed </span>
          <KeywordBadge onHover={() => reveal(7)}>CAMPAIGNS</KeywordBadge>

          <span className={blur(7)}> for <Highlight isRevealed={revealed.has(7)}>VISA, Broadcom, M&amp;S, and Halfords</Highlight> — handling <Highlight isRevealed={revealed.has(7)}>28-million-record</Highlight> </span>
          <KeywordBadge onHover={() => reveal(8)}>ECOSYSTEMS</KeywordBadge>

          <span className={blur(8)}>. I also build things: multi-agent pipelines, financial modelling tools, and AI-powered </span>
          <KeywordBadge onHover={() => reveal(9)}>CRMs</KeywordBadge>

          <span className={blur(9)}>. Oh, and I'm a music </span>
          <KeywordBadge onHover={() => reveal(10)}>PRODUCER</KeywordBadge>

          <span className={blur(10)}> with songs on </span>
          <a
            href="https://linktr.ee/secondsunset"
            target="_blank"
            rel="noopener noreferrer"
            className="badge-keyword no-underline hover:scale-105 transition-transform inline-flex"
            style={{ textDecoration: 'none' }}
          >
            STREAMING SERVICES
          </a>
          <span className={blur(10)}>.</span>
        </p>

        <div className="mt-10 text-[0.95rem] md:text-[1.2rem] lg:text-[1.35rem] font-display">
          <p>
            <span className={blur(11)}>I live in </span>
            <KeywordBadge onHover={() => reveal(11)}>CAMBRIDGE</KeywordBadge>
          </p>
          <p className="mt-4 text-[0.75rem] md:text-[0.85rem] text-muted-foreground">
            <span className={blur(12)}>You can find me at </span>
            <KeywordBadge onHover={() => reveal(12)}>ja892@jbs.cam.ac.uk</KeywordBadge>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
