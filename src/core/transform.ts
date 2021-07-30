/**
 * @file Core logic for the radial transform
 */

/**
 * @param node {SceneNode} - Node that will be instantiated and rotated
 * @param items {Number} - Number of copies
 * @param radius {Number} - Radius of circle
 * @returns {Array<SceneNode}
 *
 * TODO: Guard node type or assume correct type?
 */
export function instantiateAndRotate(
	node: ComponentNode,
	numItems: number,
	radius: number,
	rotateItems: boolean,
	sweepAngle: number
): Array<InstanceNode> {
	const collection: Array<InstanceNode> = []

	Array.from({ length: numItems }, () => {
		const clonedNode: InstanceNode = node.createInstance()
		collection.push(clonedNode)
	})

	collection.forEach((e, i) => {
		// 1. Store properties before transformation so we can restore the original position.
		// Initial degree is negated because Figma rotates objects CCW but nodes are generated CW
		const initX: number = node.x
		const initY: number = node.y
		const initDeg: number = Math.round(node.rotation) * -1
		const initRad: number = initDeg * (Math.PI / 180)

		const w: number = node.width
		const h: number = node.height
		const baseDeg: number = -90
		// (items - 1) to account for the offset of the sweep slider
		const deg: number = baseDeg + (sweepAngle / (numItems - 1)) * i
		const rad: number = deg * (Math.PI / 180)

		// If the cloned node isn't square, it will skew the circle and radius.
		// We account for that by normalizing both radius and arc.
		const diff: number = Math.abs(e.width - e.height)
		const normalizeShape: number =
			e.width >= e.height
				? -((diff / 2) * Math.cos(Math.abs(deg) * (Math.PI / 180)))
				: (diff / 2) * Math.cos(Math.abs(deg) * (Math.PI / 180))

		const normalizeRadius: number =
			e.width >= e.height
				? (diff / 2) * Math.round(Math.sin(initRad))
				: (diff / 2) * Math.round(Math.sin(initRad))

		// 2. Rotate the cloned nodes using affine transformation
		const translateX: number =
			(radius + w / 2 - normalizeRadius) * Math.cos(rad) +
			(w / 2) * Math.sin(rad) +
			normalizeShape
		const translateY: number =
			(radius + h / 2 - normalizeRadius) * Math.sin(rad) -
			(h / 2) * Math.cos(rad)

		const radialTransform: Transform = [
			[Math.cos(rad), -Math.sin(rad), translateX],
			[Math.sin(rad), Math.cos(rad), translateY]
		]

		e.relativeTransform = radialTransform
		e.rotation = e.rotation + baseDeg

		// Make the original cloned node the origin of the circle.
		const x: number = e.x + initX
		const y: number = e.y + initY

		// 3. Shift the circle so the original node becomes the origin.
		// Caveat: if the original node is rotated, it messes with the x,y positioning of the cloned nodes
		// because a rotation also sets the x and y property. The origin node will be off-center.
		// We take that into account by shifting the circle depending on the cloned node's rotation.

		const sin: number = Math.sin(initRad)
		const cos: number = Math.cos(initRad)

		e.x = x + (w / 2) * (1 - sin) - (w / 2) * (1 - cos)
		e.y = y + (h / 2) * (1 - sin) - (h / 2) * (1 - cos) + h * sin

		// 4. Restore the original node's rotation
		// TODO: Refactor & merge into one transform
		const newX: number = e.x
		const newY: number = e.y

		const baseDegRad: number = baseDeg * -1 * (Math.PI / 180)
		const newRad: number = rotateItems
			? rad + initRad + baseDegRad
			: initRad

		// Rotate nodes around their center(since 0,0 of a node is top-left)
		const transformOriginX: number =
			w / 2 -
			(w / 2) * Math.cos(newRad) +
			(h / 2) * Math.sin(newRad) -
			(w / 2) * Math.sin(rad)
		const transformOriginY: number =
			h / 2 -
			(w / 2) * Math.sin(newRad) -
			(h / 2) * Math.cos(newRad) +
			(h / 2) * Math.cos(rad)

		const preserveRotation: Transform = [
			[Math.cos(newRad), -Math.sin(newRad), transformOriginX],
			[Math.sin(newRad), Math.cos(newRad), transformOriginY]
		]

		e.relativeTransform = preserveRotation

		e.x = e.x + newX
		e.y = e.y + newY

		e.name = `Radial Pattern ${i + 1}`
	})

	return collection
}
