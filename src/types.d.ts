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
 * Exclusive UI
 */

interface UIOptions {
	height: number
	width: number
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

/**
 * From plugin to UI
 */
interface PluginSelectionMsg {
	msg: string
	dimensions?: {
		width: number
		height: number
		rotation: number
	}
	adaptiveRadius: boolean
}

interface UIPayload {
	selection: {
		width: number
		height: number
	}
	[key: string]: UIOptions
}
