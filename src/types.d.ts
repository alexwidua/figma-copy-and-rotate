type SelectionType =
	| 'MULTIPLE'
	| 'VALID_UPDATEABLE'
	| 'VALID_NONUPDATEABLE'
	| 'INVALID'
	| 'EMPTY'

type SelectionTypeMap = { [type in SelectionType]: string }
type SkipType = 'SPECIFIC' | 'EVERY'

interface UIProps {
	readonly selection: {
		width: number
		height: number
	}
	readonly ui: {
		width: number
		height: number
	}
}

type XY = { x: number; y: number }

interface PreviewProps {
	readonly uiWidth: number
	readonly selectionState: SelectionType
	readonly selectionHeight: number
	readonly selectionWidth: number
	readonly selectionRotation: number
	readonly selectionType: NodeType
	readonly numItems: string
	readonly itemRadius: string
	readonly skipSelect: SkipType
	readonly skipSpecific: string
	readonly skipEvery: string
	readonly rotateItems: boolean
	readonly isSweeping: boolean
	readonly sweepAngle: number
	readonly showRadiusBadge: boolean
	readonly showNumBadge: boolean
	readonly onInstanceClick: Function
	readonly children: import('preact').ComponentChildren
}

interface SliderProp {
	readonly onSweepChange: Function
	readonly onSweep: Function
	readonly numItems: string
}

/**
 * From ui to plugin
 */

interface TransformOptions {
	readonly numItems: string
	readonly radius: string
	readonly skipSelect: SkipType
	readonly skipSpecific: string
	readonly skipEvery: string
	readonly rotateItems: boolean
	readonly sweepAngle: number
}

type SelectionLayout = {
	readonly width: LayoutMixin['width']
	readonly height: LayoutMixin['height']
	readonly rotation: LayoutMixin['rotation']
	readonly type: NodeType
}

/**
 * Event message that contains a message string and properties of the current selection.
 */
interface SelectionMessage {
	readonly msg: SelectionType
	readonly selection: SelectionLayout
}

interface UISettings {
	readonly height: number
	readonly width: number
}
