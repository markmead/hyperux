document.addEventListener('alpine:init', () => {
  Alpine.data('huxScrollSpy', (initialConfig = {}) => ({
    headingItems: [],
    activeHeadingId: null,
    scrollContainerElement: null,
    intersectionObserver: null,
    observedHeadingElements: [],
    scrollContainerScrollHandler: null,
    _scrollRafPending: false,
    templateRefName: initialConfig.templateRef ?? 'tocContent',
    headingSelector: initialConfig.headingSelector ?? 'h2, h3, h4, h5, h6',

    init() {
      const scrollContainerElement = this.$refs[this.templateRefName]

      if (!scrollContainerElement) {
        console.error(`[scrollSpy] Missing x-ref target for templateRef: ${this.templateRefName}`)

        return
      }

      this.scrollContainerElement = scrollContainerElement

      const headingElements = Array.from(
        scrollContainerElement.querySelectorAll(this.headingSelector),
      )

      this.observedHeadingElements = headingElements

      this.headingItems = headingElements.map((headingElement, headingIndex) => {
        const headingId = this.ensureHeadingElementId(headingElement, headingIndex)

        return {
          id: headingId,
          text: headingElement.textContent,
          level: parseInt(headingElement.tagName[1]),
        }
      })

      this.intersectionObserver = new IntersectionObserver(
        (observerEntries) => {
          const visibleEntries = observerEntries.filter(
            (observerEntry) => observerEntry.isIntersecting,
          )

          if (visibleEntries.length === 0) {
            return
          }

          const lastVisibleEntry = visibleEntries.reduce((currentLastEntry, observerEntry) => {
            if (!currentLastEntry) {
              return observerEntry
            }

            const currentIndex = this.observedHeadingElements.indexOf(currentLastEntry.target)
            const nextIndex = this.observedHeadingElements.indexOf(observerEntry.target)

            return nextIndex > currentIndex ? observerEntry : currentLastEntry
          }, null)

          if (lastVisibleEntry) {
            this.activeHeadingId = lastVisibleEntry.target.id
          }
        },
        {
          root: scrollContainerElement,
          rootMargin: initialConfig.rootMargin ?? '0px 0px -60% 0px',
          threshold: initialConfig.visibilityThreshold ?? 0.1,
        },
      )

      headingElements.forEach((headingElement) => this.intersectionObserver.observe(headingElement))

      this.scrollContainerScrollHandler = this.handleScrollContainerPosition.bind(this)

      this.scrollContainerElement.addEventListener('scroll', this.scrollContainerScrollHandler)

      if (this.headingItems.length > 0) {
        this.activeHeadingId = this.headingItems[0].id
      }
    },

    scrollToHeadingItem(targetHeadingId) {
      const targetHeadingElement =
        this.scrollContainerElement?.querySelector(`#${CSS.escape(targetHeadingId)}`) ?? null

      if (targetHeadingElement) {
        targetHeadingElement.scrollIntoView({ behavior: 'smooth' })
      }
    },

    ensureHeadingElementId(headingElement, headingIndex) {
      if (headingElement.id) {
        return headingElement.id
      }

      const headingSlug = headingElement.textContent
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const fallbackHeadingSlug = headingSlug || `generated-heading-${headingIndex + 1}`

      let uniqueHeadingId = fallbackHeadingSlug
      let duplicateIndex = 1

      while (document.getElementById(uniqueHeadingId)) {
        duplicateIndex += 1
        uniqueHeadingId = `${fallbackHeadingSlug}-${duplicateIndex}`
      }

      headingElement.id = uniqueHeadingId

      return uniqueHeadingId
    },

    handleScrollContainerPosition() {
      if (this._scrollRafPending) {
        return
      }

      this._scrollRafPending = true

      requestAnimationFrame(() => {
        this._scrollRafPending = false

        if (!this.scrollContainerElement || this.headingItems.length === 0) {
          return
        }

        const reachedBottomOfContainer =
          this.scrollContainerElement.scrollTop + this.scrollContainerElement.clientHeight >=
          this.scrollContainerElement.scrollHeight - 2

        if (reachedBottomOfContainer) {
          this.activeHeadingId = this.headingItems[this.headingItems.length - 1].id
        }
      })
    },

    destroy() {
      if (this.scrollContainerElement && this.scrollContainerScrollHandler) {
        this.scrollContainerElement.removeEventListener('scroll', this.scrollContainerScrollHandler)
      }

      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect()
      }
    },
  }))
})
