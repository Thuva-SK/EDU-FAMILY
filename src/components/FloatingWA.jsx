import React from 'react';
import WhatsAppIcon from './WhatsAppIcon';

export default function FloatingWA() {
  return (
    <a
      href="https://whatsapp.com/channel/0029VafVyoB2ZjCuGohiJe2V"
      target="_blank"
      rel="noopener noreferrer"
      className="floating-wa-btn"
      title="Join Edufamily WhatsApp Channel"
      aria-label="WhatsApp Channel"
    >
      <WhatsAppIcon size={34} color="#ffffff" />
    </a>
  );
}
