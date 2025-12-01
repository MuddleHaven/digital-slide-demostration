export interface ScreenShotOptions {
  containOverlay?: boolean
  createActionButton?: (container: HTMLDivElement) => void
  container?: string
  borderWidth?: number
  borderColor?: ColorGamut
}
