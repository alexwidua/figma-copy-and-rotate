/**
 * @file The plugin's main file.
 */

import { on, emit, showUI } from '@create-figma-plugin/utilities'
import { instantiateAndRotate } from './utils/transform'
import { createComponentInPlace } from './utils/node'
import { validateSelection } from './utils/selection'

export default function () {
	/**
	 * Initial data that is sent to UI on plugin startup
	 */
	const ui: UISettings = { width: 280, height: 502 }
	const initialData: { selection: SelectionProperties; ui: UISettings } = {
		selection: {
			width: figma.currentPage.selection[0]?.width || 100,
			height: figma.currentPage.selection[0]?.height || 100,
			rotation: figma.currentPage.selection[0]?.rotation || 0,
			type: 'RECTANGLE'
		},
		ui
	}

	// Internal plugin state
	let FLAG_TRANSFORM_SUCCESS = false
	let FLAG_IN_CANVAS_PREVIEW = true

	let state: TransformOptions = {
		numItems: 8,
		radius: 50,
		skipSelect: 'SPECIFIC',
		skipSpecific: [0],
		skipEvery: 0,
		alignRadially: true,
		sweepAngle: 360
	}

	/**
	 * Node references which are the heart of the in canvas preview.
	 * {selectionRef} is a temporary carbon copy of the selected node to
	 * revert everything if the user deselects/closes the plugin.
	 * {groupRef} holds the actual circle with transformed instances
	 * {componentRef} holds the componentized original selected node
	 */
	let selectionRef: SceneNode | undefined
	let groupRef: GroupNode | undefined
	let componentRef: ComponentNode | undefined

	/**
	 * Creates in-canvas preview and updates the UI with
	 * the selection's properties.
	 */
	function handleSelectionChange(): void {
		const str: SelectionState = validateSelection(
			figma.currentPage.selection
		)

		if (FLAG_IN_CANVAS_PREVIEW) {
			if (
				str.match(
					/^(EMPTY|INVALID|IS_INSTANCE|HAS_COMPONENT|MULTIPLE)$/
				)
			) {
				removeRefs()
			} else if (selectionRef && groupRef && componentRef) {
				removeRefs()
				componentizeNode(figma.currentPage.selection[0])
				updateCanvasPreview()
			} else {
				componentizeNode(figma.currentPage.selection[0])
				updateCanvasPreview()
			}
		}

		const msg: SelectionMessage = {
			state: str,
			properties: {
				width: componentRef?.width,
				height: componentRef?.height,
				rotation: componentRef?.rotation,
				type: componentRef?.type
			}
		}
		emit('EMIT_SELECTION_CHANGE_TO_UI', msg)
	}

	/**
	 * Componentizes the supplied node (should be current selection).
	 * This is required because the InCanvasPreview expects a ComponentNode.
	 * @param selection
	 * @returns - Returns NotificationHandler on error.
	 */
	function componentizeNode(
		selection: SceneNode
	): NotificationHandler | undefined {
		// If we componentize a selection that is made via the layer menu,
		// it invokes the selection handler multiple times which in turn
		// recursively compinentizes all children.
		// Not sure if this is a bug, but we can catch it here.
		if (!selection) {
			return figma.notify('Please select nodes via the canvas.')
		}
		selectionRef = selection.clone()
		selectionRef.visible = false

		if (selection.type === 'COMPONENT') {
			componentRef = selection
		} else {
			componentRef = createComponentInPlace(selection)
		}
		componentRef.name = 'Preview'
	}

	/**
	 * Updates the in canvas preview after selection or UI input changes.
	 */
	function updateCanvasPreview(): void {
		if (!componentRef) {
			return
		}
		const circle: Array<InstanceNode> = instantiateAndRotate(
			componentRef,
			state.numItems,
			state.radius,
			state.alignRadially,
			state.sweepAngle
		)
		const parent = componentRef.parent || figma.currentPage
		groupRef = figma.group(circle, parent)

		// Account for offset caused by grouping
		const alignX: number = componentRef.x - circle[0].x
		const alignY: number = componentRef.y - circle[0].y
		groupRef.x = groupRef.x + alignX
		groupRef.y = groupRef.y + alignY

		setPreviewProperties(true)

		if (state.skipSpecific.length || state.skipEvery > 1) {
			if (state.skipSelect === 'SPECIFIC') {
				groupRef.children.forEach((el, i) => {
					if (state.skipSpecific.includes(i + 1)) {
						el.remove()
					}
				})
			} else if (state.skipSelect === 'EVERY') {
				groupRef.children.forEach((el, i) => {
					if (i === 0) return
					else if ((i + 1) % state.skipEvery == 0) {
						el.remove()
					}
				})
			}
		}
	}

	/**
	 * Applies the in canvas preview by appending componentRef to groupRef
	 * and doing some additional cleanup.
	 */
	function applyTransformation(): void {
		if (!FLAG_IN_CANVAS_PREVIEW) {
			componentizeNode(figma.currentPage.selection[0])
			updateCanvasPreview()
		}

		if (!selectionRef || !groupRef || !componentRef) {
			return console.error(
				`Couldn't apply transformation. References are missing`
			)
		}

		// Replace the first instance and append the component to the group
		const getFirstChild: SceneNode = groupRef.children[0]
		componentRef.rotation = getFirstChild.rotation
		componentRef.x = getFirstChild.x
		componentRef.y = getFirstChild.y
		componentRef.name = selectionRef.name
		getFirstChild.remove()
		groupRef.insertChild(0, componentRef)

		// Discard our backup carbon copy and change the visual properties of groupRef
		selectionRef.remove()
		setPreviewProperties(false)

		// Set flag to avoid preview cleanup on close
		FLAG_TRANSFORM_SUCCESS = true
		figma.closePlugin()
	}

	function handleClose(): void {
		if (FLAG_TRANSFORM_SUCCESS) return
		else if (selectionRef && groupRef && componentRef) {
			removeRefs()
		}
	}

	/**
	 * Re-renders the circle on UI input change.
	 */
	function handleUpdateFromUI(data: any): void {
		state = { ...state, ...data }
		if (groupRef && componentRef) {
			groupRef.remove()
			groupRef = undefined
			updateCanvasPreview()
		}
	}

	/**
	 * Enable or disable the in canvas live preview.
	 * @param value - Checkbox state emitted from the UI window
	 */
	function handlePreviewChange(value: boolean): void {
		const str: SelectionState = validateSelection(
			figma.currentPage.selection
		)
		if (str === 'VALID' && !FLAG_IN_CANVAS_PREVIEW) {
			componentizeNode(figma.currentPage.selection[0])
			updateCanvasPreview()
		} else {
			removeRefs()
		}
		FLAG_IN_CANVAS_PREVIEW = value
	}

	/**
	 * Utility function that toggles the group refs visual properties.
	 * @param isPreview
	 */
	function setPreviewProperties(isPreview: boolean): void {
		if (!groupRef) {
			return console.error(
				`Couldn't set groupRef preview properties. Reference is missing.`
			)
		}
		groupRef.opacity = isPreview ? 0.3 : 1
		groupRef.locked = isPreview ? true : false
		groupRef.name = isPreview
			? '[Preview] Rotated Instances'
			: 'Rotated Instances'
	}

	/**
	 * Utility function that removes and unbinds referenced nodes.
	 */
	function removeRefs(): void {
		if (!selectionRef || !groupRef || !componentRef) {
			return
		}
		groupRef.remove()
		componentRef.remove()
		selectionRef.visible = true
		groupRef = undefined
		componentRef = undefined
		selectionRef = undefined
	}

	// Listeners
	on('APPLY_TRANSFORMATION', applyTransformation)
	on('EMIT_INPUT_TO_PLUGIN', handleUpdateFromUI)
	on('EMIT_PREVIEW_CHANGE_TO_PLUGIN', handlePreviewChange)
	figma.on('selectionchange', handleSelectionChange)
	figma.on('close', handleClose)

	// Action, baby 🎉
	showUI(ui, initialData)
	if (figma.currentPage.selection.length) {
		const selection = figma.currentPage.selection[0]
		state = { ...state, radius: (selection.width + selection.height) / 4 }
	}
	handleSelectionChange()
}
