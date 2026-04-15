import { useEffect, useState } from 'react';
import { File, Wrench, Zap, Clock, ChevronRight } from 'lucide-react';
import { useAgentFiles, useTools, useSkills, useCron } from '../../../gateway';

function CollapsibleSection({ title, icon: Icon, count, children }: {
  title: string;
  icon: typeof File;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full py-2 px-2 rounded-md cursor-pointer transition-colors hover:opacity-80"
        style={{ background: open ? 'var(--bg-tertiary)' : 'transparent' }}
      >
        <ChevronRight
          className="w-3.5 h-3.5 transition-transform"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(90deg)' : 'none' }}
        />
        <Icon className="w-3.5 h-3.5" style={{ color: 'var(--corgi-orange)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</span>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
          {count}
        </span>
      </button>
      {open && <div className="ml-6 mt-1 space-y-0.5">{children}</div>}
    </div>
  );
}

export function AgentsTab() {
  const { files, refreshAgentFiles, getFileContent } = useAgentFiles();
  const { tools, refreshTools } = useTools();
  const { skills, refreshSkills } = useSkills();
  const { jobs, refreshCron } = useCron();
  const [viewingFile, setViewingFile] = useState<{ path: string; content: string } | null>(null);

  useEffect(() => {
    refreshAgentFiles();
    refreshTools();
    refreshSkills();
    refreshCron();
  }, [refreshAgentFiles, refreshTools, refreshSkills, refreshCron]);

  const handleFileClick = async (path: string) => {
    if (viewingFile?.path === path) {
      setViewingFile(null);
      return;
    }
    const content = await getFileContent(path);
    setViewingFile({ path, content: content ?? '(empty)' });
  };

  return (
    <div className="p-3 space-y-2">
      {/* Files */}
      <CollapsibleSection title="Files" icon={File} count={files.length}>
        {files.map((f) => (
          <div key={f.path}>
            <button
              onClick={() => handleFileClick(f.path)}
              className="w-full text-left text-xs py-1 px-2 rounded cursor-pointer transition-colors truncate hover:opacity-80"
              style={{
                color: viewingFile?.path === f.path ? 'var(--corgi-orange)' : 'var(--text-secondary)',
                background: viewingFile?.path === f.path ? 'var(--bg-tertiary)' : 'transparent',
              }}
            >
              {f.name}
            </button>
            {viewingFile?.path === f.path && (
              <pre
                className="text-[10px] p-2 mt-1 rounded-md overflow-x-auto max-h-48 overflow-y-auto"
                style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
              >
                {viewingFile.content}
              </pre>
            )}
          </div>
        ))}
        {files.length === 0 && <div className="text-xs py-2 px-2" style={{ color: 'var(--text-muted)' }}>No files</div>}
      </CollapsibleSection>

      {/* Tools */}
      <CollapsibleSection title="Tools" icon={Wrench} count={tools.length}>
        {tools.map((t) => (
          <div key={t.name} className="text-xs py-1 px-2" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-mono">{t.name}</span>
            {t.description && (
              <span className="ml-1" style={{ color: 'var(--text-muted)' }}>— {t.description.slice(0, 60)}</span>
            )}
          </div>
        ))}
        {tools.length === 0 && <div className="text-xs py-2 px-2" style={{ color: 'var(--text-muted)' }}>No tools</div>}
      </CollapsibleSection>

      {/* Skills */}
      <CollapsibleSection title="Skills" icon={Zap} count={skills.length}>
        {skills.map((s) => (
          <div key={s.name} className="text-xs py-1 px-2" style={{ color: 'var(--text-secondary)' }}>
            {s.name}
          </div>
        ))}
        {skills.length === 0 && <div className="text-xs py-2 px-2" style={{ color: 'var(--text-muted)' }}>No skills</div>}
      </CollapsibleSection>

      {/* Cron Jobs */}
      <CollapsibleSection title="Cron Jobs" icon={Clock} count={jobs.length}>
        {jobs.map((j) => (
          <div key={j.id} className="flex items-center gap-2 text-xs py-1 px-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: j.enabled ? 'var(--success)' : 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{j.label ?? j.id}</span>
            <span className="ml-auto font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{j.schedule}</span>
          </div>
        ))}
        {jobs.length === 0 && <div className="text-xs py-2 px-2" style={{ color: 'var(--text-muted)' }}>No cron jobs</div>}
      </CollapsibleSection>
    </div>
  );
}
