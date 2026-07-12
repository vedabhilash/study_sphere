import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';

export default function Whiteboard({ group, socket, joined }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#aeff00'); 
  const [lineWidth, setLineWidth] = useState(4);

  useEffect(() => {
    if (!socket || !joined) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on client bounds
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 600;
    canvas.height = rect.height || 450;

    // Ensure line joins are rounded for smooth strokes
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const handleIncomingDraw = (strokeData) => {
      const c = canvasRef.current;
      if (!c) return;
      const context = c.getContext('2d');
      if (strokeData.type === 'start') {
        context.beginPath();
        context.moveTo(strokeData.x, strokeData.y);
        context.strokeStyle = strokeData.color;
        context.lineWidth = strokeData.lineWidth;
        context.lineCap = 'round';
        context.lineJoin = 'round';
      } else if (strokeData.type === 'draw') {
        context.lineTo(strokeData.x, strokeData.y);
        context.stroke();
      }
    };

    const handleIncomingClearBoard = () => {
      const c = canvasRef.current;
      if (!c) return;
      const context = c.getContext('2d');
      context.clearRect(0, 0, c.width, c.height);
    };

    socket.on('incomingDraw', handleIncomingDraw);
    socket.on('incomingClearBoard', handleIncomingClearBoard);

    return () => {
      socket.off('incomingDraw', handleIncomingDraw);
      socket.off('incomingClearBoard', handleIncomingClearBoard);
    };
  }, [socket, joined]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);

    if (socket) {
      socket.emit('draw', {
        groupId: group.id || group._id,
        strokeData: { type: 'start', x, y, color, lineWidth }
      });
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();

    if (socket) {
      socket.emit('draw', {
        groupId: group.id || group._id,
        strokeData: { type: 'draw', x, y }
      });
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (socket) {
      socket.emit('clearBoard', { groupId: group.id || group._id });
    }
  };

  return (
    <div className="whiteboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', height: '100%' }}>
      <div className="whiteboard-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#121212', padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <span>Color:</span>
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)} 
              style={{ background: 'none', border: 'none', width: '28px', height: '28px', cursor: 'pointer' }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <span>Size:</span>
            <input 
              type="range" 
              min="2" 
              max="20" 
              value={lineWidth} 
              onChange={(e) => setLineWidth(parseInt(e.target.value))} 
              style={{ width: '80px', accentColor: '#ffffff' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lineWidth}px</span>
          </label>
        </div>
        <button onClick={clearCanvas} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)' }}>
          <Trash2 size={14} />
          <span>Clear Board</span>
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', border: '1px solid var(--border-color)', borderRadius: '4px', background: '#0a0a0a', minHeight: '350px' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
        />
      </div>
    </div>
  );
}
