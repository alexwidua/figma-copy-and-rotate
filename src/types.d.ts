interface UIProps {
	selection: {
		width: number
		height: number
	}
	ui: {
		width: number
		height: number
	}
}

interface PreviewProps {
	uiWidth: number
	selectionState: string
	selectionHeight: number
	selectionWidth: number
	selectionRotation: number
	numItems: string
	itemRadius: string
	skipSelect: string
	skipSpecific: string
	skipEvery: string
	rotateItems: boolean
	isSweeping: boolean
	sweepAngle: number
	showRadiusBadge: boolean
	showNumBadge: boolean
	onInstanceClick: Function
	children: import('preact').ComponentChildren
}

interface SliderProp {
	onSweepChange: Function
	onSweep: Function
	numItems: string
}

/**
 * From ui to plugin
 */

interface RadialTransform {
	numItems: string
	radius: string
	skipSelect: string
	skipSpecific: string
	skipEvery: string
	rotateItems: boolean
	sweepAngle: number
}

interface SelectionDimensions {
	width: number
	height: number
	rotation: number
}

/**
 * Event message that is sent from plugin to UI
 */
interface SelectionMessage {
	msg: string
	selection: SelectionDimensions
}

interface UISettings {
	height: number
	width: number
}
