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
	| 'HAS_COMPONENT_CHILD'
	| 'IS_WITHIN_COMPONENT'
	| 'IS_WITHIN_INSTANCE'
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
 * Displays button text that corresponds to the current SelecionState
 */
type SelectionStateMap = { [type in SelectionState]: string }

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
	readonly showRadiusHelper: boolean
	readonly showNumBadge: number
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

/**
 * Plugin error message that is displayed to the user.
 */
type PluginError = 'CANT_SKIP_FIRST_INDEX' | 'CANT_SKIP_ALL'
/**
 * Maps the error message to a more human-readable text message.
 */
type PluginErrorMap = { [type in PluginError]: string }
