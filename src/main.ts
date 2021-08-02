/**
 * @file Main entry file of the plugin.
 */

import { on, emit, showUI, once } from '@create-figma-plugin/utilities'
import { instantiateAndRotate } from './utils/transform'
import { createComponentInPlace } from './utils/node'
import { validateSelection, hasComponentChild } from './utils/selection'

export default function () {
	/**
	 * Initial data that is sent to UI on plugin startup
	 */
	const ui: UISettings = { width: 280, height: 502 }
	const initialData: { selection: SelectionLayout; ui: UISettings } = {
		selection: {
			width: figma.currentPage.selection[0]?.width || 100,
			height: figma.currentPage.selection[0]?.height || 100,
			rotation: figma.currentPage.selection[0]?.rotation || 0,
			type: 'RECTANGLE'
		},
		ui
	}

	/**
	 * Plugin settings
	 */
	const validNodeTypes: Array<NodeType> = [
		// 'BOOLEAN_OPERATION',
		// 'COMPONENT',
		// 'ELLIPSE',
		// 'FRAME',
		'GROUP',
		// 'INSTANCE',
		// 'LINE',
		// 'POLYGON',
		'RECTANGLE'
		// 'STAR',
		// 'TEXT',
		// 'VECTOR'
	]

	// Internal plugin state
	let TRANSFORMATION = false
	let state: TransformOptions = {
		numItems: 8,
		radius: 50,
		skipSelect: 'SPECIFIC',
		skipSpecific: [0],
		skipEvery: 0,
		rotateItems: true,
		sweepAngle: 360
	}
	let selectionRef: SceneNode | undefined
	let groupRef: GroupNode | undefined
	let componentRef: ComponentNode | undefined

	// Handle selection change...
	function handleSelectionChange() {
		const str: SelectionType = validateSelection(
			figma.currentPage.selection,
			validNodeTypes
		)

		if (str.match(/^(EMPTY|INVALID|IS_INSTANCE|HAS_COMPONENT|MULTIPLE)$/)) {
			removeRefs()
		} else if (selectionRef && groupRef && componentRef) {
			removeRefs()
			componentizeSelection(figma.currentPage.selection[0])
		} else {
			componentizeSelection(figma.currentPage.selection[0])
		}

		const data = {
			selectionType: str,
			selection: {
				width: selectionRef?.width,
				height: selectionRef?.height,
				rotation: selectionRef?.rotation,
				type: selectionRef?.type
			}
		}
		emit('EMIT_SELECTION_CHANGE_TO_UI', data)
	}

	// Handle input changes
	function handleUpdateFromUI(data: any) {
		state = { ...state, ...data }
		if (groupRef && componentRef) {
			groupRef.remove()
			groupRef = undefined
			updatePreview()
		}
	}

	// Componentize selection
	function componentizeSelection(selection: SceneNode) {
		if (!selection) {
			return figma.notify('Please select nodes via the canvas.')
		}
		// Store reference to selected node in case plugin is closed/selection dismissed
		selectionRef = selection.clone()
		selectionRef.visible = false

		if (selection.type === 'COMPONENT') {
			componentRef = selection
		} else {
			componentRef = createComponentInPlace(selection)
		}
		componentRef.name = 'Preview'
		updatePreview()
	}

	// Updates canvas preview
	function updatePreview() {
		if (!componentRef) {
			return
		}

		const circle: Array<InstanceNode> = instantiateAndRotate(
			componentRef,
			state.numItems,
			state.radius,
			state.rotateItems,
			state.sweepAngle
		)
		const parent = componentRef.parent || figma.currentPage
		groupRef = figma.group(circle, parent)

		// Account for offset caused by grouping
		const alignX: number = componentRef.x - circle[0].x
		const alignY: number = componentRef.y - circle[0].y
		groupRef.x = groupRef.x + alignX
		groupRef.y = groupRef.y + alignY

		groupRef.name = '[Preview] Rotated Instances'
		groupRef.opacity = 0.3

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

	// Applies the temporary transformation, cleans up and closes plugin.
	function applyTransformation() {
		if (!selectionRef || !groupRef || !componentRef) {
			return console.log(
				`Couldn't apply transformation. References are missing`
			)
		}
		// Remove first instance and replace with original selected node
		const getFirstChild: SceneNode = groupRef.children[0]
		componentRef.rotation = getFirstChild.rotation
		componentRef.x = getFirstChild.x
		componentRef.y = getFirstChild.y
		componentRef.name = selectionRef.name
		getFirstChild.remove()
		groupRef.insertChild(0, componentRef)

		selectionRef.remove()
		groupRef.opacity = 1
		groupRef.name = 'Rotated Instances'
		TRANSFORMATION = true

		figma.closePlugin()
	}

	// Remove transformation preview before closing
	function handleClose() {
		if (TRANSFORMATION) return
		else if (selectionRef && groupRef && componentRef) {
			removeRefs()
		}
	}

	// Utility func that removes all stored references.
	function removeRefs() {
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

	/**
	 * Event listeners
	 */

	on('APPLY_TRANSFORMATION', applyTransformation)
	on('EMIT_INPUT_TO_PLUGIN', handleUpdateFromUI)
	figma.on('selectionchange', handleSelectionChange)
	figma.on('close', handleClose)

	showUI(ui, initialData)
}
