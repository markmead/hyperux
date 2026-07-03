document.addEventListener('alpine:init', () => {
  Alpine.data('huxCommandPalette', (initialConfig = {}) => ({
    paletteItems: initialConfig.paletteItems ?? [],
    paletteId: initialConfig.paletteId ?? null,
    shortcutKey: (initialConfig.shortcutKey ?? 'k').toLowerCase(),
    shortcutHint: '',
    _paletteItemMap: null,

    init() {
      this.paletteItems = this.paletteItems.filter(
        (paletteItem) => paletteItem?.label && (paletteItem?.href || paletteItem?.action),
      )

      this._paletteItemMap = new Map(
        this.paletteItems.map((paletteItem) => [paletteItem.label, paletteItem]),
      )

      const uppercaseShortcutKey = this.shortcutKey.toUpperCase()

      const platformString = navigator.userAgentData?.platform ?? navigator.platform ?? ''

      this.shortcutHint = /mac/i.test(platformString)
        ? `Command + ${uppercaseShortcutKey}`
        : `Control + ${uppercaseShortcutKey}`
    },

    handleGlobalShortcut(event) {
      const pressedKey = event.key.toLowerCase()

      if (pressedKey !== this.shortcutKey) {
        return
      }

      if (!event.metaKey && !event.ctrlKey) {
        return
      }

      const target = event.target
      const tagName = target?.tagName?.toLowerCase()

      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
        return
      }

      event.preventDefault()

      this.openDialog()
    },

    findPaletteItem(itemLabel) {
      return this._paletteItemMap?.get(itemLabel) ?? null
    },

    resolveActionEventName(rawEventName) {
      if (typeof rawEventName !== 'string') {
        return null
      }

      const normalizedEventName = rawEventName.trim()

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedEventName)) {
        console.error(
          `[huxCommandPalette] Action event names must be hyphen-case. Received: ${rawEventName}`,
        )

        return null
      }

      return normalizedEventName
    },

    selectItem(itemLabel) {
      const selectedItem = this.findPaletteItem(itemLabel)

      if (!selectedItem) {
        return null
      }

      if (selectedItem.href) {
        if (selectedItem.target === '_blank') {
          globalThis.open(selectedItem.href, '_blank', 'noopener,noreferrer')

          return selectedItem
        }

        globalThis.location.assign(selectedItem.href)

        return selectedItem
      }

      const normalizedActionEventName = this.resolveActionEventName(selectedItem.action)

      if (!normalizedActionEventName) {
        return selectedItem
      }

      const actionEventDetail = {
        action: selectedItem.action,
        eventName: normalizedActionEventName,
        item: selectedItem,
        paletteId: this.paletteId,
      }

      const actionEventName = this.paletteId
        ? `hux-command-palette:${this.paletteId}:${normalizedActionEventName}`
        : `hux-command-palette:${normalizedActionEventName}`

      this.$dispatch(actionEventName, actionEventDetail)

      return selectedItem
    },
  }))
})
