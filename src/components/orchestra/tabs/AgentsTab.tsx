import { useEffect, useState, useCallback } from 'react';
import { File, Wrench, Zap, Clock, ChevronRight, Play, Power, Plus, Save, X, Pencil, Download, RefreshCw } from 'lucide-react';
import { useAgentFiles, useTools, useSkills, useCron, useGatewayStore } from '../../../gateway';

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

function NewCronJobForm({ onSubmit, onCancel }: { onSubmit: (job: Record<string, unknown>) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [payload, setPayload] = useState('');

  return (
    <div className="p-2 rounded-md space-y-2 mt-1" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
      <input
        className="w-full text-xs px-2 py-1 rounded"
        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
        placeholder="Job name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full text-xs px-2 py-1 rounded font-mono"
        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
        placeholder="Schedule (e.g. */5 * * * *)"
        value={schedule}
        onChange={(e) => setSchedule(e.target.value)}
      />
      <textarea
        className="w-full text-xs px-2 py-1 rounded font-mono resize-none"
        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
        placeholder="Payload (text)"
        rows={2}
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
      />
      <div className="flex gap-1">
        <button
          onClick={() => { if (name && schedule) onSubmit({ label: name, schedule, task: payload }); }}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium cursor-pointer hover:opacity-80"
          style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
        >
          <Save className="w-3 h-3" /> Create
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium cursor-pointer hover:opacity-80"
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}
        >
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Skills Install Panel ────────────────────────────────────────────────

function SkillInstallPanel({ onInstall, onClose }: { onInstall: (name: string) => Promise<void>; onClose: () => void }) {
  const [skillName, setSkillName] = useState('');
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInstall = useCallback(async () => {
    const name = skillName.trim();
    if (!name) return;
    setInstalling(true);
    setError(null);
    setSuccess(false);
    try {
      await onInstall(name);
      setSuccess(true);
      setSkillName('');
      setTimeout(onClose, 1200);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setInstalling(false);
    }
  }, [skillName, onInstall, onClose]);

  return (
    <div
      className="mt-2 p-2 rounded-md space-y-2"
      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Install from ClawHub</div>
      <input
        className="w-full text-xs px-2 py-1 rounded font-mono"
        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
        placeholder="Skill name (e.g. github)"
        value={skillName}
        onChange={(e) => setSkillName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleInstall(); if (e.key === 'Escape') onClose(); }}
        autoFocus
      />
      {error && (
        <div className="text-[10px] px-1" style={{ color: 'var(--danger)' }}>Error: {error}</div>
      )}
      {success && (
        <div className="text-[10px] px-1" style={{ color: '#22c55e' }}>✓ Installed successfully</div>
      )}
      <div className="flex gap-1">
        <button
          onClick={handleInstall}
          disabled={installing || !skillName.trim()}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium cursor-pointer hover:opacity-80 disabled:opacity-40"
          style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
        >
          <Download className="w-3 h-3" /> {installing ? 'Installing…' : 'Install'}
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium cursor-pointer hover:opacity-80"
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}
        >
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

// ─── AgentsTab ───────────────────────────────────────────────────────────

export function AgentsTab() {
  const { files, refreshAgentFiles, getFileContent } = useAgentFiles();
  const { tools, refreshTools } = useTools();
  const { skills, refreshSkills } = useSkills();
  const { jobs, refreshCron } = useCron();
  const saveAgentFile = useGatewayStore((s) => s.saveAgentFile);
  const runCronJobAction = useGatewayStore((s) => s.runCronJob);
  const updateCronJobAction = useGatewayStore((s) => s.updateCronJob);
  const addCronJobAction = useGatewayStore((s) => s.addCronJob);
  const client = useGatewayStore((s) => s.client);

  const [viewingFile, setViewingFile] = useState<{ path: string; content: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showNewCron, setShowNewCron] = useState(false);
  const [showInstallSkill, setShowInstallSkill] = useState(false);
  const [updatingSkill, setUpdatingSkill] = useState<string | null>(null);

  useEffect(() => {
    refreshAgentFiles();
    refreshTools();
    refreshSkills();
    refreshCron();
  }, [refreshAgentFiles, refreshTools, refreshSkills, refreshCron]);

  const handleFileClick = useCallback(async (path: string) => {
    if (viewingFile?.path === path) {
      setViewingFile(null);
      setEditing(false);
      return;
    }
    const content = await getFileContent(path);
    setViewingFile({ path, content: content ?? '(empty)' });
    setEditing(false);
  }, [viewingFile, getFileContent]);

  const handleEdit = useCallback(() => {
    if (!viewingFile) return;
    setEditContent(viewingFile.content);
    setEditing(true);
  }, [viewingFile]);

  const handleSave = useCallback(async () => {
    if (!viewingFile) return;
    setSaving(true);
    try {
      await saveAgentFile(viewingFile.path, editContent);
      setViewingFile({ path: viewingFile.path, content: editContent });
      setEditing(false);
    } catch {
      // Graceful
    } finally {
      setSaving(false);
    }
  }, [viewingFile, editContent, saveAgentFile]);

  const handleCancelEdit = useCallback(() => {
    setEditing(false);
    setEditContent('');
  }, []);

  const handleRunCron = useCallback(async (jobId: string) => {
    try { await runCronJobAction(jobId); } catch { /* graceful */ }
  }, [runCronJobAction]);

  const handleToggleCron = useCallback(async (jobId: string, currentEnabled: boolean) => {
    try { await updateCronJobAction(jobId, { enabled: !currentEnabled }); } catch { /* graceful */ }
  }, [updateCronJobAction]);

  const handleAddCron = useCallback(async (job: Record<string, unknown>) => {
    try {
      await addCronJobAction(job);
      setShowNewCron(false);
    } catch { /* graceful */ }
  }, [addCronJobAction]);

  const handleInstallSkill = useCallback(async (name: string) => {
    if (!client) throw new Error('Not connected');
    await client.skillsInstall({ name });
    await refreshSkills();
  }, [client, refreshSkills]);

  const handleUpdateSkill = useCallback(async (name: string) => {
    if (!client) return;
    setUpdatingSkill(name);
    try {
      await client.skillsUpdate({ name });
      await refreshSkills();
    } catch { /* graceful */ } finally {
      setUpdatingSkill(null);
    }
  }, [client, refreshSkills]);

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
              <div className="mt-1">
                {/* Action bar */}
                <div className="flex gap-1 mb-1">
                  {!editing ? (
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] cursor-pointer hover:opacity-80"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--corgi-orange)' }}
                    >
                      <Pencil className="w-2.5 h-2.5" /> Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] cursor-pointer hover:opacity-80"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
                      >
                        <Save className="w-2.5 h-2.5" /> {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] cursor-pointer hover:opacity-80"
                        style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}
                      >
                        <X className="w-2.5 h-2.5" /> Cancel
                      </button>
                    </>
                  )}
                </div>
                {editing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full text-[10px] p-2 rounded-md font-mono resize-none"
                    style={{
                      background: 'var(--bg-primary)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--corgi-orange)',
                      minHeight: 120,
                      maxHeight: 300,
                    }}
                    rows={10}
                  />
                ) : (
                  <pre
                    className="text-[10px] p-2 rounded-md overflow-x-auto max-h-48 overflow-y-auto"
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                  >
                    {viewingFile.content}
                  </pre>
                )}
              </div>
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
          <div key={s.name} className="flex items-center gap-1.5 text-xs py-1 px-2">
            <span className="truncate flex-1" style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
            {s.description && (
              <span className="text-[9px] truncate max-w-[80px] hidden" style={{ color: 'var(--text-muted)' }}>{s.description}</span>
            )}
            <button
              onClick={() => handleUpdateSkill(s.name)}
              disabled={updatingSkill === s.name}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] cursor-pointer hover:opacity-80 disabled:opacity-40 shrink-0"
              style={{ background: 'var(--bg-primary)', color: 'var(--corgi-orange)', border: '1px solid var(--border-subtle)' }}
              title="Update skill"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${updatingSkill === s.name ? 'animate-spin' : ''}`} />
              {updatingSkill === s.name ? '…' : 'Update'}
            </button>
          </div>
        ))}
        {skills.length === 0 && <div className="text-xs py-2 px-2" style={{ color: 'var(--text-muted)' }}>No skills installed</div>}

        {/* Install skill */}
        {showInstallSkill ? (
          <SkillInstallPanel
            onInstall={handleInstallSkill}
            onClose={() => setShowInstallSkill(false)}
          />
        ) : (
          <button
            onClick={() => setShowInstallSkill(true)}
            className="flex items-center gap-1 w-full mt-1 px-2 py-1.5 rounded-md text-[10px] cursor-pointer hover:opacity-80"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--corgi-orange)' }}
          >
            <Download className="w-3 h-3" /> Install Skill
          </button>
        )}
      </CollapsibleSection>

      {/* Cron Jobs */}
      <CollapsibleSection title="Cron Jobs" icon={Clock} count={jobs.length}>
        {jobs.map((j) => (
          <div key={j.id} className="flex items-center gap-1.5 text-xs py-1 px-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: j.enabled ? 'var(--success)' : 'var(--text-muted)' }} />
            <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{j.label ?? j.id}</span>
            <span className="font-mono text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>{j.schedule}</span>
            <div className="ml-auto flex gap-1 shrink-0">
              <button
                onClick={() => handleRunCron(j.id)}
                className="p-0.5 rounded cursor-pointer hover:opacity-80"
                style={{ color: 'var(--corgi-orange)' }}
                title="Run Now"
              >
                <Play className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleToggleCron(j.id, j.enabled)}
                className="p-0.5 rounded cursor-pointer hover:opacity-80"
                style={{ color: j.enabled ? 'var(--success)' : 'var(--text-muted)' }}
                title={j.enabled ? 'Disable' : 'Enable'}
              >
                <Power className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {jobs.length === 0 && <div className="text-xs py-2 px-2" style={{ color: 'var(--text-muted)' }}>No cron jobs</div>}

        {/* New Job */}
        {showNewCron ? (
          <NewCronJobForm onSubmit={handleAddCron} onCancel={() => setShowNewCron(false)} />
        ) : (
          <button
            onClick={() => setShowNewCron(true)}
            className="flex items-center gap-1 w-full mt-1 px-2 py-1.5 rounded-md text-[10px] cursor-pointer hover:opacity-80"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--corgi-orange)' }}
          >
            <Plus className="w-3 h-3" /> New Job
          </button>
        )}
      </CollapsibleSection>
    </div>
  );
}
