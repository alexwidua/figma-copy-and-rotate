/**
 * @file Different utility functions that have been moved here for clarity.
 */

/**
 * Create a component and put it in place of original node.
 * @param selection {SceneNode} Current page selection
 * @returns {ComponentNode}
 */
export function createComponentInPlace(selection: SceneNode): ComponentNode {
	let node: ComponentNode = figma.createComponent()

	const w: number = selection.width
	const h: number = selection.height

	// Deal with line and vector nodes with width/height of 0
	const isHairline: boolean = h === 0 || w === 0
	const isWiderOrSquare: boolean = w >= h
	const inherit: number = isWiderOrSquare ? w : h

	if (isHairline) {
		node.resizeWithoutConstraints(inherit, inherit)
	} else {
		node.resizeWithoutConstraints(selection.width, selection.height)
	}

	selection.parent?.appendChild(node)
	node.appendChild(selection)

	// Save properties, reset cloned node, revert back
	const tempX: number = selection.x
	const tempY: number = selection.y
	const tempDeg: number = selection.rotation
	selection.x = 0
	selection.y = 0
	selection.rotation = 0
	node.x = tempX
	node.y = tempY
	node.rotation = tempDeg

	if (isHairline) {
		const rad: number = node.rotation * (Math.PI / 180)
		if (isWiderOrSquare) {
			selection.y = selection.x + inherit / 2
			node.x = node.x - (inherit / 2) * Math.sin(rad)
			node.y = node.y - (inherit / 2) * Math.cos(rad)
		} else {
			selection.x = selection.x + inherit / 2
			node.x = node.x - (inherit / 2) * Math.cos(rad)
			node.y = node.y + (inherit / 2) * Math.sin(rad)
		}
	}

	return node
}

/**
 *
 * @param node
 * @param parentGroup
 * @param props
 */
export function setSharedData(
	node: SceneNode,
	parentGroup: string,
	props: RadialTransform
) {
	const namespace: string = 'radial_items'
	const {
		numItems,
		radius,
		skipSelect,
		skipSpecific,
		skipEvery,
		rotateItems
	} = props

	node.setSharedPluginData(namespace, 'parentGroup', parentGroup)
	node.setSharedPluginData(namespace, 'numItems', numItems)
	node.setSharedPluginData(namespace, 'radius', radius)
	node.setSharedPluginData(namespace, 'skipSelect', skipSelect)
	node.setSharedPluginData(namespace, 'skipEvery', skipEvery)
	node.setSharedPluginData(namespace, 'skipSpecific', skipSpecific)
	node.setSharedPluginData(namespace, 'rotateItems', rotateItems ? '1' : '0')
}

/**
 * Validates current selected node.
 * @param selection {ReadonlyArray<SceneNode>} - Current page selection
 * @param validNodes {Array<String>} - Array containing all valid node types
 * @returns {String}
 */
export function validateSelection(
	selection: ReadonlyArray<SceneNode>,
	validNodes: Array<String>
): string {
	if (selection.length) {
		if (selection.length > 1) {
			return 'MULTIPLE'
		}

		const node: SceneNode = selection[0]

		if (validNodes.indexOf(node.type) >= 0) {
			const hasParentID = node.getSharedPluginData(
				'radial_items',
				'parentGroup'
			)
			if (
				node.parent?.id === hasParentID ||
				node.parent?.parent?.id === hasParentID
			) {
				return 'VALID_UPDATEABLE'
			} else {
				return 'VALID_NONUPDATEABLE'
			}
		} else {
			return 'INVALID'
		}
	} else {
		return 'EMPTY'
	}
}
