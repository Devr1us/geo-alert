import React, { useState } from 'react';
import { Sparkles, X, Bot, MessageSquare } from 'lucide-react';
import AIChat from './AIChat';

export default function FloatingAIWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button (FAB) on Bottom-Right */}
      <div className="floating-ai-widget-fab">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="ai-fab-btn"
            aria-label="Tanya Kepada GeoAlert AI"
          >
            <div className="ai-fab-icon-wrap">
              <Sparkles size={20} color="#0E2A5C" />
              <span className="ai-fab-dot" />
            </div>
            <div className="ai-fab-text">
              <span className="ai-fab-sub">Asisten Cerdas</span>
              <span className="ai-fab-main">Tanya Kepada GeoAlert AI</span>
            </div>
          </button>
        ) : null}
      </div>

      {/* Floating Chat Modal Drawer */}
      {isOpen && (
        <div className="floating-ai-modal-overlay">
          <div className="floating-ai-modal-card">
            {/* Top Close Header Bar */}
            <div className="floating-ai-header">
              <div className="floating-ai-header-left">
                <div className="ai-badge-icon">
                  <Bot size={18} color="#ffffff" />
                </div>
                <div>
                  <h4 className="floating-ai-title">GeoAlert AI Assistant</h4>
                  <p className="floating-ai-subtitle">Tanya seputar mitigasi &amp; darurat bencana</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="floating-ai-close-btn"
                aria-label="Tutup AI Chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Embedded AI Chat Component */}
            <div className="floating-ai-chat-body">
              <AIChat isFloating={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
