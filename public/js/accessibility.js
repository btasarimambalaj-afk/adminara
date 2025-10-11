// Accessibility utilities

class AccessibilityManager {
  constructor() {
    this.focusTrap = null;
    this.init();
  }

  init() {
    this.setupKeyboardNavigation();
    this.setupAriaLiveRegions();
    this.setupFocusManagement();
  }

  setupKeyboardNavigation() {
    // ESC key to close modals/fullscreen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Alt+M: Toggle microphone
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        document.getElementById('muteButton')?.click();
      }
      
      // Alt+C: Toggle camera
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        document.getElementById('cameraButton')?.click();
      }
      
      // Alt+F: Toggle fullscreen
      if (e.altKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('fullscreenButton')?.click();
      }
      
      // Alt+E: End call
      if (e.altKey && e.key === 'e') {
        e.preventDefault();
        const endBtn = document.getElementById('endButton');
        if (endBtn && !endBtn.classList.contains('hidden')) {
          endBtn.click();
        }
      }
    });
  }

  setupAriaLiveRegions() {
    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'aria-live-region';
    document.body.appendChild(liveRegion);
  }

  announce(message, priority = 'polite') {
    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  setupFocusManagement() {
    // Track last focused element before modal
    this.lastFocusedElement = null;
    
    // Restore focus when modal closes
    document.addEventListener('modalClosed', () => {
      if (this.lastFocusedElement) {
        this.lastFocusedElement.focus();
      }
    });
  }

  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    this.focusTrap = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    };

    element.addEventListener('keydown', this.focusTrap);
    firstFocusable?.focus();
  }

  releaseFocusTrap(element) {
    if (this.focusTrap) {
      element.removeEventListener('keydown', this.focusTrap);
      this.focusTrap = null;
    }
  }

  updateButtonState(button, pressed) {
    button.setAttribute('aria-pressed', pressed);
  }

  setLoadingState(button, loading) {
    if (loading) {
      button.setAttribute('aria-busy', 'true');
      button.disabled = true;
    } else {
      button.removeAttribute('aria-busy');
      button.disabled = false;
    }
  }
}

// Initialize
const a11y = new AccessibilityManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityManager;
}
