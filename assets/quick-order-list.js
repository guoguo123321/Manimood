
const ON_CHANGE_DEBOUNCE_TIMER = 300;
var $ = jQuery_T4NT;
var $body = $('body');
class BulkAdd extends HTMLElement {
  constructor() {
    super();
    // console.log("init  BulkAdd");
    this.queue = [];
    this.requestStarted = false;
    this.ids = [];
  }

  startQueue(id, quantity) {
    // console.log(quantity);
    this.queue.push({ id, quantity });
    const interval = setInterval(() => {
      if (this.queue.length > 0) {
        if (!this.requestStarted) {
          this.sendRequest(this.queue);
        }
      } else {
        clearInterval(interval);
      }
    }, 250);
  }

  sendRequest(queue) {
    this.requestStarted = true;
    const items = {};
    queue.forEach((queueItem) => {
      items[parseInt(queueItem.id)] = queueItem.quantity;
    });
    this.queue = this.queue.filter((queueElement) => !queue.includes(queueElement));
    const quickBulkElement = this.closest('quick-order-list') || this.closest('quick-add-bulk');
    quickBulkElement.updateMultipleQty(items);
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute('value');
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;

    if (inputValue < event.target.dataset.min) {
      this.setValidity(event, index, window.quickOrderListStrings.min_error.replace('[min]', event.target.dataset.min));
    } else if (inputValue > parseInt(event.target.max)) {
      T4SThemeSP.Notices(T4Sstrings.notice_stock_msg.replace('[max]', parseInt(event.target.max)));
    } else if (inputValue % parseInt(event.target.step) != 0) {
      this.setValidity(event, index, window.quickOrderListStrings.step_error.replace('[step]', event.target.step));
    } else {
      event.target.setCustomValidity('');
      event.target.reportValidity();
      this.startQueue(index, inputValue);
    }
  }

  getSectionsUrl() {
    if (window.pageNumber) {
      return `${window.location.pathname}?page=${window.pageNumber}`;
    } else {
      return `${window.location.pathname}`;
    }
  }

  getSectionInnerHTML(html, selector) {
    // // console.log(new DOMParser().parseFromString(html, 'text/html'));
    // console.log(new DOMParser().parseFromString(html, 'text/html').querySelector(selector));
    
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }
}
class QuantityInput extends HTMLElement {
  constructor() {
    super();
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.qol = this.closest('quick-order-list')
    this.input = this.querySelector('input');
    if(!this.input) return;
    this.changeEvent = new Event('change', { bubbles: true });
    this.input.addEventListener('change', debounce(this.onInputChange.bind(this), ON_CHANGE_DEBOUNCE_TIMER));
    this.querySelectorAll('button').forEach((button) =>
      button.addEventListener('click', this.onButtonClick.bind(this))
    );

    if(!this.input) return;
    this.validateQtyRules();
    // this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
  }

  disconnectedCallback() {
    // if (this.quantityUpdateUnsubscriber) {
    //   this.quantityUpdateUnsubscriber();
    // }
  }

  onLoading(){ 
    this.closest('.t4s-variant-item').setAttribute('aria-busy',true);
    this.qol.onLoading();
  }

  onInputChange(event) {
    // console.log("change");
    this.validateQtyRules();
    this.onLoading(event)
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    if (event.target.name === 'plus') {
      if (parseInt(this.input.dataset.min) > parseInt(this.input.step) && this.input.value == 0) {
        this.input.value = this.input.dataset.min;
      } else {
        this.input.stepUp();
      }
    } else {
      this.input.stepDown();
    }
    
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);

    if (this.input.dataset.min === previousValue && event.target.name === 'minus') {
      this.input.value = parseInt(this.input.min);
    }
  }

  validateQtyRules() {
    
    const value = parseInt(this.input.value);
    const current_value = parseInt(this.input.dataset.currentValue);
    // console.log(this.input.min);
    if (this.input.min != undefined) {
      const buttonMinus = this.querySelector("button[name='minus']");
      value <= parseInt(this.input.min) ? buttonMinus.setAttribute('disabled', '') : buttonMinus.removeAttribute('disabled');
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector("button[name='plus']");
      value >= max ? buttonPlus.setAttribute('disabled', '') : buttonPlus.removeAttribute('disabled');
    }

    if(value > parseInt(this.input.max)){
      this.input.value = parseInt(this.input.max);
      T4SThemeSP.Notices(T4Sstrings.notice_stock_msg.replace('[max]', parseInt(this.input.max)));
      // return;
    }

    if(!value) {
      this.input.value = current_value;
      return;
    }
    value < parseInt(this.input.min) ? this.input.value = current_value : this.input.setAttribute('data-current-value', value);
    // console.log(value);

    
  }
}
customElements.define('quantity-input', QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return fn(...args);
  };
}


function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: `application/${type}` },
  };
}

customElements.define(
  'quick-order-list-remove-button',
  class QuickOrderListRemoveButton extends BulkAdd {
    constructor() {
      super();
      this.input = this.closest('quantity-input');
      this.addEventListener('click', (event) => {
        event.preventDefault();
        this.startQueue(this.dataset.index, 0);
        this.input.onLoading()
      });
    }
  }
);

customElements.define(
  'quick-order-list-remove-all-button',
  class QuickOrderListRemoveAllButton extends HTMLElement {
    constructor() {
      super();
      this.quickOrderList = this.closest('quick-order-list');

      this.addEventListener('click', (event) => {
        event.preventDefault();
        const items = this.quickOrderList.cartVariantsForProduct.reduce(
          (acc, variantId) => ({ ...acc, [variantId]: 0 }),
          {}
        );
        this.quickOrderList.updateMultipleQty(items);
        this.quickOrderList.onLoadingAllInput();
      });
    }
    onLoading(){

    }
  }
);
class QuickOrderList extends BulkAdd {
  constructor() {
    super();
    // console.log("init quick order list");
    this.cart = document.querySelector('#t4s-mini_cart');
    this.quickOrderListId = `${this.dataset.section}-${this.dataset.productId}`;
    
  }
  init(){
    this.defineInputsAndQuickOrderTable();

    const form = this.querySelector('form');
    this.getTableHead();

    const pageParams = new URLSearchParams(window.location.search);
    window.pageNumber = decodeURIComponent(pageParams.get('page') || '');
    form.addEventListener('submit', this.onSubmit.bind(this));
    this.addMultipleDebounce();
  }

  cartUpdateUnsubscriber = undefined;

  get currentPage(){
    return this.getAttribute('data-current-page');
  }

  onSubmit(event) {
    event.preventDefault();
  }

  connectedCallback() {
    this.init();
    this.sectionId = this.dataset.section;
    this.updateFromCart();
  }

  disconnectedCallback() {
    this.cartUpdateUnsubscriber?.();
  }

  get cartVariantsForProduct() {
    return JSON.parse(this.querySelector('[data-cart-contents]')?.innerHTML || '[]');
  }

  get AllInputActive(){
    return Array.from(this.querySelectorAll('input[type="number"]')).filter((input) => parseInt(input.value) > 0);
  }

  onLoading(){
    this.querySelector('form').style.setProperty('pointer-events','none');

    this.querySelectorAll('[update-change]').forEach((element) => {
      element.setAttribute('aria-busy',true);
    });
  }
  
  onLoadingAllInput(){
    this.AllInputActive.forEach((input) => {
      input.closest('.t4s-variant-item').setAttribute('aria-busy',true);
    });
    this.onLoading();
  }

  defineInputsAndQuickOrderTable() {
    this.allInputsArray = Array.from(this.querySelectorAll('input[type="number"]'));
    // this.quickOrderListTable = this.querySelector('.t4s-quick-order-list__table');
    // this.quickOrderListTable.addEventListener('focusin', this.switchVariants.bind(this));
  }

  onChange(event) {
    const inputValue = parseInt(event.target.value);
    this.cleanErrorMessageOnType(event);
    if (inputValue == 0) {
      this.startQueue(event.target.dataset.index, inputValue);
    } else {
      this.validateQuantity(event);
    }
  }

  cleanErrorMessageOnType(event) {
    event.target.addEventListener('keydown', () => {
      event.target.setCustomValidity(' ');
      event.target.reportValidity();
    });
  }

  validateInput(target) {
    if (target.max) {
      return (
        parseInt(target.value) == 0 ||
        (parseInt(target.value) >= parseInt(target.dataset.min) &&
          parseInt(target.value) <= parseInt(target.max) &&
          parseInt(target.value) % parseInt(target.step) == 0)
      );
    } else {
      return (
        parseInt(target.value) == 0 ||
        (parseInt(target.value) >= parseInt(target.dataset.min) &&
          parseInt(target.value) % parseInt(target.step) == 0)
      );
    }
  }

  refresh() {
    return new Promise((resolve, reject) => {
      fetch(`${this.getSectionsUrl()}?section_id=${this.sectionId}&page=${this.currentPage}`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const sourceQty = html.querySelector(`#${this.quickOrderListId}`);
          if (sourceQty) {
            this.innerHTML = sourceQty.innerHTML;
            this.init();
            $body.trigger('currency:update');
          }
          resolve();
        })
        .finally(() => {
        })
        .catch((e) => {
          console.error(e);
          reject(e);
        });
    });
  }

  getSectionsToRender() {
    return [
      {
        id: this.quickOrderListId,
        section: document.getElementById(this.quickOrderListId).dataset.section,
        selector: `#${this.quickOrderListId}`,
      }
    ];
  }

  addMultipleDebounce() {
    this.querySelectorAll('quantity-input').forEach((qty) => {
      const debouncedOnChange = debounce((event) => {
        this.onChange(event);
      }, ON_CHANGE_DEBOUNCE_TIMER);
      qty.addEventListener('change', debouncedOnChange.bind(this));
    });
  }

  renderSections(parsedState, ids) {
    this.ids.push(ids);
    // console.log(parsedState)
    const intersection = this.queue.filter((element) => ids.includes(element.id));
    if (intersection.length !== 0) return;

    this.getSectionsToRender().forEach((section) => {
      const sectionElement = document.getElementById(section.id);
      if(!sectionElement) return;
      this.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
    });
    this.defineInputsAndQuickOrderTable();
    this.addMultipleDebounce();
    this.ids = [];
  }

  getTableHead() {
    return document.querySelector('.t4s-quick-order-list__table thead');
  }

  switchVariants(event) {
    if (event.target.tagName !== 'INPUT') {
      return;
    }

    this.variantListInput = event.target;
    this.variantListInput.select();
    if (this.allInputsArray.length !== 1) {
      this.variantListInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.target.blur();
          if (this.validateInput(e.target)) {
            const currentIndex = this.allInputsArray.indexOf(e.target);
            this.lastKey = e.shiftKey;
            if (!e.shiftKey) {
              const nextIndex = currentIndex + 1;
              const nextVariant = this.allInputsArray[nextIndex] || this.allInputsArray[0];
              nextVariant.select();
            } else {
              const previousIndex = currentIndex - 1;
              const previousVariant =
                this.allInputsArray[previousIndex] || this.allInputsArray[this.allInputsArray.length - 1];
              this.lastElement = previousVariant.dataset.index;
              previousVariant.select();
            }
          }
        }
      });

      this.scrollQuickOrderListTable();
    } else {
      this.variantListInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.target.blur();
        }
      });
    }
  }

  updateMultipleQty(items,action="") {
    const ids = Object.keys(items);
    let sections_url = `${this.dataset.url}?page=${this.currentPage}`
    if(action == "remove"){
      sections_url = `${this.dataset.url}`
    }
    const body = JSON.stringify({
      updates: items,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: sections_url,
    });
    this.setAttribute('aria-busy',true)
    fetch(`${T4Sroutes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        this.renderSections(parsedState, ids);
        // document.dispatchEvent(new CustomEvent('cart:refresh'));
        // document.dispatchEvent(new CustomEvent('currency:update'));

      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        this.requestStarted = false;
        this.setAttribute('aria-busy',false);

        document.dispatchEvent(new CustomEvent('cart:refresh'));
        $body.trigger('currency:update');
        document.dispatchEvent(new CustomEvent('currency:update'))

        // console.log("cart:refresh", document.dispatchEvent(new CustomEvent('cart:refresh')));
        // console.log("currency:update", document.dispatchEvent(new CustomEvent('currency:update')));
      });
  }

  updateFromCart(){
    document.addEventListener('cart:updated', () => {
      this.refresh();
      
    });
  }

  setErrorMessage(message = null) {
    this.errorMessageTemplate =
      this.errorMessageTemplate ??
      document.getElementById(`QuickOrderListErrorTemplate-${this.dataset.productId}`).cloneNode(true);
    const errorElements = document.querySelectorAll('.t4s-quick-order-list-error');

    errorElements.forEach((errorElement) => {
      errorElement.innerHTML = '';
      if (!message) return;
      const updatedMessageElement = this.errorMessageTemplate.cloneNode(true);
      updatedMessageElement.content.querySelector('.t4s-quick-order-list-error-message').innerText = message;
      errorElement.appendChild(updatedMessageElement.content);
    });
  }

  updateMessage(quantity = null) {
    const messages = this.querySelectorAll('.t4s-quick-order-list__message-text');
    const icons = this.querySelectorAll('.t4s-quick-order-list__message-icon');

    if (quantity === null || isNaN(quantity)) {
      messages.forEach((message) => (message.innerHTML = ''));
      icons.forEach((icon) => icon.classList.add('hidden'));
      return;
    }

    const isQuantityNegative = quantity < 0;
    const absQuantity = Math.abs(quantity);

    const textTemplate = isQuantityNegative
      ? absQuantity === 1
        ? window.quickOrderListStrings.itemRemoved
        : window.quickOrderListStrings.itemsRemoved
      : quantity === 1
      ? window.quickOrderListStrings.itemAdded
      : window.quickOrderListStrings.itemsAdded;

    messages.forEach((msg) => (msg.innerHTML = textTemplate.replace('[quantity]', absQuantity)));

    if (!isQuantityNegative) {
      icons.forEach((i) => i.classList.remove('hidden'));
    }
  }

  updateError(updatedValue, id) {
    let message = '';
    if (typeof updatedValue === 'undefined') {
      message = window.cartStrings.error;
    } else {
      message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
    }
    this.updateLiveRegions(id, message);
  }

  cleanErrors(id) {
    // this.querySelectorAll('.desktop-row-error').forEach((error) => error.classList.add('hidden'));
    // this.querySelectorAll(`.variant-item__error-text`).forEach((error) => error.innerHTML = '');
  }

  updateLiveRegions(id, message) {
    const variantItemErrorDesktop = document.getElementById(`Quick-order-list-item-error-desktop-${id}`);
    const variantItemErrorMobile = document.getElementById(`Quick-order-list-item-error-mobile-${id}`);
    if (variantItemErrorDesktop) {
      variantItemErrorDesktop.querySelector('.variant-item__error-text').innerHTML = message;
      variantItemErrorDesktop.closest('tr').classList.remove('hidden');
    }
    if (variantItemErrorMobile)
      variantItemErrorMobile.querySelector('.variant-item__error-text').innerHTML = message;

    this.variantItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus = document.getElementById('quick-order-list-live-region-text');
    cartStatus.setAttribute('aria-hidden', false);

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }

  toggleLoading(id, enable) {
    const quickOrderListItems = this.querySelectorAll(`#Variant-${id} .loading__spinner`);
    const quickOrderListItem = this.querySelector(`#Variant-${id}`);

    if (enable) {
      quickOrderListItem.classList.add('quick-order-list__container--disabled');
      [...quickOrderListItems].forEach((overlay) => overlay.classList.remove('hidden'));
      this.variantItemStatusElement.setAttribute('aria-hidden', false);
    } else {
      quickOrderListItem.classList.remove('quick-order-list__container--disabled');
      quickOrderListItems.forEach((overlay) => overlay.classList.add('hidden'));
    }
  }
}
customElements.define('quick-order-list',QuickOrderList);

