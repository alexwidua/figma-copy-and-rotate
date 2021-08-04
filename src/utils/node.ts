/**
 * @file Utility functions that concern node property changes.
 */

/**
 * Componentize selection and apply the selection's transformations.
 * @param selection
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

	// Store selection transformation, reset component and apply transformation
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

	constrainChildren(node)
	return node
}

/**
 * Recursively search for child nodes and constraint them to CENTER
 * to preserve the rotation when scaling after the transformation has been applied.
 * @param node
 */
function constrainChildren(node: ChildrenMixin): void {
	node.children.forEach((e) => {
		if (e.type === 'GROUP') {
			constrainChildren(e)
		} else if ('constraints' in e) {
			e.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }
		}
	})
}
