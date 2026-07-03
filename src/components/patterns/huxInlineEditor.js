document.addEventListener('alpine:init', () => {
  Alpine.data('huxInlineEditor', (initialConfig = {}) => ({
    isEditing: false,
    inputValue: typeof initialConfig.inputValue === 'string' ? initialConfig.inputValue : '',
    draftValue: typeof initialConfig.inputValue === 'string' ? initialConfig.inputValue : '',
    editorId: initialConfig.editorId ?? null,
    inputTemplateRefName: initialConfig.inputTemplateRef ?? 'inlineEditorInput',
    focusTrapTemplateRefName: initialConfig.focusTrapTemplateRef ?? 'inlineEditor',
    returnFocusTemplateRefName: initialConfig.returnFocusTemplateRef ?? null,
    _returnFocusElement: null,
    _activeInputElement: null,
    _focusInputRetryFrameId: null,

    get hasChanges() {
      return this.draftValue !== this.inputValue
    },

    enterEditMode() {
      this.cancelFocusInputRetry()
      this._returnFocusElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null

      this.draftValue = this.inputValue
      this.isEditing = true

      this.$nextTick(() => {
        this.focusInputWithRetry()
      })
    },

    commitChanges() {
      this.cancelFocusInputRetry()
      this.inputValue = this.draftValue
      this.isEditing = false
      this._activeInputElement = null
      this.restoreFocus()
      this.dispatchEditorEvent('commit')
    },

    revertChanges() {
      this.cancelFocusInputRetry()
      this.draftValue = this.inputValue
      this.isEditing = false
      this._activeInputElement = null
      this.restoreFocus()
      this.dispatchEditorEvent('revert')
    },

    handleInputFocus(event) {
      this.selectInputText(event?.target ?? null)
    },

    registerInput(targetElement) {
      if (
        !(targetElement instanceof HTMLInputElement) &&
        !(targetElement instanceof HTMLTextAreaElement)
      ) {
        return
      }

      this._activeInputElement = targetElement

      if (!this.isEditing) {
        return
      }

      targetElement.focus()
      this.selectInputText(targetElement)
    },

    handleInputKeydown(event) {
      if (event.key === 'Enter') {
        if (event.target instanceof HTMLTextAreaElement) {
          return
        }

        event.preventDefault()
        this.commitChanges()

        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        this.revertChanges()
      }
    },

    trapFocus(event) {
      if (!this.isEditing || event.key !== 'Tab') {
        return
      }

      const focusableElements = this.getFocusableElements()

      if (focusableElements.length === 0) {
        event.preventDefault()

        return
      }

      const firstFocusableElement = focusableElements[0]
      const lastFocusableElement = focusableElements.at(-1)
      const activeElement = document.activeElement

      if (event.shiftKey && activeElement === firstFocusableElement) {
        event.preventDefault()
        lastFocusableElement.focus()

        return
      }

      if (!event.shiftKey && activeElement === lastFocusableElement) {
        event.preventDefault()
        firstFocusableElement.focus()
      }
    },

    selectInputText(targetElement) {
      if (
        !(targetElement instanceof HTMLInputElement) &&
        !(targetElement instanceof HTMLTextAreaElement)
      ) {
        return
      }

      targetElement.select()
    },

    resolveInputElement() {
      if (
        this._activeInputElement instanceof HTMLInputElement ||
        this._activeInputElement instanceof HTMLTextAreaElement
      ) {
        return this._activeInputElement
      }

      const inputElement = this.$refs[this.inputTemplateRefName]

      if (inputElement instanceof HTMLInputElement || inputElement instanceof HTMLTextAreaElement) {
        return inputElement
      }

      const focusTrapRoot = this.$refs[this.focusTrapTemplateRefName] ?? this.$el

      if (!(focusTrapRoot instanceof HTMLElement)) {
        return null
      }

      const fallbackInputElement = focusTrapRoot.querySelector('input, textarea')

      if (
        fallbackInputElement instanceof HTMLInputElement ||
        fallbackInputElement instanceof HTMLTextAreaElement
      ) {
        return fallbackInputElement
      }

      return null
    },

    focusInputWithRetry(remainingAttempts = 5) {
      if (!this.isEditing) {
        this.cancelFocusInputRetry()
        return
      }

      const inputElement = this.resolveInputElement()

      if (inputElement) {
        this.cancelFocusInputRetry()
        inputElement.focus()
        this.selectInputText(inputElement)

        return
      }

      if (remainingAttempts <= 0) {
        this.cancelFocusInputRetry()
        console.error(
          `[huxInlineEditor] Unable to resolve input or textarea target for ${this.inputTemplateRefName}.`,
        )

        return
      }

      this._focusInputRetryFrameId = requestAnimationFrame(() => {
        this._focusInputRetryFrameId = null
        this.focusInputWithRetry(remainingAttempts - 1)
      })
    },

    cancelFocusInputRetry() {
      if (typeof this._focusInputRetryFrameId !== 'number') {
        return
      }

      cancelAnimationFrame(this._focusInputRetryFrameId)
      this._focusInputRetryFrameId = null
    },

    getFocusableElements() {
      const focusTrapRoot = this.$refs[this.focusTrapTemplateRefName] ?? this.$el

      return this.getFocusableElementsFromRoot(focusTrapRoot)
    },

    getFocusableElementsFromRoot(rootElement) {
      if (!(rootElement instanceof HTMLElement)) {
        return []
      }

      return [
        ...rootElement.querySelectorAll(
          '[tabindex]:not([tabindex="-1"]), a[href], button, input, select, textarea',
        ),
      ]
        .filter((focusableElement) => focusableElement instanceof HTMLElement)
        .filter(
          (focusableElement) =>
            focusableElement.tabIndex >= 0 &&
            !focusableElement.hasAttribute('disabled') &&
            focusableElement.getAttribute('aria-hidden') !== 'true',
        )
    },

    resolveReturnFocusElement(returnFocusElement) {
      if (returnFocusElement instanceof HTMLElement && returnFocusElement.isConnected) {
        return returnFocusElement
      }

      const refBasedFocusElement = this.returnFocusTemplateRefName
        ? this.$refs[this.returnFocusTemplateRefName]
        : null

      if (refBasedFocusElement instanceof HTMLElement && refBasedFocusElement.isConnected) {
        return refBasedFocusElement
      }

      const fallbackFocusableElement = this.getFocusableElementsFromRoot(this.$el).at(0)

      if (fallbackFocusableElement instanceof HTMLElement) {
        return fallbackFocusableElement
      }

      return null
    },

    restoreFocus() {
      const returnFocusElement = this._returnFocusElement

      this._returnFocusElement = null

      this.$nextTick(() => {
        const focusTarget = this.resolveReturnFocusElement(returnFocusElement)

        if (!focusTarget) {
          return
        }

        focusTarget.focus()
      })
    },

    dispatchEditorEvent(eventName) {
      const scopedEventName = this.editorId
        ? `hux-inline-editor:${this.editorId}:${eventName}`
        : `hux-inline-editor:${eventName}`

      this.$dispatch(scopedEventName, {
        editorId: this.editorId,
        inputValue: this.inputValue,
      })
    },
  }))
})
