(function () {
  var pending;
  window.ManimoodComponents = function (root, initialize, needsSwiper) {
    if (!root) return;
    function start() {
      if (!root.isConnected) return;
      if (needsSwiper === false) { initialize(); return; }
      if (!pending) pending = new Promise(function (resolve, reject) {
        if (window.Swiper) { resolve(); return; }
        var script = document.createElement('script');
        script.src = document.documentElement.dataset.swiperUrl;
        script.onload = resolve;
        script.onerror = function () { pending = null; reject(new Error('Carousel resource unavailable')); };
        document.head.appendChild(script);
      });
      pending.then(function () { if (root.isConnected) initialize(); }).catch(function (error) { console.warn(error.message); });
    }
    if (!('IntersectionObserver' in window) || (window.Shopify && Shopify.designMode)) { start(); return; }
    var observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) { observer.disconnect(); start(); }
    }, { rootMargin: '200px' });
    observer.observe(root);
  };
})();
