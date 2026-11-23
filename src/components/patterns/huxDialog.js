document.addEventListener('alpine:init', () => {
  Alpine.data('huxDialog', (initialConfig = {}) => ({
    isOpen: initialConfig.startsOpen ?? false,
    dialogId: initialConfig.dialogId ?? null,
    isPersistent: initialConfig.isPersistent ?? false,
    isSeamless: initialConfig.isSeamless ?? false,
    returnFocusOnClose: initialConfig.returnFocusOnClose ?? true,
    dialogTitleId: null,
    dialogDescriptionId: null,
    _dialogOpenerElement: null,

    get closeOnBackdrop() {
      return !this.isPersistent
    },

    get closeOnEscape() {
      return !this.isPersistent
    },

    get showBackdrop() {
      return !this.isSeamless
    },

    init() {
      this.dialogTitleId = this.dialogId ? `${this.dialogId}-title` : null
      this.dialogDescriptionId = this.dialogId ? `${this.dialogId}-description` : null
    },

    openDialog() {
      if (!this.isOpen) {
        this._dialogOpenerElement = document.activeElement
      }

      this.isOpen = true
      this.dispatchDialogEvent('open')
    },

    toggleDialog() {
      if (this.isOpen) {
        this.closeDialog()
        return
      }

      this.openDialog()
    },

    closeDialog() {
      const wasOpen = this.isOpen

      this.isOpen = false
      this.dispatchDialogEvent('close')

      if (wasOpen) {
        this.restoreOpenerFocus()
      }
    },

    restoreOpenerFocus() {
      const openerElement = this._dialogOpenerElement

      this._dialogOpenerElement = null

      if (!this.returnFocusOnClose || !openerElement?.isConnected) {
        return
      }

      // `x-trap` usually returns focus itself, but a leave transition keeps the
      // focused element visible until it ends, and focus then drops to the body.
      // Watch for up to a second: restore focus once it is lost, and stop as soon
      // as something else moves it.
      const focusedAtClose = document.activeElement
      const watchDeadline = performance.now() + 1000

      const watchFocus = () => {
        const activeElement = document.activeElement
        const isFocusLost =
          !activeElement ||
          activeElement === document.body ||
          activeElement.checkVisibility?.() === false

        if (isFocusLost) {
          openerElement.focus()

          return
        }

        if (activeElement === focusedAtClose && performance.now() < watchDeadline) {
          requestAnimationFrame(watchFocus)
        }
      }

      this.$nextTick(watchFocus)
    },

    handleBackdropClick() {
      if (this.closeOnBackdrop) {
        this.closeDialog()
      }
    },

    handleEscape() {
      if (this.closeOnEscape) {
        this.closeDialog()
      }
    },

    dispatchDialogEvent(eventName) {
      const scopedEventName = this.dialogId
        ? `hux-dialog:${this.dialogId}:${eventName}`
        : `hux-dialog:${eventName}`

      this.$dispatch(scopedEventName, {
        dialogId: this.dialogId,
      })
    },
  }))
})
