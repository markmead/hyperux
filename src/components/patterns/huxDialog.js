document.addEventListener('alpine:init', () => {
  Alpine.data('huxDialog', (initialConfig = {}) => ({
    isOpen: initialConfig.startsOpen ?? false,
    dialogId: initialConfig.dialogId ?? null,
    isPersistent: initialConfig.isPersistent ?? false,
    isSeamless: initialConfig.isSeamless ?? false,
    dialogTitleId: null,

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
    },

    openDialog() {
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
      this.isOpen = false
      this.dispatchDialogEvent('close')
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
