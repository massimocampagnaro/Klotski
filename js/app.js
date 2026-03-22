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

            const container = document.getElementById('game-container');
            cheerpjCreateDisplay(520, 704, container);

            const runMainPromise = cheerpjRunMain('Main', '/app/MyKlotski/klotski.jar');

            await waitForGameCanvas(container, 15000);
            hideOverlay();

            await runMainPromise;
        } catch (err) {
            hideOverlay();
            console.error('CheerpJ launch error:', err);
            showError('Unable to launch the game. Please check your connection and try again.');
        }
    };

    window.showNetworkError = function () {
        showError('Failed to load the runtime engine. Please check your network connection and reload the page.');
    };

    document.addEventListener('DOMContentLoaded', init);

    function waitForGameCanvas(container, timeoutMs = 15000) {
        return new Promise((resolve, reject) => {
            const existing = container.querySelector('canvas');
            if (existing) {
                resolve(existing);
                return;
            }

            const observer = new MutationObserver(() => {
                const canvas = container.querySelector('canvas');
                if (canvas) {
                    observer.disconnect();
                    clearTimeout(timeout);
                    resolve(canvas);
                }
            });

            observer.observe(container, { childList: true, subtree: true });

            const timeout = setTimeout(() => {
                observer.disconnect();
                reject(new Error('Game canvas not detected in time'));
            }, timeoutMs);
        });
    }
})();
