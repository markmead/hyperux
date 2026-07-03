document.addEventListener('alpine:init', () => {
  Alpine.data('huxDropdown', (initialConfig = {}) => ({
    isOpen: false,
    focusedIndex: -1,
    menuItems: [],
    triggerId: null,
    menuId: null,
    triggerButtonId: null,
    menuItemIds: [],
    triggerRefName: initialConfig.triggerRef ?? 'dropdownTrigger',

    normalizeMenuItems(rawMenuItems, itemDepth = 0, maxDepth = 5, parentLabel = null) {
      if (!Array.isArray(rawMenuItems)) {
        return []
      }

      if (itemDepth > maxDepth) {
        console.error(
          `[huxDropdown] normalizeMenuItems exceeded maxDepth of ${maxDepth} — check for circular children references`,
        )

        return []
      }

      return rawMenuItems.flatMap((rawMenuItem) => {
        if (!rawMenuItem || typeof rawMenuItem !== 'object') {
          return []
        }

        const normalizedLabel =
          typeof rawMenuItem.label === 'string' ? rawMenuItem.label.trim() : ''
        const hasAction = typeof rawMenuItem.action === 'string' && rawMenuItem.action.trim() !== ''
        const hasHref = typeof rawMenuItem.href === 'string' && rawMenuItem.href.trim() !== ''

        const normalizedItem =
          normalizedLabel && (hasHref || hasAction)
            ? [
                {
                  label: normalizedLabel,
                  href: hasHref ? rawMenuItem.href : undefined,
                  action: hasAction ? rawMenuItem.action : undefined,
                  target: rawMenuItem.target,
                  itemDepth,
                  parentLabel,
                },
              ]
            : []

        const normalizedChildren = this.normalizeMenuItems(
          rawMenuItem.children,
          itemDepth + 1,
          maxDepth,
          normalizedLabel,
        )

        return [...normalizedItem, ...normalizedChildren]
      })
    },

    init() {
      this.menuItems = this.normalizeMenuItems(initialConfig.menuItems)

      this.triggerId = initialConfig.triggerId ?? null

      const idSuffix = this.triggerId ?? crypto.randomUUID()

      this.menuId = `hux-dropdown-menu-${idSuffix}`
      this.triggerButtonId = `hux-dropdown-trigger-${idSuffix}`

      this.menuItemIds = this.menuItems.map(
        (_, menuItemIndex) => `${this.menuId}-item-${menuItemIndex}`,
      )
    },

    openMenu() {
      this.isOpen = true
    },

    closeMenu(restoreFocus = false) {
      this.isOpen = false
      this.focusedIndex = -1

      if (restoreFocus) {
        this.$nextTick(() => this.$refs[this.triggerRefName]?.focus())
      }
    },

    toggleMenu() {
      if (this.isOpen) {
        this.closeMenu(true)

        return
      }

      this.openMenu()
    },

    focusItem(itemIndex) {
      this.focusedIndex = itemIndex

      this.$nextTick(() => {
        const menuItemElement = document.getElementById(this.menuItemIds[itemIndex])

        menuItemElement?.focus()
      })
    },

    focusFirstItem() {
      if (this.menuItems.length > 0) {
        this.focusItem(0)
      }
    },

    focusLastItem() {
      if (this.menuItems.length > 0) {
        this.focusItem(this.menuItems.length - 1)
      }
    },

    focusNextItem() {
      const menuItemCount = this.menuItems.length

      if (menuItemCount === 0) {
        return
      }

      const nextIndex = this.focusedIndex < menuItemCount - 1 ? this.focusedIndex + 1 : 0

      this.focusItem(nextIndex)
    },

    focusPreviousItem() {
      const menuItemCount = this.menuItems.length

      if (menuItemCount === 0) {
        return
      }

      const prevIndex = this.focusedIndex > 0 ? this.focusedIndex - 1 : menuItemCount - 1

      this.focusItem(prevIndex)
    },

    findMenuItem(itemLabel) {
      return this.menuItems.find((menuItem) => menuItem.label === itemLabel) ?? null
    },

    resolveActionEventName(rawEventName) {
      if (typeof rawEventName !== 'string') {
        return null
      }

      const normalizedEventName = rawEventName.trim()

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedEventName)) {
        console.error(
          `[huxDropdown] Action event names must be hyphen-case. Received: ${rawEventName}`,
        )

        return null
      }

      return normalizedEventName
    },

    selectItem(menuItem) {
      if (!menuItem) {
        return
      }

      if (!menuItem.href && menuItem.action) {
        const normalizedActionEventName = this.resolveActionEventName(menuItem.action)

        if (!normalizedActionEventName) {
          this.closeMenu(true)

          return
        }

        const actionEventDetail = {
          action: menuItem.action,
          eventName: normalizedActionEventName,
          item: menuItem,
          triggerId: this.triggerId,
        }

        if (this.triggerId) {
          this.$dispatch(
            `hux-dropdown:${this.triggerId}:${normalizedActionEventName}`,
            actionEventDetail,
          )
        }

        this.$dispatch(`hux-dropdown:${normalizedActionEventName}`, actionEventDetail)

        this.closeMenu(true)

        return
      }

      this.closeMenu()
    },
  }))
})
