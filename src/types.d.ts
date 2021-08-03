/**
 * Data that is applied to the plugin's UI window.
 */
interface UISettings {
	readonly height: number
	readonly width: number
}

/**
 * Message that is emitted to the UI containing the current selection's state
 * and properties to update the UI preview.
 */
interface SelectionMessage {
	state: SelectionState
	properties: SelectionProperties
}

/**
 * State of the current selection, see: ./utils/selection.ts
 */
type SelectionState =
	| 'MULTIPLE'
	| 'VALID'
	| 'INVALID'
	| 'IS_INSTANCE'
	| 'HAS_COMPONENT'
	| 'EMPTY'

/**
 * Selection properties that are emitted to the UI to update the UI preview.
 */
type SelectionProperties = {
	readonly width: LayoutMixin['width'] | undefined
	readonly height: LayoutMixin['height'] | undefined
	readonly rotation: LayoutMixin['rotation'] | undefined
	readonly type: NodeType | undefined
}

/**
 * Options for the UI's skip dropdown menu.
 * 'SPECIFIC' refers to 'Skip (specific) instances', 'EVERY' to 'Skip every (Nth)'
 */
type SkipType = 'SPECIFIC' | 'EVERY'

/**
 * Transform options that are emitted to the plugin and instruct the radial transformation.
 */
type TransformOptions = {
	readonly numItems: number
	readonly radius: number
	readonly skipSelect: SkipType
	readonly skipSpecific: Array<number>
	readonly skipEvery: number
	readonly alignRadially: boolean
	readonly sweepAngle: number
}

/**
 * Interface for the preview component, which is the visual preview and control in the UI window.
 */
interface PreviewProps extends TransformOptions {
	readonly uiWidth: number
	readonly selectionState: SelectionState
	readonly selectionHeight: number
	readonly selectionWidth: number
	readonly selectionRotation: number
	readonly selectionType: NodeType
	readonly alignRadially: boolean
	readonly isSweeping: boolean
	readonly showRadiusBadge: boolean
	readonly showNumBadge: boolean
	readonly onInstanceClick: Function
	readonly children: import('preact').ComponentChildren
}

/**
 * Interface for the slider component, which controls the circle's sweep.
 */
interface SliderProp {
	readonly onSweepChange: Function
	readonly onSweep: Function
	readonly numItems: number
}
