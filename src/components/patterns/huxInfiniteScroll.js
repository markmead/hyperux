document.addEventListener('alpine:init', () => {
  Alpine.data('huxInfiniteScroll', (initialConfig = {}) => ({
    scrollerId: initialConfig.scrollerId ?? null,
    intersectionThreshold: initialConfig.intersectionThreshold ?? 0.1,
    rootMargin: initialConfig.rootMargin ?? '0px',
    loaderTemplateRefName: initialConfig.loaderRef ?? 'infiniteScrollLoader',
    useContainerRoot: initialConfig.useContainerRoot ?? false,
    loadTimeout: initialConfig.loadTimeout ?? 5000,
    isLoading: false,
    isDisabled: initialConfig.startsDisabled ?? false,

    _scrollObserver: null,
    _loaderElement: null,
    _loadTimeoutId: null,

    init() {
      this.$nextTick(() => {
        const loaderElement = this.$refs[this.loaderTemplateRefName] ?? null

        if (!loaderElement) {
          console.error(
            `[huxInfiniteScroll] Missing x-ref target for loaderRef: ${this.loaderTemplateRefName}`,
          )

          return
        }

        this._loaderElement = loaderElement

        const observerRoot = this.useContainerRoot ? this.$el : null

        this._scrollObserver = new IntersectionObserver(
          (entries) => this._handleIntersection(entries),
          {
            root: observerRoot,
            threshold: this.intersectionThreshold,
            rootMargin: this.rootMargin,
          },
        )

        if (!this.isDisabled) {
          this._scrollObserver.observe(loaderElement)
        }
      })
    },

    _handleIntersection(entries) {
      const entry = entries[0]

      if (!entry?.isIntersecting || this.isLoading || this.isDisabled) {
        return
      }

      this._dispatchLoadMoreEvent()
    },

    _dispatchLoadMoreEvent() {
      this.isLoading = true

      if (this.loadTimeout > 0) {
        this._loadTimeoutId = setTimeout(() => {
          if (this.isLoading) {
            this.isLoading = false
            console.warn(
              '[huxInfiniteScroll] Load timed out — markComplete or markFailed was not called',
            )
          }

          this._loadTimeoutId = null
        }, this.loadTimeout)
      }

      const clearLoadTimeout = () => {
        if (this._loadTimeoutId !== null) {
          clearTimeout(this._loadTimeoutId)
          this._loadTimeoutId = null
        }
      }

      const detail = {
        scrollerId: this.scrollerId,
        markComplete: (hasMore = true) => {
          clearLoadTimeout()
          this.isLoading = false

          if (!hasMore) {
            this.disableScroll()
          }
        },
        markFailed: () => {
          clearLoadTimeout()
          this.isLoading = false
        },
      }

      const eventName = this.scrollerId
        ? `hux-infinite-scroll:${this.scrollerId}:load-more`
        : 'hux-infinite-scroll:load-more'

      this.$dispatch(eventName, detail)
    },

    disableScroll() {
      this.isDisabled = true

      if (this._scrollObserver && this._loaderElement) {
        this._scrollObserver.unobserve(this._loaderElement)
      }
    },

    enableScroll() {
      if (!this.isDisabled) {
        return
      }

      this.isDisabled = false

      if (this._scrollObserver && this._loaderElement) {
        this._scrollObserver.observe(this._loaderElement)
      }
    },

    destroy() {
      if (this._loadTimeoutId !== null) {
        clearTimeout(this._loadTimeoutId)
        this._loadTimeoutId = null
      }

      if (this._scrollObserver) {
        this._scrollObserver.disconnect()
        this._scrollObserver = null
      }
    },
  }))
})
