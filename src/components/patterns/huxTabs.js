document.addEventListener('alpine:init', () => {
  Alpine.data('huxTabs', (initialConfig = {}) => ({
    activeTabId: initialConfig.activeTab ?? null,
    tabItems: [],
    useHash: initialConfig.useHash ?? false,
    tabsId: initialConfig.id ?? null,
    _tabElements: null,

    init() {
      this.tabItems = (initialConfig.tabItems ?? []).filter(
        (tabItem) => tabItem?.label && tabItem?.id,
      )

      const validIds = this.tabItems.map((tabItem) => tabItem.id)

      if (this.useHash && typeof globalThis.location !== 'undefined') {
        let hashId = globalThis.location.hash.slice(1)

        try {
          hashId = decodeURIComponent(hashId)
        } catch {
          // malformed percent-encoding; use raw hash value
        }

        if (hashId && validIds.includes(hashId)) {
          this.activeTabId = hashId
        }
      }

      if (!this.activeTabId || !validIds.includes(this.activeTabId)) {
        this.activeTabId = this.tabItems.length > 0 ? this.tabItems[0].id : null
      }

      this.$nextTick(() => {
        this._tabElements = [...this.$el.querySelectorAll('[role="tab"]')]

        if (this.tabsId) {
          // Defer initial event so all huxTabPanel instances in the current render
          // have had a chance to register their window listeners in init().
          this._dispatchChangeEvent()
        }
      })
    },

    get activeTabIndex() {
      const foundIndex = this.findTabIndex(this.activeTabId)

      return foundIndex >= 0 ? foundIndex : 0
    },

    findTabIndex(tabId) {
      return this.tabItems.findIndex((tabItem) => tabItem.id === tabId)
    },

    _dispatchChangeEvent() {
      if (this.activeTabId === null) {
        return
      }

      window.dispatchEvent(
        new CustomEvent(`hux-tabs:${this.tabsId}:change`, {
          detail: { tabId: this.activeTabId },
        }),
      )
    },

    selectTab(tabId) {
      const tabExists = this.findTabIndex(tabId) >= 0

      if (!tabExists) {
        return
      }

      this.activeTabId = tabId

      if (this.useHash && typeof globalThis.history !== 'undefined') {
        history.replaceState(null, '', `#${encodeURIComponent(tabId)}`)
      }

      if (this.tabsId) {
        this._dispatchChangeEvent()
      }
    },

    focusTab(tabId) {
      const tabIndex = this.findTabIndex(tabId)

      if (tabIndex === -1) return

      this._tabElements?.[tabIndex]?.focus()
    },

    focusNextTab() {
      if (this.tabItems.length === 0) return

      const currentIndex = this.activeTabIndex
      const nextIndex = currentIndex < this.tabItems.length - 1 ? currentIndex + 1 : 0
      const nextTabId = this.tabItems[nextIndex].id

      this.selectTab(nextTabId)
      this.focusTab(nextTabId)
    },

    focusPreviousTab() {
      if (this.tabItems.length === 0) return

      const currentIndex = this.activeTabIndex
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : this.tabItems.length - 1
      const prevTabId = this.tabItems[prevIndex].id

      this.selectTab(prevTabId)
      this.focusTab(prevTabId)
    },

    focusFirstTab() {
      if (this.tabItems.length === 0) return

      const firstTabId = this.tabItems[0].id

      this.selectTab(firstTabId)
      this.focusTab(firstTabId)
    },

    focusLastTab() {
      if (this.tabItems.length === 0) return

      const lastTabId = this.tabItems.at(-1).id

      this.selectTab(lastTabId)
      this.focusTab(lastTabId)
    },
  }))
})
