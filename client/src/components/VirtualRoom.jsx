import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Monitor, PhoneOff, Edit3, Trash2, 
  MessageSquare, Users, Hand, Smile, Layout, Settings, Crown, 
  VolumeX, UserMinus, Lock, Unlock, Wifi, X, Send, CornerDownRight, 
  AlertCircle, HelpCircle, Check
} from 'lucide-react';
import axios from 'axios';

export default function VirtualRoom({ group, currentStudent, allStudents, socket }) {
  // Connection and Session states
  const [joined, setJoined] = useState(false);
  const [meetingLocked, setMeetingLocked] = useState(false);
  const [isLockedByAdmin, setIsLockedByAdmin] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [permissionError, setPermissionError] = useState(null);

  // Device Controls
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [raisedHand, setRaisedHand] = useState(false);
  
  // Media streams
  const localVideoRef = useRef(null);
  const lobbyVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // WebRTC
  const peerConnections = useRef({});
  const remoteStreams = useRef({});
  const [remoteVideoStreams, setRemoteVideoStreams] = useState({});

  // Active Participants List (syncs with Socket.io)
  const [participants, setParticipants] = useState({});
  const [activeSpeaker, setActiveSpeaker] = useState(null);

  // Layout & UI
  const [layout, setLayout] = useState('gallery'); // 'gallery' | 'speaker' | 'screenshare'
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('chat'); // 'chat' | 'participants'
  const [reactions, setReactions] = useState([]);

  // Meeting Chat
  const [inMeetingMessages, setInMeetingMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  // Collaborative Whiteboard Canvas States
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#6366f1'); 
  const [lineWidth, setLineWidth] = useState(4);

  // Admin Check
  const isAdmin = useMemo(() => {
    return group?.admin?._id === currentStudent.id || group?.admin === currentStudent.id;
  }, [group, currentStudent]);

  // Sync all students detail lookup
  const studentsMap = useMemo(() => {
    const map = {};
    allStudents.forEach(s => {
      map[s.id] = s;
    });
    // add self
    map[currentStudent.id] = currentStudent;
    return map;
  }, [allStudents, currentStudent]);

  // Duration Timer
  useEffect(() => {
    if (!joined) {
      setMeetingDuration(0);
      return;
    }
    const timer = setInterval(() => {
      setMeetingDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [joined]);

  // Format Duration
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Setup lobby camera preview
  useEffect(() => {
    let previewStream = null;
    async function startLobbyPreview() {
      if (!joined && videoOn) {
        try {
          previewStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (lobbyVideoRef.current) {
            lobbyVideoRef.current.srcObject = previewStream;
          }
          setPermissionError(null);
        } catch (err) {
          console.error("Camera access failed in lobby preview:", err);
          setPermissionError("Could not access camera. Please check browser permissions.");
        }
      }
    }
    startLobbyPreview();
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [joined, videoOn]);

  // Handle local camera stream when meeting is joined
  useEffect(() => {
    if (!joined) return;
    let activeStream = null;

    async function startCamera() {
      if (localStream) {
        activeStream = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        return;
      }
      if (videoOn && !sharingScreen) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          
          // Apply initial mic status
          stream.getAudioTracks().forEach(track => {
            track.enabled = micOn;
          });

          setLocalStream(stream);
          activeStream = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          setPermissionError(null);
        } catch (err) {
          console.error("Camera access failed on call start:", err);
          setPermissionError("Could not access microphone/camera. Joining audio-only.");
          try {
            const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            setLocalStream(audioOnlyStream);
            activeStream = audioOnlyStream;
          } catch (audioErr) {
            console.error("Microphone access failed too:", audioErr);
          }
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
  }, [joined, videoOn, sharingScreen]);

  // Bind local stream to video element when it changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handle local screen sharing stream
  useEffect(() => {
    if (!joined) return;
    let activeStream = null;

    async function startScreenShare() {
      if (sharingScreen) {
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          setScreenStream(stream);
          activeStream = stream;
          if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = stream;
          }
          setLayout('screenshare');

          // Listen for stop sharing from browser native UI bar
          stream.getVideoTracks()[0].onended = () => {
            setSharingScreen(false);
            setLayout('gallery');
          };
        } catch (err) {
          console.error("Screen sharing failed:", err);
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
  }, [joined, sharingScreen]);

  // Bind screen stream to video element when it becomes active
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Toggle Mute Audio locally & sync
  const toggleMic = () => {
    const nextVal = !micOn;
    setMicOn(nextVal);
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = nextVal;
      });
    }
    if (socket) {
      socket.emit('meetingStatusUpdate', {
        groupId: group.id,
        studentId: currentStudent.id,
        status: { micOn: nextVal }
      });
    }
  };

  // Toggle Video locally & sync
  const toggleVideo = () => {
    const nextVal = !videoOn;
    setVideoOn(nextVal);
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = nextVal;
      });
    }
    if (socket) {
      socket.emit('meetingStatusUpdate', {
        groupId: group.id,
        studentId: currentStudent.id,
        status: { videoOn: nextVal }
      });
    }
  };

  // Toggle Hand Raise
  const toggleHandRaise = () => {
    const nextVal = !raisedHand;
    setRaisedHand(nextVal);
    if (socket) {
      socket.emit('meetingStatusUpdate', {
        groupId: group.id,
        studentId: currentStudent.id,
        status: { raisedHand: nextVal }
      });
    }
  };

  // Speaking Detection using Web Audio API
  useEffect(() => {
    if (!joined || !localStream || !micOn) {
      if (socket && joined) {
        socket.emit('meetingStatusUpdate', {
          groupId: group.id,
          studentId: currentStudent.id,
          status: { isSpeaking: false }
        });
      }
      return;
    }

    let audioContext = null;
    let analyser = null;
    let microphone = null;
    let javascriptNode = null;
    let isCurrentlySpeaking = false;

    try {
      const audioTrack = localStream.getAudioTracks()[0];
      if (!audioTrack) return;

      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
      javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;

      microphone.connect(analyser);
      analyser.connect(javascriptNode);
      javascriptNode.connect(audioContext.destination);

      javascriptNode.onaudioprocess = () => {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        let values = 0;
        const length = array.length;
        for (let i = 0; i < length; i++) {
          values += array[i];
        }
        const average = values / length;

        // If audio level is above speaking threshold
        const speaking = average > 15;
        if (speaking !== isCurrentlySpeaking) {
          isCurrentlySpeaking = speaking;
          socket.emit('meetingStatusUpdate', {
            groupId: group.id,
            studentId: currentStudent.id,
            status: { isSpeaking: speaking }
          });
          setActiveSpeaker(speaking ? currentStudent.id : null);
        }
      };
    } catch (e) {
      console.error("Audio speaking analyzer error:", e);
    }

    return () => {
      if (javascriptNode) javascriptNode.disconnect();
      if (microphone) microphone.disconnect();
      if (audioContext && audioContext.state !== 'closed') audioContext.close();
    };
  }, [joined, localStream, micOn, socket, group.id, currentStudent.id]);

  // Join Call handler
  const handleJoinCall = async () => {
    if (meetingLocked && !isAdmin) {
      alert("This meeting is locked by the Host. You cannot join.");
      return;
    }

    // Acquire local stream first!
    let activeStream = null;
    if (videoOn) {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        // Apply initial mic status
        activeStream.getAudioTracks().forEach(track => {
          track.enabled = micOn;
        });
        setLocalStream(activeStream);
        setPermissionError(null);
      } catch (err) {
        console.error("Camera access failed on call join:", err);
        setPermissionError("Could not access microphone/camera. Joining audio-only.");
        try {
          activeStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          setLocalStream(activeStream);
        } catch (audioErr) {
          console.error("Microphone access failed too:", audioErr);
        }
      }
    }

    setJoined(true);
    setParticipants({
      [currentStudent.id]: {
        id: currentStudent.id,
        name: currentStudent.name,
        avatar: currentStudent.avatar,
        micOn,
        videoOn: activeStream ? activeStream.getVideoTracks().length > 0 : false,
        raisedHand: false,
        isSpeaking: false,
        online: true
      }
    });

    if (socket) {
      // Emit join meeting presence
      socket.emit('joinMeeting', {
        groupId: group.id,
        student: {
          id: currentStudent.id,
          name: currentStudent.name,
          avatar: currentStudent.avatar,
          micOn,
          videoOn: activeStream ? activeStream.getVideoTracks().length > 0 : false
        }
      });
    }
  };

  // Leave Call handler
  const handleLeaveCall = (endForAll = false) => {
    if (socket) {
      if (endForAll && isAdmin) {
        socket.emit('meetingControl', {
          groupId: group.id,
          command: 'end'
        });
      } else {
        socket.emit('leaveMeeting', {
          groupId: group.id,
          studentId: currentStudent.id
        });
      }
    }
    resetCallState();
  };

  // Reset local states after leaving call
  const resetCallState = () => {
    setJoined(false);
    setSharingScreen(false);
    setMicOn(true);
    setVideoOn(true);
    setRaisedHand(false);
    setParticipants({});
    setInMeetingMessages([]);
    setReplyingTo(null);
    setRemoteVideoStreams({});
    remoteStreams.current = {};

    // Close all WebRTC peer connections
    Object.keys(peerConnections.current).forEach(peerId => {
      peerConnections.current[peerId].close();
      delete peerConnections.current[peerId];
    });

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
  };

  // Stable refs so WebRTC callbacks always see latest values without re-running the effect
  const localStreamRef = useRef(null);
  const sharingScreenRef = useRef(false);
  const screenStreamRef = useRef(null);
  const myIdRef = useRef(currentStudent.id);
  const groupIdRef = useRef(group.id);
  const studentsMapRef = useRef(studentsMap);
  const micOnRef = useRef(micOn);
  const videoOnRef = useRef(videoOn);
  const raisedHandRef = useRef(raisedHand);
  const currentStudentRef = useRef(currentStudent);

  // Keep all refs in sync with latest state
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { sharingScreenRef.current = sharingScreen; }, [sharingScreen]);
  useEffect(() => { screenStreamRef.current = screenStream; }, [screenStream]);
  useEffect(() => { studentsMapRef.current = studentsMap; }, [studentsMap]);
  useEffect(() => { micOnRef.current = micOn; }, [micOn]);
  useEffect(() => { videoOnRef.current = videoOn; }, [videoOn]);
  useEffect(() => { raisedHandRef.current = raisedHand; }, [raisedHand]);
  useEffect(() => { currentStudentRef.current = currentStudent; }, [currentStudent]);

  // WebRTC Peer Connection and Socket listener bindings
  // ONLY depends on socket + joined — never re-runs on state/stream changes
  useEffect(() => {
    if (!socket || !joined) return;

    const myId = myIdRef.current;

    const getActiveStream = () =>
      sharingScreenRef.current ? screenStreamRef.current : localStreamRef.current;

    // Create or return existing RTCPeerConnection for a peer
    function getOrCreatePeerConnection(memberId) {
      if (peerConnections.current[memberId]) {
        return peerConnections.current[memberId];
      }

      console.log(`[WebRTC] Creating peer connection for: ${memberId}`);
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ]
      });

      pc.iceCandidatesQueue = [];

      // Add current local tracks
      const activeStream = getActiveStream();
      if (activeStream) {
        activeStream.getTracks().forEach(track => {
          pc.addTrack(track, activeStream);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('videoCallSignal', {
            targetId: memberId,
            senderId: myId,
            signal: { type: 'candidate', candidate: event.candidate }
          });
        }
      };

      pc.ontrack = (event) => {
        console.log(`[WebRTC] Remote track received from ${memberId}`);
        const stream = event.streams[0] || new MediaStream([event.track]);
        remoteStreams.current[memberId] = stream;
        setRemoteVideoStreams(prev => ({ ...prev, [memberId]: stream }));
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] ${memberId} connection state: ${pc.connectionState}`);
      };

      peerConnections.current[memberId] = pc;
      return pc;
    }

    // Send offer to peer
    const triggerOffer = async (peerId) => {
      const pc = getOrCreatePeerConnection(peerId);
      // Don't create offer if one is already in progress
      if (pc.signalingState !== 'stable') {
        console.log(`[WebRTC] Skipping offer to ${peerId} - signalingState: ${pc.signalingState}`);
        return;
      }
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('videoCallSignal', {
          targetId: peerId,
          senderId: myId,
          signal: { type: 'offer', sdp: offer }
        });
        console.log(`[WebRTC] Offer sent to ${peerId}`);
      } catch (e) {
        console.error('[WebRTC] Offer creation failed:', e);
      }
    };

    // Handle incoming WebRTC signal
    const handleIncomingSignal = async ({ senderId, signal }) => {
      // Auto-register sender into participants if not already present
      setParticipants(prev => {
        if (prev[senderId]) return prev;
        const info = studentsMapRef.current[senderId] || {};
        console.log(`[WebRTC] Auto-adding participant from signal: ${senderId}`);
        return {
          ...prev,
          [senderId]: {
            id: senderId,
            name: info.name || 'Participant',
            avatar: info.avatar || '',
            micOn: true,
            videoOn: true,
            raisedHand: false,
            isSpeaking: false,
            online: true
          }
        };
      });

      try {
        if (signal.type === 'reconnect') {
          console.log(`[WebRTC] Reconnect request from ${senderId}`);
          const existing = peerConnections.current[senderId];
          if (existing) {
            existing.close();
            delete peerConnections.current[senderId];
          }
          // Both sides create new PC; offerer is determined by ID comparison
          if (String(myId) < String(senderId)) {
            await triggerOffer(senderId);
          }
          return;
        }

        if (signal.type === 'offer') {
          console.log(`[WebRTC] Offer received from ${senderId}`);
          let pc = peerConnections.current[senderId];
          // Close stale connection if remote description already set
          if (pc && pc.signalingState !== 'stable') {
            pc.close();
            delete peerConnections.current[senderId];
            pc = null;
          }
          if (!pc) pc = getOrCreatePeerConnection(senderId);
          
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          
          // Flush queued ICE candidates
          if (pc.iceCandidatesQueue.length > 0) {
            for (const cand of pc.iceCandidatesQueue) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.error);
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
          console.log(`[WebRTC] Answer sent to ${senderId}`);
          return;
        }

        if (signal.type === 'answer') {
          const pc = peerConnections.current[senderId];
          if (!pc) return;
          if (pc.signalingState !== 'have-local-offer') {
            console.warn(`[WebRTC] Unexpected answer from ${senderId} in state ${pc.signalingState}`);
            return;
          }
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          if (pc.iceCandidatesQueue.length > 0) {
            for (const cand of pc.iceCandidatesQueue) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.error);
            }
            pc.iceCandidatesQueue = [];
          }
          console.log(`[WebRTC] Answer set from ${senderId}`);
          return;
        }

        if (signal.type === 'candidate') {
          const pc = peerConnections.current[senderId] || getOrCreatePeerConnection(senderId);
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(console.error);
          } else {
            pc.iceCandidatesQueue.push(signal.candidate);
          }
        }
      } catch (err) {
        console.error('[WebRTC] Signal handling error:', err);
      }
    };

    // User joined meeting — add to participants and trigger offer
    const handleUserJoined = (student) => {
      console.log(`[Meeting] User joined: ${student.name}`);
      setParticipants(prev => ({
        ...prev,
        [student.id]: {
          ...student,
          micOn: student.micOn ?? true,
          videoOn: student.videoOn ?? true,
          raisedHand: false,
          isSpeaking: false,
          online: true
        }
      }));
      // Broadcast our current state to the joiner
      socket.emit('meetingStatusUpdate', {
        groupId: groupIdRef.current,
        studentId: myId,
        status: {
          name: currentStudentRef.current.name,
          avatar: currentStudentRef.current.avatar,
          micOn: micOnRef.current,
          videoOn: videoOnRef.current,
          raisedHand: raisedHandRef.current
        }
      });
      // Existing user always creates the offer to the new joiner
      triggerOffer(student.id);
    };

    const handleUserLeft = (studentId) => {
      console.log(`[Meeting] User left: ${studentId}`);
      setParticipants(prev => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
      const pc = peerConnections.current[studentId];
      if (pc) { pc.close(); delete peerConnections.current[studentId]; }
      setRemoteVideoStreams(prev => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    };

    const handleUserOffline = (studentId) => handleUserLeft(studentId);

    const handleStatusUpdate = ({ studentId, status }) => {
      setParticipants(prev => {
        const existing = prev[studentId] || {};
        const info = studentsMapRef.current[studentId] || {};
        return {
          ...prev,
          [studentId]: {
            id: studentId,
            name: existing.name || info.name || status.name || 'Participant',
            avatar: existing.avatar || info.avatar || status.avatar || '',
            micOn: true,
            videoOn: true,
            raisedHand: false,
            isSpeaking: false,
            online: true,
            ...existing,
            ...status
          }
        };
      });

      if (status.isSpeaking !== undefined) {
        setActiveSpeaker(status.isSpeaking ? studentId : prev => prev === studentId ? null : prev);
      }
    };

    const handleIncomingEmojiReaction = ({ studentId, emoji }) => {
      const name = studentsMapRef.current[studentId]?.name || 'Student';
      displayReaction(name, emoji);
    };

    const handleReceiveMeetingMessage = (msg) => {
      setInMeetingMessages(prev => [...prev, msg]);
    };

    const handleIncomingMeetingControl = ({ command, targetId, value }) => {
      if (command === 'lock') {
        setMeetingLocked(value);
      } else if (command === 'end') {
        alert('The host has ended this meeting for everyone.');
        resetCallState();
      } else if (targetId === myId) {
        if (command === 'mute') {
          setMicOn(false);
          const stream = localStreamRef.current;
          if (stream) stream.getAudioTracks().forEach(t => { t.enabled = false; });
          socket.emit('meetingStatusUpdate', {
            groupId: groupIdRef.current,
            studentId: myId,
            status: { micOn: false }
          });
          alert('You have been muted by the host.');
        } else if (command === 'remove') {
          alert('You were removed from the meeting by the host.');
          resetCallState();
        }
      }
    };

    socket.on('incomingVideoCallSignal', handleIncomingSignal);
    socket.on('meetingUserJoined', handleUserJoined);
    socket.on('meetingUserLeft', handleUserLeft);
    socket.on('meetingUserOffline', handleUserOffline);
    socket.on('meetingStatusUpdate', handleStatusUpdate);
    socket.on('incomingEmojiReaction', handleIncomingEmojiReaction);
    socket.on('receiveMeetingMessage', handleReceiveMeetingMessage);
    socket.on('incomingMeetingControl', handleIncomingMeetingControl);

    console.log('[Meeting] Socket listeners registered');

    return () => {
      socket.off('incomingVideoCallSignal', handleIncomingSignal);
      socket.off('meetingUserJoined', handleUserJoined);
      socket.off('meetingUserLeft', handleUserLeft);
      socket.off('meetingUserOffline', handleUserOffline);
      socket.off('meetingStatusUpdate', handleStatusUpdate);
      socket.off('incomingEmojiReaction', handleIncomingEmojiReaction);
      socket.off('receiveMeetingMessage', handleReceiveMeetingMessage);
      socket.off('incomingMeetingControl', handleIncomingMeetingControl);
      console.log('[Meeting] Socket listeners cleaned up');
    };
  }, [socket, joined]); // eslint-disable-line react-hooks/exhaustive-deps

  // When stream changes (e.g. user toggles camera after joining), renegotiate all existing peers
  useEffect(() => {
    if (!joined || !localStream) return;
    const peers = Object.keys(peerConnections.current);
    if (peers.length === 0) return;

    peers.forEach(async (peerId) => {
      const pc = peerConnections.current[peerId];
      if (!pc) return;
      const senders = pc.getSenders();
      senders.forEach(sender => pc.removeTrack(sender));
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
      if (pc.signalingState === 'stable') {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (socket) {
            socket.emit('videoCallSignal', {
              targetId: peerId,
              senderId: currentStudent.id,
              signal: { type: 'offer', sdp: offer }
            });
          }
        } catch (e) {
          console.error('[WebRTC] Stream renegotiation failed:', e);
        }
      }
    });
  }, [localStream]); // eslint-disable-line react-hooks/exhaustive-deps

  // Display Reaction Floating Card
  const displayReaction = (name, emoji) => {
    const id = Math.random().toString(36).substr(2, 9);
    setReactions(prev => [...prev, { id, name, emoji, left: Math.random() * 80 + 10 }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);
  };

  // Emit emoji reactions
  const sendReaction = (emoji) => {
    if (socket) {
      socket.emit('sendEmojiReaction', {
        groupId: group.id,
        studentId: currentStudent.id,
        emoji
      });
    }
    displayReaction('You', emoji);
  };

  // Send in-call chat message
  const sendMeetingChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;

    const msg = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentStudent.id,
      senderName: currentStudent.name,
      senderAvatar: currentStudent.avatar,
      text: chatInput.trim(),
      timestamp: new Date().toISOString(),
      replyTo: replyingTo ? { text: replyingTo.text, senderName: replyingTo.senderName } : null
    };

    socket.emit('sendMeetingMessage', {
      groupId: group.id,
      message: msg
    });

    setChatInput('');
    setReplyingTo(null);
  };

  // Admin Actions: Mute peer
  const adminMutePeer = (peerId) => {
    if (!isAdmin || !socket) return;
    socket.emit('meetingControl', {
      groupId: group.id,
      command: 'mute',
      targetId: peerId
    });
  };

  // Admin Actions: Kick peer
  const adminKickPeer = (peerId) => {
    if (!isAdmin || !socket) return;
    const confirmKick = window.confirm("Are you sure you want to remove this participant?");
    if (confirmKick) {
      socket.emit('meetingControl', {
        groupId: group.id,
        command: 'remove',
        targetId: peerId
      });
    }
  };

  // Admin Actions: Lock meeting room
  const adminToggleLock = () => {
    if (!isAdmin || !socket) return;
    const nextState = !meetingLocked;
    setMeetingLocked(nextState);
    socket.emit('meetingControl', {
      groupId: group.id,
      command: 'lock',
      value: nextState
    });
  };

  // Whiteboard drawing hook relays
  useEffect(() => {
    if (!socket || !joined || !showWhiteboard) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 400;
    canvas.height = rect.height || 350;

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
  }, [socket, joined, showWhiteboard]);

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

  // RENDER LOBBY / PREVIEW LOBBY
  if (!joined) {
    return (
      <div className="lobby-outer-container animate-fade-in">
        <div className="lobby-card glass-panel">
          <div className="lobby-header">
            <h3>StudySphere Meeting Setup</h3>
            <p>Prepare your audio and video settings before joining the study room.</p>
          </div>

          <div className="lobby-preview-box">
            {videoOn ? (
              <video ref={lobbyVideoRef} autoPlay playsInline muted className="lobby-preview-video" />
            ) : (
              <div className="lobby-preview-placeholder">
                <VideoOff size={48} className="text-muted" />
                <span>Video is Disabled</span>
              </div>
            )}

            {permissionError && (
              <div className="permission-alert">
                <AlertCircle size={16} />
                <span>{permissionError}</span>
              </div>
            )}
          </div>

          <div className="lobby-toggles-row">
            <button 
              onClick={() => setMicOn(!micOn)} 
              className={`btn btn-circle ${micOn ? 'btn-secondary' : 'btn-danger'}`}
              title={micOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            
            <button 
              onClick={() => setVideoOn(!videoOn)} 
              className={`btn btn-circle ${videoOn ? 'btn-secondary' : 'btn-danger'}`}
              title={videoOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
          </div>

          <div className="lobby-join-section">
            {meetingLocked && !isAdmin ? (
              <div className="meeting-locked-banner">
                <Lock size={16} />
                <span>Meeting is locked. Only hosts can enter.</span>
              </div>
            ) : (
              <button onClick={handleJoinCall} className="btn btn-primary btn-large w-full">
                <span>Join Study Meeting</span>
                <Video size={18} />
              </button>
            )}
          </div>
        </div>

        <style>{`
          .lobby-outer-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 480px;
            padding: 20px;
          }
          .lobby-card {
            width: 100%;
            max-width: 480px;
            padding: 32px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            text-align: center;
          }
          .lobby-header h3 {
            font-size: 1.4rem;
            font-weight: 800;
            color: var(--text-primary);
          }
          .lobby-header p {
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin-top: 6px;
          }
          .lobby-preview-box {
            position: relative;
            aspect-ratio: 16 / 9;
            background: #090d16;
            border-radius: var(--radius-md);
            overflow: hidden;
            border: 1px solid var(--border-glass);
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .lobby-preview-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .lobby-preview-placeholder {
            display: flex;
            flex-direction: column;
            gap: 12px;
            align-items: center;
            color: var(--text-secondary);
            font-size: 0.9rem;
          }
          .permission-alert {
            position: absolute;
            bottom: 12px;
            left: 12px;
            right: 12px;
            background: rgba(239, 68, 68, 0.9);
            color: white;
            padding: 6px 12px;
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .lobby-toggles-row {
            display: flex;
            justify-content: center;
            gap: 16px;
          }
          .btn-circle {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            padding: 0;
            justify-content: center;
          }
          .meeting-locked-banner {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
            border: 1px solid rgba(245, 158, 11, 0.2);
            padding: 12px;
            border-radius: var(--radius-sm);
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-weight: 600;
          }
          .w-full {
            width: 100%;
          }
        `}</style>
      </div>
    );
  }

  // ACTIVE MEETING ROOM LAYOUT
  const activeParticipantsCount = Object.keys(participants).length;

  return (
    <div className="active-meeting-container animate-fade-in">
      
      {/* 1. Header Metadata Bar */}
      <div className="meeting-header-bar glass-panel">
        <div className="header-left">
          <span className="meeting-badge uppercase">Live Call</span>
          <h4 className="meeting-title">{group.name} Study Room</h4>
          <span className="duration-timer">{formatTime(meetingDuration)}</span>
        </div>

        <div className="header-right">
          <div className="indicator-pill" title="Connection Quality">
            <Wifi size={14} className={connectionQuality === 'good' ? 'text-success' : 'text-warning'} />
            <span>{connectionQuality.toUpperCase()}</span>
          </div>

          <div className="indicator-pill">
            <Users size={14} />
            <span>{activeParticipantsCount} Joined</span>
          </div>

          {isAdmin && (
            <button 
              onClick={adminToggleLock} 
              className={`btn btn-icon-small ${meetingLocked ? 'btn-warning' : 'btn-secondary'}`}
              title={meetingLocked ? "Unlock Meeting" : "Lock Meeting"}
            >
              {meetingLocked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* 2. Workspace Split view: Video Tiles + Collapsible Whiteboard + Sidebars */}
      <div className="meeting-grid-split">
        
        {/* Left main compartment: Video Grid & Whiteboard */}
        <div className="call-compartment-main">
          
          <div className="call-content-stage">
            
            {/* Whiteboard display */}
            {showWhiteboard && (
              <div className="meeting-whiteboard-wrapper glass-panel animate-fade-in">
                <div className="whiteboard-title-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Edit3 size={16} className="text-primary" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Interactive Sketchpad</span>
                  </div>
                  <button onClick={clearCanvas} className="btn-icon-small text-danger" title="Clear board">
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="whiteboard-tools-panel">
                  <div className="color-selectors">
                    {['#6366f1', '#e11d48', '#10b981', '#f59e0b', '#ffffff'].map(c => (
                      <span 
                        key={c}
                        onClick={() => setColor(c)}
                        className={`color-bubble ${color === c ? 'active' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <div className="brush-slider">
                    <input 
                      type="range" 
                      min="2" 
                      max="12" 
                      value={lineWidth} 
                      onChange={(e) => setLineWidth(parseInt(e.target.value))} 
                    />
                    <span className="slider-label">{lineWidth}px</span>
                  </div>
                </div>

                <div className="canvas-frame">
                  <canvas 
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
              </div>
            )}

            {/* Video Grids */}
            <div className={`meeting-video-grid layout-${layout}`}>
              
              {/* Screen Share Tile */}
              {sharingScreen && (
                <div className="video-card screen-share-card">
                  <video ref={screenVideoRef} autoPlay playsInline muted />
                  <div className="video-card-badge">
                    <span className="live-dot" />
                    <span>Your Shared Screen</span>
                  </div>
                </div>
              )}

              {/* Local Participant Tile */}
              {(!sharingScreen || layout !== 'screenshare') && (
                <div className={`video-card ${activeSpeaker === currentStudent.id ? 'active-speaker' : ''}`}>
                  {videoOn ? (
                    <video ref={localVideoRef} autoPlay playsInline muted />
                  ) : (
                    <div className="video-placeholder">
                      <div className="placeholder-avatar initials">{currentStudent.name.charAt(0).toUpperCase()}</div>
                      <span className="placeholder-name">Camera Off</span>
                    </div>
                  )}

                  <div className="video-card-badge">
                    {micOn ? <Mic size={12} className="text-success" /> : <MicOff size={12} className="text-danger" />}
                    <span>{currentStudent.name} (You)</span>
                    {raisedHand && <Hand size={12} className="text-warning fill-warning animate-bounce ml-1" />}
                  </div>
                </div>
              )}

              {/* Remote Participants Tiles */}
              {Object.keys(participants).map(peerId => {
                if (peerId === currentStudent.id) return null;
                const peer = participants[peerId];
                if (!peer) return null;

                const hasStream = remoteVideoStreams[peerId] || remoteVideoStreams[String(peerId)];
                const stream = remoteVideoStreams[peerId] || remoteVideoStreams[String(peerId)];
                const isSpeaking = activeSpeaker === peerId;

                return (
                  <div key={peerId} className={`video-card ${isSpeaking ? 'active-speaker' : ''}`}>
                    {peer.videoOn && hasStream ? (
                      <>
                        <video 
                          ref={el => {
                            if (el && el.srcObject !== stream) {
                              el.srcObject = stream;
                            }
                          }}
                          autoPlay 
                          playsInline 
                          muted
                        />
                        <audio 
                          ref={el => {
                            if (el && el.srcObject !== stream) {
                              el.srcObject = stream;
                            }
                          }}
                          autoPlay
                        />
                      </>
                    ) : (
                      <>
                        {hasStream && (
                          <audio 
                            ref={el => {
                              if (el && el.srcObject !== stream) {
                                el.srcObject = stream;
                              }
                            }}
                            autoPlay
                          />
                        )}
                        <div className="video-placeholder">
                          {peer.avatar && peer.avatar !== 'https://via.placeholder.com/150' ? (
                            <img src={peer.avatar} alt={peer.name} className="placeholder-avatar" />
                          ) : (
                            <div className="placeholder-avatar initials">{peer.name.charAt(0).toUpperCase()}</div>
                          )}
                          <span className="placeholder-name">Camera Off</span>
                        </div>
                      </>
                    )}

                    <div className="video-card-badge">
                      {peer.micOn ? <Mic size={12} className="text-success" /> : <MicOff size={12} className="text-danger" />}
                      <span>{peer.name}</span>
                      {peer.raisedHand && <Hand size={12} className="text-warning fill-warning animate-bounce ml-1" />}
                    </div>
                  </div>
                );
              })}

              {/* Waiting tile if alone */}
              {activeParticipantsCount === 1 && !sharingScreen && (
                <div className="video-card waiting-card">
                  <div className="waiting-placeholder">
                    <LoaderAnimation />
                    <span>Waiting for other classmates to join...</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 3. Bottom controls bar */}
          <div className="meeting-controls-footer glass-panel">
            
            <div className="controls-group">
              <button 
                onClick={toggleMic} 
                className={`btn btn-control ${micOn ? 'btn-glass-secondary' : 'btn-danger'}`}
                title={micOn ? "Mute Mic" : "Unmute Mic"}
              >
                {micOn ? <Mic size={16} /> : <MicOff size={16} />}
              </button>
              
              <button 
                onClick={toggleVideo} 
                className={`btn btn-control ${videoOn ? 'btn-glass-secondary' : 'btn-danger'}`}
                title={videoOn ? "Turn Camera Off" : "Turn Camera On"}
              >
                {videoOn ? <Video size={16} /> : <VideoOff size={16} />}
              </button>

              <button 
                onClick={() => setSharingScreen(!sharingScreen)} 
                className={`btn btn-control ${sharingScreen ? 'btn-accent' : 'btn-glass-secondary'}`}
                title={sharingScreen ? "Stop Screen Share" : "Share Screen"}
              >
                <Monitor size={16} />
              </button>
            </div>

            <div className="controls-group">
              <button 
                onClick={toggleHandRaise} 
                className={`btn btn-control ${raisedHand ? 'btn-warning' : 'btn-glass-secondary'}`}
                title="Raise/Lower Hand"
              >
                <Hand size={16} className={raisedHand ? 'fill-warning' : ''} />
              </button>

              <div className="reactions-popover-wrapper">
                <button className="btn btn-control btn-glass-secondary" title="Reactions">
                  <Smile size={16} />
                </button>
                <div className="reactions-popover">
                  {['👍', '❤️', '👏', '😂', '🎉'].map(emoji => (
                    <button key={emoji} onClick={() => sendReaction(emoji)} className="popover-emoji-btn">
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="layouts-popover-wrapper">
                <button className="btn btn-control btn-glass-secondary" title="Switch Layout">
                  <Layout size={16} />
                </button>
                <div className="layouts-popover">
                  <button onClick={() => setLayout('gallery')} className={`layout-pop-btn ${layout === 'gallery' ? 'active' : ''}`}>Gallery Grid</button>
                  <button onClick={() => setLayout('speaker')} className={`layout-pop-btn ${layout === 'speaker' ? 'active' : ''}`}>Speaker Spotlight</button>
                  {sharingScreen && (
                    <button onClick={() => setLayout('screenshare')} className={`layout-pop-btn ${layout === 'screenshare' ? 'active' : ''}`}>Screen Focus</button>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setShowWhiteboard(!showWhiteboard)} 
                className={`btn btn-control ${showWhiteboard ? 'btn-primary' : 'btn-glass-secondary'}`}
                title="Toggle Sketchpad"
              >
                <Edit3 size={16} />
              </button>
            </div>

            <div className="controls-group">
              <button 
                onClick={() => {
                  setShowSidebar(!showSidebar);
                }} 
                className={`btn btn-control ${showSidebar ? 'btn-primary' : 'btn-glass-secondary'}`}
                title="Toggle Sidebar"
              >
                <MessageSquare size={16} />
              </button>

              <div className="leave-popover-wrapper">
                <button className="btn btn-danger btn-control" title="Leave Call">
                  <PhoneOff size={16} />
                </button>
                <div className="leave-popover">
                  <button onClick={() => handleLeaveCall(false)} className="leave-pop-btn">Leave Call</button>
                  {isAdmin && (
                    <button onClick={() => handleLeaveCall(true)} className="leave-pop-btn danger">End Call For All</button>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right compartment: Collapsible Sidebar (Chat + Participants) */}
        {showSidebar && (
          <div className="meeting-sidebar-panel glass-panel animate-fade-in">
            
            <div className="sidebar-tab-header">
              <button 
                onClick={() => setSidebarTab('chat')} 
                className={`sidebar-tab-btn ${sidebarTab === 'chat' ? 'active' : ''}`}
              >
                <MessageSquare size={16} />
                <span>Chat</span>
              </button>
              <button 
                onClick={() => setSidebarTab('participants')} 
                className={`sidebar-tab-btn ${sidebarTab === 'participants' ? 'active' : ''}`}
              >
                <Users size={16} />
                <span>Participants</span>
              </button>
              <button onClick={() => setShowSidebar(false)} className="sidebar-close-btn">
                <X size={16} />
              </button>
            </div>

            {/* TAB 1: MEETING CHAT */}
            {sidebarTab === 'chat' && (
              <div className="meeting-chat-content">
                <div className="chat-messages-scroll">
                  {inMeetingMessages.length === 0 ? (
                    <div className="chat-empty-slate">
                      <MessageSquare size={28} className="text-muted" />
                      <span>Start messaging with classmates in this call.</span>
                    </div>
                  ) : (
                    inMeetingMessages.map(msg => (
                      <div key={msg.id} className="meeting-chat-bubble">
                        <div className="bubble-header">
                          <span className="bubble-sender">{msg.senderName}</span>
                          <span className="bubble-time">{new Date(msg.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                          <button onClick={() => setReplyingTo(msg)} className="reply-shortcut">Reply</button>
                        </div>
                        {msg.replyTo && (
                          <div className="bubble-reply-preview">
                            <CornerDownRight size={10} />
                            <span>Replying to <strong>{msg.replyTo.senderName}</strong>: {msg.replyTo.text}</span>
                          </div>
                        )}
                        <p className="bubble-text">{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={sendMeetingChat} className="meeting-chat-input-form">
                  {replyingTo && (
                    <div className="replying-to-bar">
                      <span>Replying to {replyingTo.senderName}</span>
                      <button type="button" onClick={() => setReplyingTo(null)}><X size={12} /></button>
                    </div>
                  )}
                  <div className="input-row">
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      className="chat-input"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                    />
                    <button type="submit" className="chat-send-btn"><Send size={14} /></button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: PARTICIPANTS */}
            {sidebarTab === 'participants' && (
              <div className="meeting-participants-content">
                <div className="participants-list-scroll">
                  
                  {/* Render Local User */}
                  <div className="participant-item">
                    <div className="item-left">
                      <div className="participant-avatar initials">{currentStudent.name.charAt(0).toUpperCase()}</div>
                      <div className="item-text">
                        <span className="participant-name">{currentStudent.name} (You)</span>
                        {isAdmin && <span className="host-tag"><Crown size={10} /> Host</span>}
                      </div>
                    </div>
                    <div className="item-right">
                      {micOn ? <Mic size={14} className="text-success" /> : <MicOff size={14} className="text-danger" />}
                      {videoOn ? <Video size={14} className="text-success" /> : <VideoOff size={14} className="text-danger" />}
                    </div>
                  </div>

                  {/* Render Remote Users */}
                  {Object.keys(participants).map(peerId => {
                    if (peerId === currentStudent.id) return null;
                    const peer = participants[peerId];
                    if (!peer) return null;
                    const peerIsAdmin = group?.admin?._id === peerId || group?.admin === peerId;

                    return (
                      <div key={peerId} className="participant-item">
                        <div className="item-left">
                          {peer.avatar && peer.avatar !== 'https://via.placeholder.com/150' ? (
                            <img src={peer.avatar} alt={peer.name} className="participant-avatar" />
                          ) : (
                            <div className="participant-avatar initials">{peer.name.charAt(0).toUpperCase()}</div>
                          )}
                          <div className="item-text">
                            <span className="participant-name">{peer.name}</span>
                            {peerIsAdmin && <span className="host-tag"><Crown size={10} /> Host</span>}
                            {peer.raisedHand && <span className="hand-tag"><Hand size={10} /> Hand Raised</span>}
                          </div>
                        </div>
                        
                        <div className="item-right">
                          {peer.micOn ? <Mic size={14} className="text-success" /> : <MicOff size={14} className="text-danger" />}
                          {peer.videoOn ? <Video size={14} className="text-success" /> : <VideoOff size={14} className="text-danger" />}
                          
                          {isAdmin && (
                            <div className="admin-quick-actions">
                              <button 
                                onClick={() => adminMutePeer(peerId)} 
                                className="action-btn text-danger" 
                                title="Mute Participant"
                                disabled={!peer.micOn}
                              >
                                <VolumeX size={12} />
                              </button>
                              <button 
                                onClick={() => adminKickPeer(peerId)} 
                                className="action-btn text-danger" 
                                title="Remove Participant"
                              >
                                <UserMinus size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Floating Emoji Reactions Overlay */}
      <div className="floating-reactions-container">
        {reactions.map(r => (
          <div key={r.id} className="floating-reaction" style={{ left: `${r.left}%` }}>
            <span className="reaction-emoji">{r.emoji}</span>
            <span className="reaction-name">{r.name}</span>
          </div>
        ))}
      </div>

      {/* STYLESHEET EMBED */}
      <style>{`
        .active-meeting-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 120px);
          min-height: 520px;
          gap: 16px;
          position: relative;
        }
        .meeting-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 24px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .meeting-badge {
          background: rgba(239, 68, 68, 0.15);
          color: var(--danger);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.05em;
        }
        .meeting-title {
          font-size: 1rem;
          font-weight: 700;
        }
        .duration-timer {
          font-family: monospace;
          background: rgba(255,255,255,0.06);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .indicator-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          border: 1px solid var(--border-glass);
        }
        .btn-icon-small {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-glass);
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .meeting-grid-split {
          display: flex;
          flex: 1;
          gap: 16px;
          overflow: hidden;
          position: relative;
        }
        .call-compartment-main {
          display: flex;
          flex-direction: column;
          flex: 1;
          gap: 16px;
          overflow: hidden;
        }
        .call-content-stage {
          display: flex;
          flex: 1;
          gap: 16px;
          overflow: hidden;
          position: relative;
        }
        .meeting-whiteboard-wrapper {
          width: 320px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 16px;
          border-right: 1px solid var(--border-glass);
        }
        .whiteboard-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .whiteboard-tools-panel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          gap: 8px;
        }
        .color-selectors {
          display: flex;
          gap: 4px;
        }
        .color-bubble {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          cursor: pointer;
        }
        .color-bubble.active {
          transform: scale(1.25);
          border: 2px solid var(--primary);
        }
        .brush-slider {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
        }
        .brush-slider input {
          width: 100%;
          cursor: pointer;
        }
        .slider-label {
          font-size: 0.75rem;
          font-weight: 600;
        }
        .canvas-frame {
          flex: 1;
          background: #090d16;
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 1px solid var(--border-glass);
          position: relative;
        }
        .canvas-frame canvas {
          width: 100%;
          height: 100%;
          cursor: crosshair;
        }
        .meeting-video-grid {
          flex: 1;
          display: grid;
          gap: 16px;
          overflow-y: auto;
          align-content: center;
        }
        .meeting-video-grid.layout-gallery {
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }
        .meeting-video-grid.layout-speaker {
          grid-template-columns: 1fr;
        }
        .meeting-video-grid.layout-screenshare {
          grid-template-columns: 3fr 1fr;
        }
        .video-card {
          aspect-ratio: 16 / 9;
          background: #090d16;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 2px solid var(--border-glass);
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: var(--shadow-sm);
        }
        .video-card.active-speaker {
          border-color: var(--primary);
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
        }
        .video-card video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .video-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .placeholder-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--border-glass);
        }
        .placeholder-avatar.initials {
          background: var(--primary);
          color: white;
          font-weight: 800;
          font-size: 1.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .placeholder-name {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .video-card-badge {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          padding: 4px 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: white;
          z-index: 10;
        }
        .live-dot {
          width: 6px;
          height: 6px;
          background: var(--danger);
          border-radius: 50%;
          animation: pulse 1s infinite alternate;
        }
        .screen-share-card {
          grid-column: span 2;
        }
        .waiting-card {
          opacity: 0.5;
        }
        .waiting-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }
        .meeting-controls-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 24px;
        }
        .controls-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .btn-control {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          padding: 0;
          justify-content: center;
        }
        .btn-glass-secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-glass);
          color: var(--text-primary);
        }
        .btn-glass-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .reactions-popover-wrapper, .layouts-popover-wrapper, .leave-popover-wrapper {
          position: relative;
        }
        .reactions-popover-wrapper:hover .reactions-popover,
        .layouts-popover-wrapper:hover .layouts-popover,
        .leave-popover-wrapper:hover .leave-popover {
          display: flex;
        }
        .reactions-popover {
          display: none;
          position: absolute;
          bottom: 48px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(9, 13, 22, 0.95);
          border: 1px solid var(--border-glass);
          padding: 8px;
          border-radius: 20px;
          gap: 8px;
          z-index: 100;
          box-shadow: var(--shadow-lg);
        }
        .popover-emoji-btn {
          font-size: 1.25rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
        }
        .popover-emoji-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.15);
        }
        .layouts-popover, .leave-popover {
          display: none;
          position: absolute;
          bottom: 48px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(9, 13, 22, 0.95);
          border: 1px solid var(--border-glass);
          padding: 8px;
          border-radius: var(--radius-sm);
          flex-direction: column;
          gap: 4px;
          z-index: 100;
          box-shadow: var(--shadow-lg);
          width: 140px;
        }
        .layout-pop-btn, .leave-pop-btn {
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 6px 12px;
          font-size: 0.8rem;
          cursor: pointer;
          border-radius: 4px;
        }
        .layout-pop-btn:hover, .leave-pop-btn:hover {
          background: rgba(255,255,255,0.06);
          color: var(--text-primary);
        }
        .layout-pop-btn.active {
          color: var(--primary);
          font-weight: 700;
        }
        .leave-pop-btn.danger {
          color: var(--danger);
        }
        .leave-pop-btn.danger:hover {
          background: rgba(239, 68, 68, 0.1);
        }
        .meeting-sidebar-panel {
          width: 320px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .sidebar-tab-header {
          display: flex;
          border-bottom: 1px solid var(--border-glass);
          padding: 8px;
          align-items: center;
        }
        .sidebar-tab-btn {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border-radius: 4px;
        }
        .sidebar-tab-btn.active {
          background: rgba(255,255,255,0.05);
          color: var(--primary);
        }
        .sidebar-close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 8px;
        }
        .meeting-chat-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .chat-messages-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .chat-empty-slate {
          margin: auto;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          max-width: 200px;
        }
        .meeting-chat-bubble {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-glass);
          padding: 10px;
          border-radius: var(--radius-sm);
        }
        .bubble-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .bubble-sender {
          font-weight: 700;
          font-size: 0.8rem;
          color: var(--text-primary);
        }
        .bubble-time {
          font-size: 0.65rem;
          color: var(--text-muted);
        }
        .reply-shortcut {
          background: none;
          border: none;
          font-size: 0.65rem;
          color: var(--primary);
          cursor: pointer;
        }
        .bubble-reply-preview {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          color: var(--text-muted);
          background: rgba(255,255,255,0.04);
          padding: 2px 6px;
          border-radius: 4px;
          margin-bottom: 6px;
        }
        .bubble-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .meeting-chat-input-form {
          padding: 12px;
          border-top: 1px solid var(--border-glass);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .replying-to-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,0.05);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          color: var(--text-secondary);
        }
        .replying-to-bar button {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .input-row {
          display: flex;
          gap: 8px;
        }
        .chat-input {
          flex: 1;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-glass);
          border-radius: 4px;
          padding: 8px 12px;
          color: var(--text-primary);
          font-size: 0.85rem;
        }
        .chat-send-btn {
          background: var(--primary);
          border: none;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        .meeting-participants-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .participants-list-scroll {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .participant-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-glass);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
        }
        .item-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .participant-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--border-glass);
        }
        .participant-avatar.initials {
          background: var(--primary);
          color: white;
          font-weight: 700;
          font-size: 0.9rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .item-text {
          display: flex;
          flex-direction: column;
        }
        .participant-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .host-tag {
          font-size: 0.65rem;
          color: var(--accent);
          background: rgba(6,182,212,0.1);
          padding: 1px 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 2px;
          width: fit-content;
          margin-top: 2px;
          font-weight: 600;
        }
        .hand-tag {
          font-size: 0.65rem;
          color: var(--warning);
          background: rgba(245,158,11,0.1);
          padding: 1px 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 2px;
          width: fit-content;
          margin-top: 2px;
          font-weight: 600;
        }
        .item-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .admin-quick-actions {
          display: flex;
          border-left: 1px solid var(--border-glass);
          padding-left: 8px;
          gap: 4px;
        }
        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .action-btn:hover {
          background: rgba(255,255,255,0.06);
        }
        .action-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .floating-reactions-container {
          position: absolute;
          bottom: 100px;
          left: 0;
          right: 0;
          height: 500px;
          pointer-events: none;
          overflow: hidden;
          z-index: 1000;
        }
        .floating-reaction {
          position: absolute;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: float-up 3s ease-out forwards;
        }
        .reaction-emoji {
          font-size: 2.5rem;
        }
        .reaction-name {
          font-size: 0.75rem;
          background: rgba(0,0,0,0.6);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          margin-top: 4px;
        }
        @keyframes float-up {
          0% {
            transform: translateY(100px) scale(0.5);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(50px) scale(1.2);
          }
          100% {
            transform: translateY(-400px) scale(1);
            opacity: 0;
          }
        }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Simple loader helper
function LoaderAnimation() {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      <span className="load-dot-anim" style={{ animationDelay: '0.1s' }} />
      <span className="load-dot-anim" style={{ animationDelay: '0.3s' }} />
      <span className="load-dot-anim" style={{ animationDelay: '0.5s' }} />
      <style>{`
        .load-dot-anim {
          width: 6px;
          height: 6px;
          background: var(--text-secondary);
          border-radius: 50%;
          animation: dot-pulse 0.8s infinite alternate;
        }
        @keyframes dot-pulse {
          0% { transform: scale(0.5); opacity: 0.3; }
          100% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
