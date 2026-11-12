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

    // Optional `x-bind` objects. They carry the ARIA wiring, Escape and
    // backdrop handling so markup cannot forget them.
    dialogTriggerBindings: {
      type: 'button',
      'aria-haspopup': 'dialog',
      ':aria-expanded'() {
        return this.isOpen.toString()
      },
      '@click'() {
        this.openDialog()
      },
    },

    dialogPanelBindings: {
      role: 'dialog',
      'aria-modal': 'true',
      ':aria-labelledby'() {
        return this.dialogTitleId
      },
      ':aria-describedby'() {
        // Re-evaluated on open, once the description element is in the DOM.
        return this.isOpen && document.getElementById(this.dialogDescriptionId)
          ? this.dialogDescriptionId
          : null
      },
      '@keydown.escape.stop'() {
        this.handleEscape()
      },
    },

    dialogBackdropBindings: {
      'aria-hidden': 'true',
      '@click'() {
        this.handleBackdropClick()
      },
    },

    dialogTitleBindings: {
      ':id'() {
        return this.dialogTitleId
      },
    },

    dialogDescriptionBindings: {
      ':id'() {
        return this.dialogDescriptionId
      },
    },

    init() {
      // Ids are always derived so the dialog always has an accessible name.
      const idPrefix = this.dialogId ?? `hux-dialog-${crypto.randomUUID()}`

      this.dialogTitleId = `${idPrefix}-title`
      this.dialogDescriptionId = `${idPrefix}-description`
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

      // `x-trap` returns focus itself. Only step in when focus was lost.
      this.$nextTick(() => {
        const activeElement = document.activeElement

        if (!activeElement || activeElement === document.body) {
          openerElement.focus()
        }
      })
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
