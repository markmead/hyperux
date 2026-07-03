document.addEventListener('alpine:init', () => {
  Alpine.data('huxStepper', (initialConfig = {}) => ({
    stepItems: [],
    completedStepIds: [],
    activeStepId: initialConfig.activeStep ?? null,
    stepperId: initialConfig.stepperId ?? null,
    stepsAreViewable: initialConfig.stepsAreViewable ?? false,

    init() {
      const stepItems = Array.isArray(initialConfig.stepItems) ? initialConfig.stepItems : []
      this.stepItems = stepItems.filter((stepItem) => stepItem?.label && stepItem?.id)

      const validStepIds = this.stepItems.map((stepItem) => stepItem.id)

      if (!this.activeStepId || !validStepIds.includes(this.activeStepId)) {
        this.activeStepId = this.stepItems.length > 0 ? this.stepItems[0].id : null
      }

      if (this.stepperId) {
        this.$nextTick(() => this._dispatchChangeEvent())
      }
    },

    get activeStepIndex() {
      const foundIndex = this.findStepIndex(this.activeStepId)

      return foundIndex >= 0 ? foundIndex : 0
    },

    get isFirstStep() {
      return this.activeStepIndex === 0
    },

    get isLastStep() {
      return this.stepItems.length === 0 || this.activeStepIndex === this.stepItems.length - 1
    },

    findStepIndex(stepId) {
      return this.stepItems.findIndex((stepItem) => stepItem.id === stepId)
    },

    markStepComplete(stepId) {
      if (this.completedStepIds.includes(stepId) || this.findStepIndex(stepId) === -1) {
        return
      }

      this.completedStepIds.push(stepId)
    },

    _dispatchChangeEvent() {
      if (this.activeStepId === null) {
        return
      }

      window.dispatchEvent(
        new CustomEvent(`hux-stepper:${this.stepperId}:change`, {
          detail: {
            stepId: this.activeStepId,
            stepIndex: this.activeStepIndex,
            totalSteps: this.stepItems.length,
          },
        }),
      )
    },

    goToStep(stepId) {
      const stepIndex = this.findStepIndex(stepId)
      const stepExists = stepIndex >= 0

      if (!stepExists || this.activeStepId === stepId) {
        return
      }

      this.activeStepId = stepId

      if (this.stepperId) {
        this._dispatchChangeEvent()
      }
    },

    goToPreviousStep() {
      if (this.stepItems.length === 0 || this.isFirstStep) return

      const previousStepId = this.stepItems[this.activeStepIndex - 1].id

      this.goToStep(previousStepId)
    },

    goToNextStep() {
      if (this.stepItems.length === 0 || this.isLastStep) return

      if (this.stepsAreViewable && this.activeStepId) {
        this.markStepComplete(this.activeStepId)
      }

      const nextStepId = this.stepItems[this.activeStepIndex + 1].id

      this.goToStep(nextStepId)
    },

    isStepComplete(stepId) {
      const stepIndex = this.findStepIndex(stepId)

      if (stepIndex === -1) {
        return false
      }

      if (this.stepsAreViewable) {
        return this.completedStepIds.includes(stepId)
      }

      return stepIndex < this.activeStepIndex
    },

    isStepCurrent(stepId) {
      return this.activeStepId === stepId
    },
  }))
})
