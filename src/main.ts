/**
 * @file Main entry file of the plugin.
 */

import { on, emit, showUI, once } from '@create-figma-plugin/utilities'
import { instantiateAndRotate } from './core/transform'
import {
	createComponentInPlace,
	setSharedData,
	querySelection
} from './helper/utils'

export default function () {
	/**
	 * Init
	 */
	const ui: UIOptions = { width: 280, height: 502 }
	const data: UIPayload = {
		selection: {
			width: figma.currentPage.selection[0]?.width
				? figma.currentPage.selection[0].width
				: 100,
			height: figma.currentPage.selection[0]?.height
				? figma.currentPage.selection[0].height
				: 100
		},
		ui
	}
	//const validNodeTypes = ['RECTANGLE', 'COMPONENT']
	const validNodeTypes = [
		'BOOLEAN_OPERATION',
		'COMPONENT',
		'ELLIPSE',
		'FRAME',
		'GROUP',
		'INSTANCE',
		'LINE',
		'POLYGON',
		'RECTANGLE',
		'STAR',
		'TEXT',
		'VECTOR'
	]

	// Use adaptive radius (r = node.height + node.width / 2) after plugin launch
	// so user doesn't get confused if the selected node is large and the radius is too small
	let adaptiveRadius = true

	showUI(ui, data)

	/**
	 * Event handlers
	 */
	const handleSelectionChange = () => {
		const data = querySelection(figma.currentPage.selection, validNodeTypes)

		emit('SELECTION_CHANGE', { ...data, adaptiveRadius })
	}

	function handleClick(props: RadialTransform) {
		if (!figma.currentPage.selection.length) {
			return figma.notify('Nothing selected!')
		}
		if (figma.currentPage.selection.length > 1) {
			return figma.notify('Select only one node')
		}

		const selection: SceneNode = figma.currentPage.selection[0]
		const {
			numItems,
			radius,
			skipSelect,
			skipSpecific,
			skipEvery,
			rotateItems,
			sweepAngle
		} = props
		let node: SceneNode

		// 1. Componentize selection
		if (validNodeTypes.indexOf(selection.type) >= 0) {
			if (selection.type === 'COMPONENT') {
				node = selection
			}
			// Catch children of component nodes which are regular SceneNodes
			else if (
				selection.parent &&
				selection.parent.type === 'COMPONENT'
			) {
				node = selection.parent
			} else {
				node = createComponentInPlace(selection)
			}
		} else {
			return figma.notify('Node type not supported')
		}

		// 2. Check if node has been cloned before and remove to avoid duplicate circles
		const radialParent = selection.getSharedPluginData(
			'radial_items',
			'parentGroup'
		)
		if (radialParent) {
			const radialParentNode = figma.getNodeById(radialParent)
			if (radialParentNode && !radialParentNode.removed) {
				radialParentNode.parent?.appendChild(node)
				if (!radialParentNode.removed) {
					radialParentNode.remove()
				}
			}
		}

		// 3. Create instances and arrange in circle
		const circle: Array<InstanceNode> = instantiateAndRotate(
			node,
			parseInt(numItems),
			parseInt(radius),
			rotateItems,
			sweepAngle
		)

		// 4. Group and tidy up
		const parent = node.parent || figma.currentPage
		const group: GroupNode = figma.group(circle, parent)

		// Account for possible displacement caused by rotation of original node
		const alignX: number = node.x - circle[0].x
		const alignY: number = node.y - circle[0].y
		group.x = group.x + alignX
		group.y = group.y + alignY

		// 5. Deal with skipped instances
		const skipInstancesSpecific: Array<number> = skipSpecific
			.split(',')
			.map(Number)
		const skipInstancesEvery: number = parseInt(skipEvery)

		if (skipInstancesSpecific.length || skipInstancesEvery > 1) {
			if (skipSelect === 'specific') {
				group.children.forEach((el, i) => {
					if (skipInstancesSpecific.includes(i + 1)) {
						el.remove()
					}
				})
			} else if (skipSelect === 'every') {
				group.children.forEach((el, i) => {
					if (i === 0) return
					else if ((i + 1) % skipInstancesEvery == 0) {
						el.remove()
					}
				})
			}
		}

		// Replace first child with initial cloned node
		const getFirstChild: SceneNode = group.children[0]
		node.rotation = getFirstChild.rotation
		node.x = getFirstChild.x
		node.y = getFirstChild.y
		getFirstChild.remove()
		group.insertChild(0, node)

		node.name = 'Origin'
		group.name = 'Radial Pattern'

		// Set plugin data so nodes can be read & updated later on
		setSharedData(node, group.id, props)
		if (node !== selection) {
			setSharedData(selection, group.id, props)
		}
	}

	/**
	 * Event listeners
	 */
	on('GENERATE', handleClick)
	once('DISABLE_ADAPTIVE_RADIUS', () => {
		adaptiveRadius = false
	})
	figma.on('selectionchange', handleSelectionChange)
}
