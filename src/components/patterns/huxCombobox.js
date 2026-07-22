document.addEventListener('alpine:init', () => {
  Alpine.data('huxCombobox', (initialConfig = {}) => ({
    isOpen: false,
    searchQuery: '',
    selectedValue: '',
    selectedValues: [],
    acceptMultiple: initialConfig.acceptMultiple ?? false,
    clearSelectionOnInputClear: initialConfig.clearSelectionOnInputClear ?? false,
    hideOptionItemsWhenSearchQueryEmpty: initialConfig.hideOptionItemsWhenSearchQueryEmpty ?? false,
    focusedIndex: -1,
    comboboxInputId: null,
    listboxId: null,
    optionItems: [],
    inputTemplateRefName: initialConfig.inputTemplateRef ?? 'comboboxInput',
    listboxTemplateRefName: initialConfig.listboxTemplateRef ?? 'comboboxListbox',

    init() {
      const rawOptionItems = Array.isArray(initialConfig.optionItems)
        ? initialConfig.optionItems
        : []

      this.optionItems = rawOptionItems.filter(
        (optionItem) =>
          optionItem &&
          typeof optionItem.label === 'string' &&
          typeof optionItem.value === 'string',
      )

      this.configureTemplateRefs()
    },

    get filteredOptionItems() {
      const normalizedSearchQuery = this.searchQuery.trim().toLowerCase()

      if (this.hideOptionItemsWhenSearchQueryEmpty && normalizedSearchQuery === '') {
        return []
      }

      return this.optionItems
        .map((optionItem, sourceIndex) => ({ optionItem, sourceIndex }))
        .filter(({ optionItem }) => optionItem.label.toLowerCase().includes(normalizedSearchQuery))
    },

    get activeDescendantId() {
      if (!this.isOpen || this.focusedIndex < 0) {
        return null
      }

      const focusedOptionItem = this.filteredOptionItems[this.focusedIndex]

      if (!focusedOptionItem) {
        return null
      }

      return this.optionItemId(focusedOptionItem.sourceIndex)
    },

    ensureElementId(targetElement, fallbackPrefix, templateRefName) {
      const fallbackId = `${fallbackPrefix}-${crypto.randomUUID()}`

      if (!targetElement) {
        console.error(
          `[huxCombobox] Missing x-ref target for ${templateRefName}. Falling back to generated id ${fallbackId}`,
        )

        return fallbackId
      }

      if (targetElement.id) {
        return targetElement.id
      }

      targetElement.id = fallbackId

      return fallbackId
    },

    configureTemplateRefs() {
      const inputElement = this.$refs[this.inputTemplateRefName] ?? null
      const listboxElement = this.$refs[this.listboxTemplateRefName] ?? null

      this.comboboxInputId = this.ensureElementId(
        inputElement,
        'combo-box-input',
        this.inputTemplateRefName,
      )

      this.listboxId = this.ensureElementId(
        listboxElement,
        'combo-box-listbox',
        this.listboxTemplateRefName,
      )
    },

    optionItemId(sourceIndex) {
      return `${this.listboxId}-option-${sourceIndex}`
    },

    openList() {
      if (this.hideOptionItemsWhenSearchQueryEmpty && this.searchQuery.trim() === '') {
        return
      }

      this.isOpen = true
    },

    closeList() {
      this.isOpen = false
      this.focusedIndex = -1
    },

    onInputChange() {
      if (
        this.clearSelectionOnInputClear &&
        !this.acceptMultiple &&
        this.searchQuery.trim() === ''
      ) {
        this.clearSelection()
      }

      if (this.hideOptionItemsWhenSearchQueryEmpty && this.searchQuery.trim() === '') {
        this.closeList()

        return
      }

      this.isOpen = true
      this.focusedIndex = -1
    },

    focusNextOptionItem() {
      const totalItems = this.filteredOptionItems.length

      if (totalItems === 0) {
        this.openList()
        this.focusedIndex = -1

        return
      }

      this.openList()

      this.focusedIndex = Math.min(this.focusedIndex + 1, totalItems - 1)

      this.scrollFocusedOptionItemIntoView()
    },

    focusPreviousOptionItem() {
      const totalItems = this.filteredOptionItems.length

      if (totalItems === 0) {
        this.openList()
        this.focusedIndex = -1

        return
      }

      this.openList()

      if (this.focusedIndex <= 0) {
        this.focusedIndex = 0
      } else {
        this.focusedIndex -= 1
      }

      this.scrollFocusedOptionItemIntoView()
    },

    scrollFocusedOptionItemIntoView() {
      this.$nextTick(() => {
        const focusedOptionId = this.activeDescendantId

        if (!focusedOptionId) {
          return
        }

        const focusedOptionElement = document.getElementById(focusedOptionId)

        focusedOptionElement?.scrollIntoView({ block: 'nearest' })
      })
    },

    selectFocusedOptionItem() {
      if (this.focusedIndex >= 0 && this.filteredOptionItems[this.focusedIndex]) {
        this.toggleOptionItem(this.filteredOptionItems[this.focusedIndex].optionItem)
      }
    },

    isOptionSelected(optionItem) {
      return this.acceptMultiple
        ? this.selectedValues.includes(optionItem.value)
        : this.selectedValue === optionItem.value
    },

    toggleOptionItem(optionItem) {
      if (!this.acceptMultiple) {
        this.selectOptionItem(optionItem)

        return
      }

      const selectedItemIndex = this.selectedValues.indexOf(optionItem.value)

      if (selectedItemIndex >= 0) {
        this.selectedValues.splice(selectedItemIndex, 1)
      } else {
        this.selectedValues.push(optionItem.value)
      }

      this.searchQuery = ''

      if (this.hideOptionItemsWhenSearchQueryEmpty) {
        this.closeList()
      } else {
        this.openList()
      }

      this.focusedIndex = -1
    },

    selectOptionItem(optionItem) {
      this.selectedValue = optionItem.value
      this.searchQuery = optionItem.label

      this.closeList()
    },

    clearSelection() {
      this.selectedValue = ''
      this.selectedValues = []
      this.searchQuery = ''
      this.focusedIndex = -1
    },

    removeSelectedOptionItem(selectedValue) {
      if (!this.acceptMultiple) {
        this.clearSelection()

        return
      }

      this.selectedValues = this.selectedValues.filter(
        (existingSelectedValue) => existingSelectedValue !== selectedValue,
      )

      this.focusedIndex = -1
    },

    getLabelForValue(selectedValue) {
      const matchedOptionItem = this.optionItems.find(
        (optionItem) => optionItem.value === selectedValue,
      )

      return matchedOptionItem ? matchedOptionItem.label : String(selectedValue)
    },
  }))
})
