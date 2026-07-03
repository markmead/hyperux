document.addEventListener('alpine:init', () => {
  Alpine.data('huxTabPanel', (initialConfig = {}) => ({
    tabsId: initialConfig.tabsId ?? null,
    tabId: initialConfig.tabId ?? null,
    isActive: initialConfig.startsActive ?? false,
    _changeHandler: null,

    init() {
      if (!this.tabsId || !this.tabId) {
        console.error('[huxTabPanel] "tabsId" and "tabId" are required.')

        return
      }

      this._changeHandler = (event) => {
        this.isActive = event.detail?.tabId === this.tabId
      }

      window.addEventListener(`hux-tabs:${this.tabsId}:change`, this._changeHandler)
    },

    destroy() {
      if (this._changeHandler) {
        window.removeEventListener(`hux-tabs:${this.tabsId}:change`, this._changeHandler)
        this._changeHandler = null
      }
    },
  }))
})
