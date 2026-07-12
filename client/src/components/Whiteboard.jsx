import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';

export default function Whiteboard({ group, socket, joined }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#aeff00'); 
  const [lineWidth, setLineWidth] = useState(4);
  const localHistoryRef = useRef([]);

  useEffect(() => {
    if (!socket || !joined) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const handleIncomingDraw = (strokeData) => {
      localHistoryRef.current.push(strokeData);
      drawStroke(strokeData);
    };

    const handleIncomingClearBoard = () => {
      localHistoryRef.current = [];
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleWhiteboardHistory = (strokes) => {
      localHistoryRef.current = strokes;
      redrawAll();
    };

    const drawStroke = (strokeData) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (strokeData.type === 'start') {
        ctx.beginPath();
        ctx.moveTo(strokeData.xPercent * canvas.width, strokeData.yPercent * canvas.height);
        ctx.strokeStyle = strokeData.color;
        ctx.lineWidth = strokeData.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else if (strokeData.type === 'draw') {
        ctx.lineTo(strokeData.xPercent * canvas.width, strokeData.yPercent * canvas.height);
        ctx.stroke();
      }
    };

    const redrawAll = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      localHistoryRef.current.forEach(stroke => drawStroke(stroke));
    };

    const handleResize = () => {
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width || 600;
      canvas.height = rect.height || 450;
      redrawAll();
    };

    // Initialize dimensions
    handleResize();

    // Use ResizeObserver for responsive layout changes (like toggling sidebars)
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(parent);

    socket.on('incomingDraw', handleIncomingDraw);
    socket.on('incomingClearBoard', handleIncomingClearBoard);
    socket.on('whiteboardHistory', handleWhiteboardHistory);

    // Request initial history refresh in case we joined late
    socket.emit('joinMeeting', { groupId: group.id || group._id, student: null });

    return () => {
      resizeObserver.disconnect();
      socket.off('incomingDraw', handleIncomingDraw);
      socket.off('incomingClearBoard', handleIncomingClearBoard);
      socket.off('whiteboardHistory', handleWhiteboardHistory);
    };
  }, [socket, joined, group.id, group._id]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPercent = x / rect.width;
    const yPercent = y / rect.height;

    const strokeData = { type: 'start', xPercent, yPercent, color, lineWidth };
    localHistoryRef.current.push(strokeData);

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(xPercent * canvas.width, yPercent * canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);

    if (socket) {
      socket.emit('draw', {
        groupId: group.id || group._id,
        strokeData
      });
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPercent = x / rect.width;
    const yPercent = y / rect.height;

    const strokeData = { type: 'draw', xPercent, yPercent };
    localHistoryRef.current.push(strokeData);

    const ctx = canvas.getContext('2d');
    ctx.lineTo(xPercent * canvas.width, yPercent * canvas.height);
    ctx.stroke();

    if (socket) {
      socket.emit('draw', {
        groupId: group.id || group._id,
        strokeData
      });
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    localHistoryRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
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
