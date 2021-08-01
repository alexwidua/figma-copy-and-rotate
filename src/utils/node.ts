/**
 * Create a component and put it in place of original node.
 * @param selection - Current page selection
 * @returns {ComponentNode}
 */
export function createComponentInPlace(selection: SceneNode): ComponentNode {
	let node: ComponentNode = figma.createComponent()
	const w: LayoutMixin['width'] = selection.width
	const h: LayoutMixin['height'] = selection.height

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
	const tempX: LayoutMixin['x'] = selection.x
	const tempY: LayoutMixin['y'] = selection.y
	const tempDeg: LayoutMixin['rotation'] = selection.rotation
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
 * Sets shared data which is used to update nodes later on
 * @param node - Node to be updated
 * @param parentGroup - Serializes the node's parent group, used later to check if component is instance child
 * @param options
 */
export function setSharedData(
	node: SceneNode,
	parentGroup: string,
	options: TransformOptions
): void {
	// Namespace under which shared setting will be saved
	const namespace: string = 'radial_items'
	const {
		numItems,
		radius,
		skipSelect,
		skipSpecific,
		skipEvery,
		rotateItems
	} = options

	node.setSharedPluginData(namespace, 'parentGroup', parentGroup)
	node.setSharedPluginData(namespace, 'numItems', numItems)
	node.setSharedPluginData(namespace, 'radius', radius)
	node.setSharedPluginData(namespace, 'skipSelect', skipSelect)
	node.setSharedPluginData(namespace, 'skipEvery', skipEvery)
	node.setSharedPluginData(namespace, 'skipSpecific', skipSpecific)
	node.setSharedPluginData(namespace, 'rotateItems', rotateItems ? '1' : '0')
}
