import { useEffect } from "react";

const FINCHEX_URL = "https://surround-responsibilities-harold-perception.trycloudflare.com";

const Finchex = () => {
  useEffect(() => {
    window.location.href = FINCHEX_URL;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[0.95rem] font-display text-muted-foreground">
        Redirecting to FinChex…
      </p>
    </div>
  );
};

export default Finchex;
