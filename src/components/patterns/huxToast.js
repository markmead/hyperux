document.addEventListener('alpine:init', () => {
  Alpine.data('huxToast', (initialConfig = {}) => ({
    toastId: initialConfig.toastId ?? null,
    dismissDelay: 5000,
    maxVisibleToasts: Math.max(1, initialConfig.maxVisibleToasts ?? 3),
    toastItems: [],
    queuedToastItems: [],
    _toastTimers: null,
    _toastCounter: 0,
    _pauseReasons: new Set(),
    _removeToastListeners: null,

    init() {
      this.dismissDelay = this.normalizeDismissDelay(initialConfig.dismissDelay, 5000)
      this._toastTimers = new Map()

      // Requests to show a toast arrive on `window`, so any script can raise one.
      const showEventName = this.toastId ? `hux-toast:${this.toastId}:show` : 'hux-toast:show'

      const handleShowEvent = (showEvent) => this.showToast(showEvent.detail ?? {})
      const handleVisibilityChange = () => {
        if (document.hidden) {
          this.pauseToastTimers('page-hidden')
        } else {
          this.resumeToastTimers('page-hidden')
        }
      }

      window.addEventListener(showEventName, handleShowEvent)
      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Apply the current state too: a tab can start hidden.
      handleVisibilityChange()

      this._removeToastListeners = () => {
        window.removeEventListener(showEventName, handleShowEvent)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    },

    destroy() {
      this._removeToastListeners?.()

      for (const toastTimer of this._toastTimers.values()) {
        clearTimeout(toastTimer.timeoutId)
      }

      this._toastTimers.clear()
    },

    // Hover, focus and a hidden page each pause independently.
    get isPaused() {
      return this._pauseReasons.size > 0
    },

    normalizeDismissDelay(rawDismissDelay, fallbackDelay) {
      // Only finite, non-negative numbers count; `0` disables auto-dismiss.
      return Number.isFinite(rawDismissDelay) && rawDismissDelay >= 0
        ? rawDismissDelay
        : fallbackDelay
    },

    showToast(toastConfig = {}) {
      const toastMessage = typeof toastConfig.message === 'string' ? toastConfig.message.trim() : ''

      if (!toastMessage) {
        console.error('[huxToast] showToast() needs a non-empty message')

        return null
      }

      this._toastCounter += 1

      const toastItem = {
        id: `${this.toastId ?? 'hux-toast'}-${this._toastCounter}`,
        message: toastMessage,
        title: typeof toastConfig.title === 'string' ? toastConfig.title : '',
        toastType: ['info', 'success', 'warning', 'error'].includes(toastConfig.toastType)
          ? toastConfig.toastType
          : 'info',
        dismissDelay: this.normalizeDismissDelay(toastConfig.dismissDelay, this.dismissDelay),
      }

      if (this.toastItems.length < this.maxVisibleToasts) {
        this.revealToast(toastItem)
      } else {
        this.queuedToastItems.push(toastItem)
      }

      return toastItem.id
    },

    revealToast(toastItem) {
      this.toastItems.push(toastItem)

      if (toastItem.dismissDelay > 0) {
        this._toastTimers.set(toastItem.id, {
          remainingTime: toastItem.dismissDelay,
          startedAt: null,
          timeoutId: null,
        })

        if (!this.isPaused) {
          this.startToastTimer(toastItem.id)
        }
      }

      this.dispatchToastEvent('reveal', toastItem)
    },

    startToastTimer(itemId) {
      const toastTimer = this._toastTimers.get(itemId)

      if (!toastTimer || toastTimer.timeoutId !== null) {
        return
      }

      toastTimer.startedAt = Date.now()
      toastTimer.timeoutId = setTimeout(() => this.dismissToast(itemId), toastTimer.remainingTime)
    },

    stopToastTimer(itemId) {
      const toastTimer = this._toastTimers.get(itemId)

      if (!toastTimer || toastTimer.timeoutId === null) {
        return
      }

      clearTimeout(toastTimer.timeoutId)
      toastTimer.remainingTime = Math.max(
        0,
        toastTimer.remainingTime - (Date.now() - toastTimer.startedAt),
      )
      toastTimer.timeoutId = null
    },

    pauseToastTimers(pauseReason = 'manual') {
      const wasPaused = this.isPaused

      this._pauseReasons.add(pauseReason)

      if (wasPaused) {
        return
      }

      for (const itemId of this._toastTimers.keys()) {
        this.stopToastTimer(itemId)
      }
    },

    resumeToastTimers(pauseReason = 'manual') {
      const wasPaused = this.isPaused

      this._pauseReasons.delete(pauseReason)

      if (!wasPaused || this.isPaused) {
        return
      }

      for (const itemId of this._toastTimers.keys()) {
        this.startToastTimer(itemId)
      }
    },

    dismissToast(itemId) {
      const toastIndex = this.toastItems.findIndex((toastItem) => toastItem.id === itemId)

      if (toastIndex === -1) {
        return
      }

      const [toastItem] = this.toastItems.splice(toastIndex, 1)

      clearTimeout(this._toastTimers.get(itemId)?.timeoutId)
      this._toastTimers.delete(itemId)

      this.dispatchToastEvent('dismiss', toastItem)

      const nextToastItem = this.queuedToastItems.shift()

      if (nextToastItem) {
        this.revealToast(nextToastItem)
      }
    },

    clearAllToasts() {
      this.queuedToastItems = []

      for (const toastItem of [...this.toastItems]) {
        this.dismissToast(toastItem.id)
      }
    },

    dispatchToastEvent(eventName, toastItem) {
      const eventDetail = { toastId: this.toastId, toastItem }

      if (this.toastId) {
        this.$dispatch(`hux-toast:${this.toastId}:${eventName}`, eventDetail)
      }

      this.$dispatch(`hux-toast:${eventName}`, eventDetail)
    },
  }))
})
