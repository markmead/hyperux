document.addEventListener('alpine:init', () => {
  Alpine.data('huxResizable', (initialConfig = {}) => ({
    currentWidth: 0,
    minWidth: initialConfig.minWidth ?? 375,
    maxWidth: initialConfig.maxWidth ?? null,
    preventOverflow: initialConfig.preventOverflow ?? true,
    stopAtLastBreakpoint: initialConfig.stopAtLastBreakpoint ?? false,
    iframeSrc: initialConfig.iframeSrc ?? null,
    breakpointItems: [],
    activeBreakpoint: null,

    _dragStartX: 0,
    _dragStartWidth: 0,
    _boundOnDragMove: null,
    _boundOnDragEnd: null,
    _resizeObserver: null,

    init() {
      if (this.maxWidth !== null && this.maxWidth < this.minWidth) {
        console.warn('[huxResizable] maxWidth cannot be less than minWidth, clamping to minWidth')
        this.maxWidth = this.minWidth
      }

      const defaultBreakpoints = [
        { label: 'xs', minWidth: 0 },
        { label: 'sm', minWidth: 640 },
        { label: 'md', minWidth: 768 },
        { label: 'lg', minWidth: 1024 },
        { label: 'xl', minWidth: 1280 },
      ]

      const rawBreakpoints = Array.isArray(initialConfig.breakpointItems)
        ? initialConfig.breakpointItems
        : defaultBreakpoints

      this.breakpointItems = rawBreakpoints
        .filter(
          (breakpointItem) =>
            breakpointItem &&
            typeof breakpointItem.label === 'string' &&
            typeof breakpointItem.minWidth === 'number',
        )
        .sort((itemA, itemB) => itemA.minWidth - itemB.minWidth)

      this.$nextTick(() => {
        const containerElement = this.$refs.resizableContainer

        this.currentWidth = containerElement ? containerElement.offsetWidth : this.minWidth

        this._updateBreakpoint()

        if (this.preventOverflow && containerElement?.parentElement) {
          this._resizeObserver = new ResizeObserver(() => {
            this.currentWidth = this._clampWidth(this.currentWidth)
            this._updateBreakpoint()
          })

          this._resizeObserver.observe(containerElement.parentElement)
        }
      })
    },

    get resolvedMaxWidth() {
      const candidateWidths = []

      if (this.maxWidth !== null && this.maxWidth > 0) {
        candidateWidths.push(this.maxWidth)
      }

      if (this.stopAtLastBreakpoint && this.breakpointItems.length > 0) {
        const lastBreakpointWidth = this.breakpointItems[this.breakpointItems.length - 1].minWidth

        if (lastBreakpointWidth > 0) {
          candidateWidths.push(lastBreakpointWidth)
        }
      }

      if (this.preventOverflow) {
        const parentWidth = this.$refs.resizableContainer?.parentElement?.offsetWidth ?? null

        if (parentWidth !== null && parentWidth > 0) {
          candidateWidths.push(parentWidth)
        }
      }

      if (candidateWidths.length === 0) {
        return null
      }

      return Math.max(Math.min(...candidateWidths), this.minWidth)
    },

    _updateBreakpoint() {
      if (this.breakpointItems.length === 0) {
        this.activeBreakpoint = null

        return
      }

      const matchedIndex = Math.max(
        this.breakpointItems.findLastIndex(
          (breakpointItem) => this.currentWidth >= breakpointItem.minWidth,
        ),
        0,
      )

      this.activeBreakpoint = this.breakpointItems[matchedIndex].label
    },

    _clampWidth(rawWidth) {
      let clampedWidth = rawWidth

      if (this.maxWidth !== null && this.maxWidth > 0) {
        clampedWidth = Math.min(clampedWidth, this.maxWidth)
      }

      if (this.stopAtLastBreakpoint && this.breakpointItems.length > 0) {
        const lastBreakpointWidth = this.breakpointItems[this.breakpointItems.length - 1].minWidth

        if (lastBreakpointWidth > 0) {
          clampedWidth = Math.min(clampedWidth, lastBreakpointWidth)
        }
      }

      if (this.preventOverflow) {
        const containerElement = this.$refs.resizableContainer
        const parentWidth = containerElement?.parentElement?.offsetWidth ?? null

        if (parentWidth !== null && parentWidth > 0) {
          clampedWidth = Math.min(clampedWidth, parentWidth)
        }
      }

      clampedWidth = Math.max(clampedWidth, this.minWidth)

      return clampedWidth
    },

    startDrag(pointerEvent) {
      if (pointerEvent.type === 'mousedown' && pointerEvent.button !== 0) {
        return
      }

      this._onDragEnd()

      pointerEvent.preventDefault()

      if (pointerEvent.type === 'mousedown') {
        pointerEvent.currentTarget?.focus()
      }

      const clientX = pointerEvent.touches ? pointerEvent.touches[0].clientX : pointerEvent.clientX

      this._dragStartX = clientX
      this._dragStartWidth = this.currentWidth

      this._boundOnDragMove = this._onDragMove.bind(this)
      this._boundOnDragEnd = this._onDragEnd.bind(this)

      document.addEventListener('mousemove', this._boundOnDragMove)
      document.addEventListener('mouseup', this._boundOnDragEnd)
      document.addEventListener('touchmove', this._boundOnDragMove, {
        passive: false,
      })
      document.addEventListener('touchend', this._boundOnDragEnd)
      document.addEventListener('touchcancel', this._boundOnDragEnd)
    },

    _onDragMove(pointerEvent) {
      if (pointerEvent.cancelable) {
        pointerEvent.preventDefault()
      }

      const clientX = pointerEvent.touches ? pointerEvent.touches[0].clientX : pointerEvent.clientX

      const xDelta = clientX - this._dragStartX
      const rawWidth = this._dragStartWidth + xDelta

      this.currentWidth = this._clampWidth(rawWidth)
      this._updateBreakpoint()
    },

    _onDragEnd() {
      document.removeEventListener('mousemove', this._boundOnDragMove)
      document.removeEventListener('mouseup', this._boundOnDragEnd)
      document.removeEventListener('touchmove', this._boundOnDragMove)
      document.removeEventListener('touchend', this._boundOnDragEnd)
      document.removeEventListener('touchcancel', this._boundOnDragEnd)

      this._boundOnDragMove = null
      this._boundOnDragEnd = null
    },

    nudgeWidth(xDelta) {
      this.currentWidth = this._clampWidth(this.currentWidth + xDelta)
      this._updateBreakpoint()
    },

    jumpToLabel(breakpointLabel) {
      const targetIndex = this.breakpointItems.findIndex(
        (breakpointItem) => breakpointItem.label === breakpointLabel,
      )

      if (targetIndex === -1) {
        return
      }

      this.currentWidth = this._clampWidth(this.breakpointItems[targetIndex].minWidth)
      this._updateBreakpoint()
    },

    jumpToBreakpoint(xDirection) {
      if (this.breakpointItems.length === 0) {
        return
      }

      const currentIndex = this.breakpointItems.findIndex(
        (breakpointItem) => breakpointItem.label === this.activeBreakpoint,
      )

      let targetIndex = currentIndex

      if (xDirection === 'next') {
        targetIndex = Math.min(currentIndex + 1, this.breakpointItems.length - 1)
      }

      if (xDirection === 'prev') {
        targetIndex = Math.max(currentIndex - 1, 0)
      }

      if (xDirection === 'first') {
        targetIndex = 0
      }

      if (xDirection === 'last') {
        targetIndex = this.breakpointItems.length - 1
      }

      if (targetIndex < 0 || targetIndex >= this.breakpointItems.length) {
        return
      }

      this.currentWidth = this._clampWidth(this.breakpointItems[targetIndex].minWidth)
      this._updateBreakpoint()
    },

    destroy() {
      if (this._boundOnDragMove) {
        document.removeEventListener('mousemove', this._boundOnDragMove)
        document.removeEventListener('touchmove', this._boundOnDragMove)
      }

      if (this._boundOnDragEnd) {
        document.removeEventListener('mouseup', this._boundOnDragEnd)
        document.removeEventListener('touchend', this._boundOnDragEnd)
        document.removeEventListener('touchcancel', this._boundOnDragEnd)
      }

      if (this._resizeObserver) {
        this._resizeObserver.disconnect()
        this._resizeObserver = null
      }
    },
  }))
})
