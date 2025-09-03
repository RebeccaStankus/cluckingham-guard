export type ConnState = 'idle' | 'connecting' | 'playing' | 'offline';

export type WhepOpts = {
     whepUrl: string;
     onState?: (state: ConnState) => void;
     onStream?: (stream: MediaStream | null) => void;
};

export async function connectWhep({ whepUrl, onState, onStream }: WhepOpts) {
     onState?.('connecting');
     const peerConnection = new RTCPeerConnection();

     peerConnection.ontrack = (track) => {
          onState?.('playing');
          // first track carries the combined stream
          if (track.streams?.[0]) onStream?.(track.streams[0]);
     };

     peerConnection.onconnectionstatechange = () => {
          if (['failed', 'disconnected', 'closed'].includes(peerConnection.connectionState)) {
               onState?.('offline');
          }
     };

     peerConnection.addTransceiver('video', { direction: 'recvonly' });
     peerConnection.addTransceiver('audio', { direction: 'recvonly' });

     const offer = await peerConnection.createOffer();
     await peerConnection.setLocalDescription(offer);

     const resp = await fetch(whepUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: offer.sdp ?? ''
     });

     if (!resp.ok) {
          onState?.('offline');
          throw new Error(`WHEP ${resp.status}`);
     }

     const answerSdp = await resp.text();
     await peerConnection.setRemoteDescription({ type: 'answer', sdp: answerSdp });

     return peerConnection; // caller can close() on destroy
}
