import React from 'react';
import { Video, VideoOff, Mic, MicOff, Monitor, PhoneOff, Edit3, Trash2, Award } from 'lucide-react';

export default function VirtualRoom({ group, currentStudent, allStudents, socket }) {
  // Video and Mic States
  const [micOn, setMicOn] = React.useState(true);
  const [videoOn, setVideoOn] = React.useState(true);
  const [sharingScreen, setSharingScreen] = React.useState(false);
  const [activeSpeaker, setActiveSpeaker] = React.useState(null);

  const localVideoRef = React.useRef(null);
  const screenVideoRef = React.useRef(null);
  const [localStream, setLocalStream] = React.useState(null);
  const [screenStream, setScreenStream] = React.useState(null);

  // WebRTC States
  const peerConnections = React.useRef({});
  const remoteStreams = React.useRef({});
  const [remoteVideoStreams, setRemoteVideoStreams] = React.useState({});

  // Whiteboard Canvas States
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [color, setColor] = React.useState('#6366f1'); // Default Indigo
  const [lineWidth, setLineWidth] = React.useState(4);

  // Get other group members
  const otherMembers = React.useMemo(() => {
    return group.members
      .filter(id => String(id) !== String(currentStudent.id))
      .map(id => allStudents.find(s => String(s.id) === String(id)))
      .filter(Boolean);
  }, [group.members, allStudents, currentStudent.id]);

  // Periodic active speaker simulator
  React.useEffect(() => {
    const speakers = [currentStudent.name, ...otherMembers.map(m => m.name)];
    
    const interval = setInterval(() => {
      // 30% chance user is speaking, 40% chance someone else is speaking, 30% silence
      const rand = Math.random();
      if (rand < 0.3) {
        setActiveSpeaker(null);
      } else {
        const speaker = speakers[Math.floor(Math.random() * speakers.length)];
        setActiveSpeaker(speaker);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [otherMembers, currentStudent.name]);

  // Handle local camera stream
  React.useEffect(() => {
    let activeStream = null;

    async function startCamera() {
      if (videoOn && !sharingScreen) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          setLocalStream(stream);
          activeStream = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing camera: ", err);
        }
      } else {
        setLocalStream(null);
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoOn, sharingScreen]);

  // Bind local stream to video element when it changes
  React.useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handle local screen sharing stream
  React.useEffect(() => {
    let activeStream = null;

    async function startScreenShare() {
      if (sharingScreen) {
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          setScreenStream(stream);
          activeStream = stream;
          if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = stream;
          }
          // Listen for stop sharing from browser UI
          stream.getVideoTracks()[0].onended = () => {
            setSharingScreen(false);
          };
        } catch (err) {
          console.error("Error sharing screen: ", err);
          setSharingScreen(false);
        }
      } else {
        setScreenStream(null);
      }
    }

    startScreenShare();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [sharingScreen]);

  // Bind screen stream to video element when it becomes active
  React.useEffect(() => {
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // WebRTC Peer Connection Manager
  React.useEffect(() => {
    if (!socket) return;

    const myId = currentStudent.id;
    const currentActiveStream = sharingScreen ? screenStream : localStream;

    // Helper to get or create RTCPeerConnection for a member
    function getOrCreatePeerConnection(memberId) {
      if (peerConnections.current[memberId]) {
        return peerConnections.current[memberId];
      }

      console.log(`Creating RTCPeerConnection for member: ${memberId}`);
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Track candidate queue
      pc.iceCandidatesQueue = [];

      // Add active stream tracks to this peer connection if available
      if (currentActiveStream) {
        currentActiveStream.getTracks().forEach(track => {
          pc.addTrack(track, currentActiveStream);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('videoCallSignal', {
            targetId: memberId,
            senderId: myId,
            signal: { type: 'candidate', candidate: event.candidate }
          });
        }
      };

      // Handle remote tracks
      pc.ontrack = (event) => {
        console.log(`Received remote track from ${memberId}:`, event.streams);
        const stream = event.streams[0] || new MediaStream([event.track]);
        remoteStreams.current[memberId] = stream;
        setRemoteVideoStreams(prev => ({
          ...prev,
          [memberId]: stream
        }));
      };

      peerConnections.current[memberId] = pc;
      return pc;
    }

    // Send reconnect request to members with smaller ID so they initiate a new call
    otherMembers.forEach(member => {
      const memberId = member.id;
      if (String(myId) > String(memberId)) {
        console.log(`Requesting smaller ID member ${memberId} to initiate WebRTC call`);
        socket.emit('videoCallSignal', {
          targetId: memberId,
          senderId: myId,
          signal: { type: 'reconnect' }
        });
      }
    });

    // Alphabetically smaller ID initiates the call
    otherMembers.forEach(async (member) => {
      const memberId = member.id;
      const pc = getOrCreatePeerConnection(memberId);

      if (String(myId) < String(memberId)) {
        console.log(`We are initiating call to ${memberId}`);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('videoCallSignal', {
            targetId: memberId,
            senderId: myId,
            signal: { type: 'offer', sdp: offer }
          });
        } catch (err) {
          console.error("Error creating offer: ", err);
        }
      }
    });

    // Listen for incoming signals
    const handleIncomingSignal = async ({ senderId, signal }) => {
      if (!otherMembers.some(m => String(m.id) === String(senderId))) return;

      try {
        if (signal.type === 'reconnect') {
          console.log(`Received reconnect request from ${senderId}`);
          if (peerConnections.current[senderId]) {
            console.log(`Closing existing peer connection for ${senderId} due to reconnect request`);
            peerConnections.current[senderId].close();
            delete peerConnections.current[senderId];
          }
          
          // Initiate call to the sender since we received a reconnect request
          if (String(myId) < String(senderId)) {
            console.log(`Initiating call to ${senderId} after reconnect request`);
            const pc = getOrCreatePeerConnection(senderId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('videoCallSignal', {
              targetId: senderId,
              senderId: myId,
              signal: { type: 'offer', sdp: offer }
            });
          }
          return;
        }

        if (signal.type === 'offer') {
          console.log(`Received offer from ${senderId}`);
          
          // Reset existing connection ONLY if it has already been established (has a remote description).
          // If it was just created (e.g., by a candidate signal) and doesn't have a remote description,
          // do NOT close/delete it so we do not discard the queued ICE candidates.
          let pc = peerConnections.current[senderId];
          if (pc && pc.remoteDescription) {
            console.log(`Closing existing configured peer connection for ${senderId} due to incoming offer`);
            pc.close();
            delete peerConnections.current[senderId];
            pc = null;
          }

          if (!pc) {
            pc = getOrCreatePeerConnection(senderId);
          }
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          
          // Apply queued candidates
          if (pc.iceCandidatesQueue && pc.iceCandidatesQueue.length > 0) {
            for (const cand of pc.iceCandidatesQueue) {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
            pc.iceCandidatesQueue = [];
          }
          
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('videoCallSignal', {
            targetId: senderId,
            senderId: myId,
            signal: { type: 'answer', sdp: answer }
          });
        } else {
          // answer or candidate signal requires connection to exist
          const pc = getOrCreatePeerConnection(senderId);

          if (signal.type === 'answer') {
            console.log(`Received answer from ${senderId}`);
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            
            // Apply queued candidates
            if (pc.iceCandidatesQueue && pc.iceCandidatesQueue.length > 0) {
              for (const cand of pc.iceCandidatesQueue) {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              }
              pc.iceCandidatesQueue = [];
            }
          } else if (signal.type === 'candidate') {
            console.log(`Received candidate from ${senderId}`);
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } else {
              pc.iceCandidatesQueue.push(signal.candidate);
            }
          }
        }
      } catch (err) {
        console.error("Error handling WebRTC signal: ", err);
      }
    };

    socket.on('incomingVideoCallSignal', handleIncomingSignal);

    return () => {
      socket.off('incomingVideoCallSignal', handleIncomingSignal);
      // Clean up connections
      Object.keys(peerConnections.current).forEach(memberId => {
        console.log(`Closing peer connection to ${memberId}`);
        peerConnections.current[memberId].close();
        delete peerConnections.current[memberId];
      });
      remoteStreams.current = {};
      setRemoteVideoStreams({});
    };
  }, [socket, localStream, screenStream, sharingScreen, otherMembers]);

  // Whiteboard Drawing Logic
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on client bounding box
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 400;
    canvas.height = rect.height || 350;

    // Draw initial welcome text on canvas
    ctx.font = '14px Outfit, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Start drawing to collaborate on code or equations...', 20, 30);
  }, []);

  // Listen for WebSocket whiteboard relays
  React.useEffect(() => {
    if (!socket) return;

    const handleIncomingDraw = (strokeData) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (strokeData.type === 'start') {
        ctx.beginPath();
        ctx.moveTo(strokeData.x, strokeData.y);
        ctx.strokeStyle = strokeData.color;
        ctx.lineWidth = strokeData.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else if (strokeData.type === 'draw') {
        ctx.lineTo(strokeData.x, strokeData.y);
        ctx.stroke();
      }
    };

    const handleIncomingClearBoard = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    socket.on('incomingDraw', handleIncomingDraw);
    socket.on('incomingClearBoard', handleIncomingClearBoard);

    return () => {
      socket.off('incomingDraw', handleIncomingDraw);
      socket.off('incomingClearBoard', handleIncomingClearBoard);
    };
  }, [socket]);

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
        groupId: group.id,
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
        groupId: group.id,
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
      socket.emit('clearBoard', { groupId: group.id });
    }
  };

  return (
    <div className="virtual-room-container">
      {/* Left Column: Video Grids and Control Panel */}
      <div className="video-grid-column">
        <div className="video-tiles-grid">
          
          {/* Main Content Area: Screen Share or User Video */}
          {sharingScreen ? (
            <div className="video-tile" style={{ gridColumn: 'span 2', background: '#090d16', padding: 0, overflow: 'hidden', position: 'relative' }}>
              <video 
                ref={screenVideoRef}
                autoPlay 
                playsInline 
                muted 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
              <div className="video-tile-name">
                <span className="status-dot online" />
                <span>Your Screen Share</span>
              </div>
            </div>
          ) : (
            /* User Video Tile */
            <div className={`video-tile ${activeSpeaker === currentStudent.name ? 'speaking' : ''}`} style={{ overflow: 'hidden' }}>
              {videoOn ? (
                <div className="video-tile-placeholder" style={{ padding: 0, overflow: 'hidden', position: 'relative', width: '100%', height: '100%' }}>
                  <video 
                    ref={localVideoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <div style={{ position: 'absolute', bottom: '2rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', color: 'white', zIndex: 5 }}>
                    Camera Active
                  </div>
                </div>
              ) : (
                <div className="video-tile-placeholder" style={{ opacity: 0.5 }}>
                  <VideoOff size={32} />
                  <span style={{ fontSize: '0.85rem' }}>Camera Off</span>
                </div>
              )}
              
              <div className="video-tile-name" style={{ zIndex: 10 }}>
                {micOn ? (
                  <Mic size={12} style={{ color: 'var(--success)' }} />
                ) : (
                  <MicOff size={12} style={{ color: 'var(--danger)' }} />
                )}
                <span>{currentStudent.name} (You)</span>
              </div>
            </div>
          )}

          {/* Render Other Members Tiles */}
          {!sharingScreen && otherMembers.map(member => {
            const isSpeaking = activeSpeaker === member.name;
            // Simulated mic status (some muted, some speaking)
            const isMuted = member.id === 's3'; // quiet Marcus
            
            const hasRemoteStream = remoteVideoStreams[member.id] || remoteVideoStreams[String(member.id)];
            const remoteStream = remoteVideoStreams[member.id] || remoteVideoStreams[String(member.id)];

            return (
              <div key={member.id} className={`video-tile ${isSpeaking ? 'speaking' : ''}`} style={{ overflow: 'hidden' }}>
                {hasRemoteStream ? (
                  <div className="video-tile-placeholder" style={{ padding: 0, overflow: 'hidden', position: 'relative', width: '100%', height: '100%' }}>
                    <video 
                      ref={el => {
                        if (el && el.srcObject !== remoteStream) {
                          el.srcObject = remoteStream;
                        }
                      }}
                      autoPlay 
                      playsInline 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                ) : (
                  <div className="video-tile-placeholder">
                    <div className="video-avatar">
                      {member.avatar}
                    </div>
                    {isSpeaking && (
                      <div style={{ display: 'flex', gap: '3px', marginTop: '0.5rem' }}>
                        <span className="wave-bar" style={{ animationDelay: '0.1s' }} />
                        <span className="wave-bar" style={{ animationDelay: '0.3s' }} />
                        <span className="wave-bar" style={{ animationDelay: '0.5s' }} />
                      </div>
                    )}
                  </div>
                )}

                <div className="video-tile-name" style={{ zIndex: 10 }}>
                  {isMuted ? (
                    <MicOff size={12} style={{ color: 'var(--danger)' }} />
                  ) : (
                    <Mic size={12} style={{ color: 'var(--success)' }} />
                  )}
                  <span>{member.name}</span>
                </div>
              </div>
            );
          })}

          {/* Fill grid if alone */}
          {otherMembers.length === 0 && !sharingScreen && (
            <div className="video-tile" style={{ opacity: 0.3 }}>
              <div className="video-tile-placeholder">
                <Video size={40} />
                <span style={{ fontSize: '0.85rem' }}>Waiting for partners...</span>
              </div>
            </div>
          )}
        </div>

        {/* Video Control Bar */}
        <div className="video-controls">
          <button 
            onClick={() => setMicOn(!micOn)} 
            className={`btn ${micOn ? 'btn-secondary' : 'btn-danger'}`}
            style={{ width: '40px', padding: 0 }}
            title={micOn ? 'Mute Mic' : 'Unmute Mic'}
          >
            {micOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          
          <button 
            onClick={() => setVideoOn(!videoOn)} 
            className={`btn ${videoOn ? 'btn-secondary' : 'btn-danger'}`}
            style={{ width: '40px', padding: 0 }}
            title={videoOn ? 'Turn Video Off' : 'Turn Video On'}
          >
            {videoOn ? <Video size={18} /> : <VideoOff size={18} />}
          </button>

          <button 
            onClick={() => setSharingScreen(!sharingScreen)} 
            className={`btn ${sharingScreen ? 'btn-accent' : 'btn-secondary'}`}
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <Monitor size={18} />
            <span>{sharingScreen ? 'Stop Sharing' : 'Share Screen'}</span>
          </button>

          <div style={{ borderLeft: '1px solid var(--border-glass)', margin: '0 0.5rem' }} />

          <button className="btn btn-danger" style={{ display: 'flex', gap: '0.5rem' }}>
            <PhoneOff size={18} />
            <span>Leave Call</span>
          </button>
        </div>
      </div>

      {/* Right Column: Collaborative Whiteboard */}
      <div className="whiteboard-column">
        <div className="whiteboard-header">
          <h4>
            <Edit3 size={18} className="text-primary" />
            <span>Interactive Whiteboard</span>
          </h4>
          <button onClick={clearCanvas} className="btn btn-secondary btn-icon" title="Clear Canvas">
            <Trash2 size={14} />
          </button>
        </div>

        {/* Whiteboard Controls */}
        <div className="whiteboard-tools">
          {/* Color Dots */}
          <div style={{ display: 'flex', gap: '0.35rem', marginRight: '0.5rem' }}>
            {['#6366f1', '#e11d48', '#10b981', '#f59e0b', '#090d16'].map(c => (
              <span 
                key={c}
                onClick={() => setColor(c)}
                className={`color-dot ${color === c ? 'active' : ''}`}
                style={{ 
                  backgroundColor: c, 
                  border: c === '#090d16' ? '1px solid var(--border-glass)' : 'none' 
                }}
              />
            ))}
          </div>

          {/* Stroke Width Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Size:</span>
            <input 
              type="range" 
              min="2" 
              max="12" 
              value={lineWidth} 
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              style={{ flex: 1, height: '4px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{lineWidth}px</span>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="whiteboard-canvas"
          />
        </div>
      </div>

      <style>{`
        .wave-bar {
          width: 3px;
          height: 12px;
          background: var(--primary);
          border-radius: 2px;
          animation: mic-wave 0.6s ease infinite alternate;
        }
        @keyframes mic-wave {
          0% { height: 4px; }
          100% { height: 16px; }
        }
      `}</style>
    </div>
  );
}
