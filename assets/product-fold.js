if (!customElements.get('product-fold')) {
  customElements.define('product-fold', class extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      this.details = this.querySelector('details');
      this.summary = this.querySelector('summary');
      this.panel = this.querySelector('.product-fold__panel');
      this.expanded = this.details.open;
      this.summary.setAttribute('aria-expanded', String(this.expanded));
      this.onClick = (event) => {
        event.preventDefault();
        this.setExpanded(!this.expanded);
      };
      this.onSelect = () => this.setExpanded(true);
      this.summary.addEventListener('click', this.onClick);
      this.addEventListener('shopify:block:select', this.onSelect);
    }

    setExpanded(expanded) {
      const height = this.details.open ? this.panel.getBoundingClientRect().height : 0;
      if (this.animation) this.animation.cancel();
      this.expanded = expanded;
      this.summary.setAttribute('aria-expanded', String(expanded));
      this.details.open = true;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !this.panel.animate) {
        this.details.open = expanded;
        return;
      }
      this.animation = this.panel.animate(
        [{ height: `${height}px`, opacity: height ? 1 : 0 },
          { height: `${expanded ? this.panel.scrollHeight : 0}px`, opacity: expanded ? 1 : 0 }],
        { duration: 280, easing: 'ease-in-out' }
      );
      this.animation.onfinish = () => {
        this.details.open = this.expanded;
        this.animation = null;
      };
    }

    disconnectedCallback() {
      this.animation?.cancel();
      this.summary?.removeEventListener('click', this.onClick);
      this.removeEventListener('shopify:block:select', this.onSelect);
      this.initialized = false;
    }
  });
}
