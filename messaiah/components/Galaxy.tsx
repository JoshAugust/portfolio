import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Contact, ContactRole } from '../types';

// Simple physics simulation helper
interface Node extends Contact {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const Galaxy: React.FC = () => {
  const { contacts, user } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const animationRef = useRef<number>(0);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  useEffect(() => {
    // Initialize nodes with random positions
    const newNodes: Node[] = contacts.map(c => ({
      ...c,
      x: Math.random() * 800,
      y: Math.random() * 600,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    }));
    // Add User as central node
    if (user) {
        newNodes.push({
            id: 'user-me',
            name: 'You',
            role: user.title,
            company: 'Current',
            type: 'User' as any,
            influenceScore: 100,
            notes: '',
            lastContactDate: '',
            avatarSeed: 0,
            connectionStrength: 100,
            discoveryScore: 100,
            careerFit: 100,
            x: 400,
            y: 300,
            vx: 0,
            vy: 0
        })
    }
    setNodes(newNodes);
  }, [contacts, user]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size properly
    const resize = () => {
        const parent = canvas.parentElement;
        if(parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const center = { x: width/2, y: height/2 };

      // Physics update
      nodes.forEach((node, i) => {
        if (node.id === 'user-me') {
            node.x = center.x;
            node.y = center.y;
            return;
        }

        // Gravitate towards center
        const dx = center.x - node.x;
        const dy = center.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Different layers based on Role
        let targetDist = 150;
        if (node.type === ContactRole.SPONSOR) targetDist = 100;
        else if (node.type === ContactRole.MENTOR) targetDist = 200;
        else targetDist = 300;

        const force = (dist - targetDist) * 0.001;
        
        node.vx += dx * force;
        node.vy += dy * force;

        // Repulsion
        nodes.forEach((other, j) => {
          if (i === j) return;
          const dx2 = node.x - other.x;
          const dy2 = node.y - other.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < 80) {
            const repulse = (80 - dist2) * 0.005;
            node.vx += (dx2 / dist2) * repulse;
            node.vy += (dy2 / dist2) * repulse;
          }
        });

        // Damping
        node.vx *= 0.95;
        node.vy *= 0.95;

        node.x += node.vx;
        node.y += node.vy;
      });

      // Draw Connections
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.2)';
      ctx.lineWidth = 1;
      nodes.forEach(node => {
          if (node.id !== 'user-me') {
              const me = nodes.find(n => n.id === 'user-me');
              if (me) {
                  ctx.beginPath();
                  ctx.moveTo(node.x, node.y);
                  ctx.lineTo(me.x, me.y);
                  ctx.stroke();
              }
          }
      });

      // Draw Nodes
      nodes.forEach(node => {
        const isSponsor = node.type === ContactRole.SPONSOR;
        const isMe = node.id === 'user-me';
        
        // Glow for Sponsors
        if (isSponsor) {
           const gradient = ctx.createRadialGradient(node.x, node.y, 5, node.x, node.y, 30);
           gradient.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
           gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
           ctx.fillStyle = gradient;
           ctx.beginPath();
           ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
           ctx.fill();
        }

        ctx.beginPath();
        const radius = isMe ? 15 : isSponsor ? 12 : 8;
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        
        if (isMe) ctx.fillStyle = '#6366f1'; // Indigo
        else if (isSponsor) ctx.fillStyle = '#f59e0b'; // Amber
        else if (node.type === ContactRole.MENTOR) ctx.fillStyle = '#10b981'; // Emerald
        else ctx.fillStyle = '#64748b'; // Slate

        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Labels
        if (isSponsor || isMe || node === hoveredNode) {
          ctx.fillStyle = '#f8fafc';
          ctx.font = isMe ? 'bold 12px Inter' : '10px Inter';
          ctx.textAlign = 'center';
          ctx.fillText(node.name, node.x, node.y + radius + 15);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [nodes]);

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white">The Galaxy</h2>
        <p className="text-slate-400 text-sm">Visualizing your sphere of influence.</p>
      </div>
      <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden shadow-inner shadow-black/50">
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full block cursor-grab active:cursor-grabbing"
        />
        <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur p-3 rounded-lg border border-slate-700 text-xs text-slate-300">
            <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Sponsor (High Leverage)</div>
            <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Mentor</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-500"></span> Peer/Other</div>
        </div>
      </div>
    </div>
  );
};

export default Galaxy;