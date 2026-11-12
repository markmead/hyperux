document.addEventListener('alpine:init', () => {
  Alpine.data('huxTreeView', (initialConfig = {}) => ({
    treeItems: [],
    treeId: initialConfig.treeId ?? null,
    expandedItemIds: [],
    selectedItemId: initialConfig.selectedItemId ?? null,
    focusedItemId: null,
    _treeBaseId: null,
    _treeItemMap: null,
    _typeaheadBuffer: '',
    _typeaheadTimeoutId: null,

    normalizeTreeItems(rawTreeItems, itemDepth = 0, maxDepth = 10, seenItemIds = new Set()) {
      if (!Array.isArray(rawTreeItems)) {
        return []
      }

      if (itemDepth > maxDepth) {
        console.error(
          `[huxTreeView] treeItems exceeded maxDepth of ${maxDepth} — check for circular children references`,
        )

        return []
      }

      return rawTreeItems.flatMap((rawTreeItem) => {
        const itemId = typeof rawTreeItem?.id === 'string' ? rawTreeItem.id.trim() : ''
        const itemLabel = typeof rawTreeItem?.label === 'string' ? rawTreeItem.label.trim() : ''

        if (!itemId || !itemLabel) {
          return []
        }

        if (seenItemIds.has(itemId)) {
          console.error(`[huxTreeView] Duplicate tree item id ignored: ${itemId}`)

          return []
        }

        seenItemIds.add(itemId)

        return [
          {
            ...rawTreeItem,
            id: itemId,
            label: itemLabel,
            children: this.normalizeTreeItems(
              rawTreeItem.children,
              itemDepth + 1,
              maxDepth,
              seenItemIds,
            ),
          },
        ]
      })
    },

    init() {
      this.treeItems = this.normalizeTreeItems(initialConfig.treeItems)
      this._treeBaseId = `hux-tree-${this.treeId ?? crypto.randomUUID()}`
      this._treeItemMap = new Map()

      const indexTreeItems = (treeItems, parentItemId) => {
        for (const treeItem of treeItems) {
          this._treeItemMap.set(treeItem.id, { treeItem, parentItemId })
          indexTreeItems(treeItem.children, treeItem.id)
        }
      }

      indexTreeItems(this.treeItems, null)

      this.expandedItemIds = (initialConfig.expandedItemIds ?? []).filter((itemId) =>
        this.hasChildItems(itemId),
      )

      if (this.selectedItemId && !this._treeItemMap.has(this.selectedItemId)) {
        this.selectedItemId = null
      }

      // Reveal the selected item so the roving tabindex lands on a visible item.
      for (const ancestorId of this.ancestorItemIds(this.selectedItemId)) {
        if (!this.expandedItemIds.includes(ancestorId)) {
          this.expandedItemIds.push(ancestorId)
        }
      }

      this.focusedItemId = this.selectedItemId ?? this.treeItems[0]?.id ?? null
    },

    /**
     * The items a user can currently reach, in display order, with the ARIA
     * values each `role="treeitem"` needs.
     */
    get visibleTreeItems() {
      const visibleItems = []

      const visit = (treeItems, itemLevel) => {
        treeItems.forEach((treeItem, itemIndex) => {
          const hasChildren = treeItem.children.length > 0
          const isExpanded = hasChildren && this.expandedItemIds.includes(treeItem.id)

          visibleItems.push({
            treeItem,
            itemLevel,
            positionInSet: itemIndex + 1,
            setSize: treeItems.length,
            hasChildren,
            isExpanded,
          })

          if (isExpanded) {
            visit(treeItem.children, itemLevel + 1)
          }
        })
      }

      visit(this.treeItems, 1)

      return visibleItems
    },

    treeItemElementId(itemId) {
      return `${this._treeBaseId}-item-${itemId}`
    },

    hasChildItems(itemId) {
      return (this._treeItemMap?.get(itemId)?.treeItem.children.length ?? 0) > 0
    },

    isItemExpanded(itemId) {
      return this.expandedItemIds.includes(itemId)
    },

    ancestorItemIds(itemId) {
      const ancestorIds = []
      let parentItemId = this._treeItemMap?.get(itemId)?.parentItemId ?? null

      while (parentItemId) {
        ancestorIds.unshift(parentItemId)
        parentItemId = this._treeItemMap.get(parentItemId)?.parentItemId ?? null
      }

      return ancestorIds
    },

    expandTreeItem(itemId) {
      if (!this.hasChildItems(itemId) || this.isItemExpanded(itemId)) {
        return
      }

      this.expandedItemIds = [...this.expandedItemIds, itemId]
      this.dispatchTreeEvent('expand', itemId)
    },

    collapseTreeItem(itemId) {
      if (!this.isItemExpanded(itemId)) {
        return
      }

      this.expandedItemIds = this.expandedItemIds.filter((expandedId) => expandedId !== itemId)

      // Keep focus on a visible item when its ancestor collapses.
      if (this.ancestorItemIds(this.focusedItemId).includes(itemId)) {
        this.focusedItemId = itemId
      }

      this.dispatchTreeEvent('collapse', itemId)
    },

    toggleTreeItem(itemId) {
      if (this.isItemExpanded(itemId)) {
        this.collapseTreeItem(itemId)

        return
      }

      this.expandTreeItem(itemId)
    },

    selectTreeItem(itemId) {
      if (!this._treeItemMap?.has(itemId)) {
        return
      }

      this.selectedItemId = itemId
      this.focusedItemId = itemId
      this.dispatchTreeEvent('select', itemId)
    },

    focusTreeItem(itemId) {
      if (!this._treeItemMap?.has(itemId)) {
        return
      }

      this.focusedItemId = itemId

      this.$nextTick(() => document.getElementById(this.treeItemElementId(itemId))?.focus())
    },

    focusVisibleItemAt(visibleIndex) {
      const visibleItem = this.visibleTreeItems[visibleIndex]

      if (visibleItem) {
        this.focusTreeItem(visibleItem.treeItem.id)
      }
    },

    expandAllSiblings(itemId) {
      const parentItemId = this._treeItemMap?.get(itemId)?.parentItemId ?? null
      const siblingItems = parentItemId
        ? this._treeItemMap.get(parentItemId).treeItem.children
        : this.treeItems

      for (const siblingItem of siblingItems) {
        this.expandTreeItem(siblingItem.id)
      }
    },

    focusByTypeahead(typedCharacter) {
      const visibleItems = this.visibleTreeItems

      if (visibleItems.length === 0) {
        return
      }

      if (this._typeaheadTimeoutId !== null) {
        clearTimeout(this._typeaheadTimeoutId)
      }

      this._typeaheadBuffer += typedCharacter.toLowerCase()

      this._typeaheadTimeoutId = setTimeout(() => {
        this._typeaheadBuffer = ''
        this._typeaheadTimeoutId = null
      }, 500)

      const currentIndex = visibleItems.findIndex(
        ({ treeItem }) => treeItem.id === this.focusedItemId,
      )
      // A fresh buffer starts after the current item so repeated presses cycle.
      const startOffset = this._typeaheadBuffer.length === 1 ? 1 : 0

      for (let step = startOffset; step < visibleItems.length + startOffset; step += 1) {
        const candidateIndex = (currentIndex + step + visibleItems.length) % visibleItems.length

        if (
          visibleItems[candidateIndex].treeItem.label
            .toLowerCase()
            .startsWith(this._typeaheadBuffer)
        ) {
          this.focusVisibleItemAt(candidateIndex)

          return
        }
      }
    },

    handleTreeKeydown(keyboardEvent) {
      const visibleItems = this.visibleTreeItems
      const currentIndex = visibleItems.findIndex(
        ({ treeItem }) => treeItem.id === this.focusedItemId,
      )
      const currentItem = visibleItems[currentIndex]

      if (!currentItem || keyboardEvent.altKey || keyboardEvent.ctrlKey || keyboardEvent.metaKey) {
        return
      }

      const itemId = currentItem.treeItem.id
      const pressedKey = keyboardEvent.key
      let isHandled = true

      if (pressedKey === 'ArrowDown') {
        this.focusVisibleItemAt(currentIndex + 1)
      } else if (pressedKey === 'ArrowUp') {
        this.focusVisibleItemAt(currentIndex - 1)
      } else if (pressedKey === 'ArrowRight') {
        if (currentItem.hasChildren && !currentItem.isExpanded) {
          this.expandTreeItem(itemId)
        } else if (currentItem.isExpanded) {
          this.focusTreeItem(currentItem.treeItem.children[0].id)
        }
      } else if (pressedKey === 'ArrowLeft') {
        if (currentItem.isExpanded) {
          this.collapseTreeItem(itemId)
        } else {
          const parentItemId = this._treeItemMap.get(itemId)?.parentItemId

          if (parentItemId) {
            this.focusTreeItem(parentItemId)
          }
        }
      } else if (pressedKey === 'Home') {
        this.focusVisibleItemAt(0)
      } else if (pressedKey === 'End') {
        this.focusVisibleItemAt(visibleItems.length - 1)
      } else if (pressedKey === 'Enter' || pressedKey === ' ') {
        this.selectTreeItem(itemId)
      } else if (pressedKey === '*') {
        this.expandAllSiblings(itemId)
      } else if (pressedKey.length === 1 && pressedKey.trim() !== '') {
        this.focusByTypeahead(pressedKey)
      } else {
        isHandled = false
      }

      if (isHandled) {
        keyboardEvent.preventDefault()
      }
    },

    dispatchTreeEvent(eventName, itemId) {
      const treeItem = this._treeItemMap?.get(itemId)?.treeItem ?? null
      const eventDetail = { treeId: this.treeId, itemId, treeItem }

      if (this.treeId) {
        this.$dispatch(`hux-tree-view:${this.treeId}:${eventName}`, eventDetail)
      }

      this.$dispatch(`hux-tree-view:${eventName}`, eventDetail)
    },
  }))
})
