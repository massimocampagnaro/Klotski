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
        }, {once: true});
    }

    function showError(message) {
        hideOverlay();
        if (errorBanner) {
            errorBanner.textContent = message;
            errorBanner.classList.add('visible');
        }
    }

    // On mobile, CheerpJ calls preventDefault() on touchstart (to handle game drag),
    // suppressing the browser's trusted synthetic mouse/click events for ALL touches —
    // including taps on dialog buttons.
    //
    // Playwright confirmed: CheerpJ does NOT check event.isTrusted, so synthetic
    // MouseEvents from dispatchEvent() work correctly.
    //
    // Two-layer fix on dialog windows (non-first .window.bordered):
    //  1. touchstart capture on document → stopPropagation, so CheerpJ can't call
    //     preventDefault and the browser can generate its own trusted events.
    //  2. touchend capture on document → relay as mousedown+mouseup+click (fallback
    //     for browsers/contexts where layer 1 alone isn't enough).
    function setupDialogTouchFix(display) {
        function isDialog(el) {
            var windowEl = el.closest('.window.bordered');
            if (!windowEl || !display.contains(windowEl)) return false;
            return windowEl !== display.querySelector('.window.bordered');
        }

        document.addEventListener('touchstart', function (e) {
            if (!isDialog(e.target)) return;
            e.stopPropagation(); // Prevent CheerpJ from calling preventDefault
        }, { passive: false, capture: true });

        document.addEventListener('touchend', function (e) {
            var touch = e.changedTouches[0];
            var el = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!el || !isDialog(el)) return;

            e.stopPropagation();
            var opts = {
                bubbles: true, cancelable: true, view: window,
                clientX: touch.clientX, clientY: touch.clientY,
                screenX: touch.screenX, screenY: touch.screenY,
            };
            el.dispatchEvent(new MouseEvent('mousedown', opts));
            el.dispatchEvent(new MouseEvent('mouseup', opts));
            el.dispatchEvent(new MouseEvent('click', opts));
        }, { passive: false, capture: true });
    }

    window.startEverything = async function () {
        try {
            await cheerpjInit();

            const container = document.getElementById('game-container');
            cheerpjCreateDisplay(520, 704, container);

            var display = container.querySelector('#cheerpjDisplay');
            if (display) setupDialogTouchFix(display);

            const runMainPromise = cheerpjRunMain('Main', '/app/Klotski/klotski.jar');

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

            observer.observe(container, {childList: true, subtree: true});

            const timeout = setTimeout(() => {
                observer.disconnect();
                reject(new Error('Game canvas not detected in time'));
            }, timeoutMs);
        });
    }
})();
