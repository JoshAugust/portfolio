import { Link } from "react-router-dom";
import { Radio, BarChart3 } from "lucide-react";

const Finchex = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 md:px-16 lg:px-24 relative selection:bg-primary selection:text-primary-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-8 text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-mono">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/poker" className="hover:text-foreground transition-colors">Poker</Link>
          <Link to="/prospector" className="hover:text-foreground transition-colors">Prospector</Link>
          <span className="text-foreground transition-colors">Finchex</span>
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

      <main className="max-w-[48rem] text-center leading-[1.7] md:leading-[1.85] lg:leading-[1.9]">
        <BarChart3 className="w-12 h-12 mx-auto mb-6 text-muted-foreground" />
        <h1 className="text-[1.5rem] md:text-[2rem] font-display tracking-[-0.01em] mb-4">
          Finchex
        </h1>
        <p className="text-[0.95rem] md:text-[1.2rem] font-display text-muted-foreground">
          Coming soon.
        </p>
      </main>
    </div>
  );
};

export default Finchex;
