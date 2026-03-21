(function () {
    'use strict';

    var overlay = null;
    var errorBanner = null;

    function init() {
        overlay = document.getElementById('loading-overlay');
        errorBanner = document.getElementById('error-banner');
    }

    function hideOverlay() {
        if (!overlay) return;
        overlay.classList.add('hidden');
        overlay.addEventListener('transitionend', function () {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, { once: true });
    }

    function showError(message) {
        hideOverlay();
        if (errorBanner) {
            errorBanner.textContent = message;
            errorBanner.classList.add('visible');
        }
    }

    window.startEverything = async function () {
        try {
            await cheerpjInit();
            cheerpjCreateDisplay(-1, -1, document.getElementById('game-container'));
            await cheerpjRunMain('Main', '/app/Klotski/klotski.jar');
        } catch (err) {
            console.error('CheerpJ launch error:', err);
            showError('Unable to launch the game. Please check your connection and try again.');
        } finally {
            hideOverlay();
        }
    };

    window.showNetworkError = function () {
        showError('Failed to load the runtime engine. Please check your network connection and reload the page.');
    };

    document.addEventListener('DOMContentLoaded', init);
})();
