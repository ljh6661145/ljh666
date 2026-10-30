(function () {
    'use strict';
    if (!/Android/i.test(navigator.userAgent || '')) return;
    var root = document.documentElement;
    var appAgent = /;\s*wv\b|Version\/4\.0/i.test(navigator.userAgent || '');
    var probe, queued = 0, maxHeight = 0, orientationKey = '', previous = '';
    root.classList.add('music-android');
    function standalone() {
        return !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    }
    function chooseInsets(info) {
        var gap = info.screenHeight > 0 ? Math.max(0, info.screenHeight - info.viewportHeight) : null;
        // Native containers that already reserve system bars must not be padded twice.
        var edgeToEdge = gap === null ? info.appLike : gap < 24;
        return {
            top: info.safeTop > 0 || !edgeToEdge ? 0 : 32,
            bottom: info.safeBottom > 0 || !edgeToEdge ? 0 : 48
        };
    }
    function update() {
        queued = 0;
        var key = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        // The software keyboard must not be treated as an orientation change.
        var editing = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
        var screenKey = window.screen && window.screen.orientation ? String(window.screen.orientation.angle) : (editing && orientationKey ? orientationKey : key);
        if (screenKey !== orientationKey) { orientationKey = screenKey; maxHeight = 0; }
        maxHeight = Math.max(maxHeight, window.innerHeight, root.clientHeight || 0);
        var screenHeight = window.screen ? Number(window.screen.height) || 0 : 0;
        var nativeStyle = getComputedStyle(probe);
        var safeTop = parseFloat(nativeStyle.paddingTop) || 0;
        var safeBottom = parseFloat(nativeStyle.paddingBottom) || 0;
        var fullScreenSize = screenHeight > 0 && Math.abs(screenHeight - maxHeight) < 24;
        var appLike = appAgent || standalone() || fullScreenSize;
        var inset = appLike ? chooseInsets({ screenHeight: screenHeight, viewportHeight: maxHeight, safeTop: safeTop, safeBottom: safeBottom, appLike: appLike }) : { top: 0, bottom: 0 };
        var stamp = inset.top + ':' + inset.bottom + ':' + safeTop + ':' + safeBottom;
        if (stamp === previous) return;
        previous = stamp;
        root.style.setProperty('--android-top-fallback', inset.top + 'px');
        root.style.setProperty('--android-bottom-fallback', inset.bottom + 'px');
        window.dispatchEvent(new Event('music-safe-area-change'));
    }
    function schedule() { if (!queued) queued = requestAnimationFrame(update); }
    function mount() {
        probe = document.createElement('div');
        probe.setAttribute('aria-hidden', 'true');
        probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);';
        document.body.appendChild(probe);
        update();
        window.addEventListener('resize', schedule, { passive: true });
        window.addEventListener('orientationchange', schedule, { passive: true });
        window.addEventListener('pageshow', schedule, { passive: true });
        if (window.visualViewport) window.visualViewport.addEventListener('resize', schedule, { passive: true });
        document.addEventListener('visibilitychange', function () { if (!document.hidden) schedule(); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
    window.addEventListener('music-safe-area-change', function () {
        if (typeof window.measureCollapsedHeader === 'function') window.measureCollapsedHeader();
        if (typeof window.updateCollapsedHeader === 'function') window.updateCollapsedHeader(window.scrollY);
    });
}());
