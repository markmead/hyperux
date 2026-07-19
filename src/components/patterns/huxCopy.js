document.addEventListener('alpine:init', () => {
  Alpine.data('huxCopy', (initialConfig = {}) => ({
    hasCopied: false,
    hasCopyFailed: false,
    sourceNames: initialConfig.sourceNames ?? [],
    valueSourceNames: initialConfig.valueSourceNames ?? [],
    contentSeparator: initialConfig.contentSeparator ?? '\n\n',
    timeoutDuration: initialConfig.timeoutDuration ?? 2000,

    getSourceElement(sourceName) {
      if (sourceName) {
        const sourceElement = document.querySelector(`[data-hux-copy="${CSS.escape(sourceName)}"]`)

        if (sourceElement) {
          return sourceElement
        }
      }

      return null
    },

    resolveElementValue(sourceElement) {
      if ('value' in sourceElement) {
        return sourceElement.value
      }

      return sourceElement.textContent?.trim() ?? ''
    },

    resolveCopyContent() {
      if (this.sourceNames.length === 0 && this.valueSourceNames.length === 0) {
        console.error('[huxCopy] No sourceNames or valueSourceNames configured')

        return null
      }

      const htmlCopyChunks = this.sourceNames
        .map((sourceName) => {
          const sourceElement = this.getSourceElement(sourceName)

          if (!sourceElement) {
            console.error(
              `[huxCopy] Could not find source element for data-hux-copy: ${sourceName}`,
            )

            return null
          }

          return sourceElement.outerHTML
        })
        .filter((contentChunk) => typeof contentChunk === 'string')
        .map((contentChunk) => contentChunk.trim())
        .filter((contentChunk) => contentChunk.length > 0)

      const valueCopyChunks = this.valueSourceNames
        .map((sourceName) => {
          const sourceElement = this.getSourceElement(sourceName)

          if (!sourceElement) {
            console.error(
              `[huxCopy] Could not find value source element for data-hux-copy: ${sourceName}`,
            )

            return null
          }

          return this.resolveElementValue(sourceElement)
        })
        .filter((valueChunk) => typeof valueChunk === 'string')
        .map((valueChunk) => valueChunk.trim())
        .filter((valueChunk) => valueChunk.length > 0)

      const copyChunks = [...htmlCopyChunks, ...valueCopyChunks]

      if (copyChunks.length === 0) {
        return null
      }

      return copyChunks.join(this.contentSeparator)
    },

    async copyToClipboard() {
      this.hasCopyFailed = false

      if (!navigator.clipboard) {
        console.error('[huxCopy] Clipboard API unavailable — requires a secure context')
        this.hasCopyFailed = true

        return
      }

      try {
        const contentToCopy = this.resolveCopyContent()

        if (!contentToCopy) {
          return
        }

        await navigator.clipboard.writeText(contentToCopy)

        this.hasCopied = true

        setTimeout(() => {
          this.hasCopied = false
        }, this.timeoutDuration)
      } catch (copyError) {
        console.error('[huxCopy] Copy failed', copyError)
        this.hasCopyFailed = true
      }
    },
  }))
})
