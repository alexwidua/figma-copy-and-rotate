/**
 * @file Core logic for the radial transform
 */

/**
 * Base rotation that is applied to transformation.
 * -90 because Figma sets origin (0°) to 3 o'clock.
 */
export const baseDeg: number = -90

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

		const w: number = node.width / 2
		const h: number = node.height / 2
		const r = radius
		const d: number = r * 2

		// (items - 1) to account for the offset of the sweep slider
		const deg: number = baseDeg + (sweepAngle / (numItems - 1)) * i
		const rad: number = deg * (Math.PI / 180)

		// If the cloned node isn't square, it will skew the circle and radius.
		// We account for that by normalizing both radius and arc.
		const diff: number = Math.abs(w - h)
		const normalizeShape: number =
			w >= h
				? -(diff * Math.cos(Math.abs(deg) * (Math.PI / 180)))
				: diff * Math.cos(Math.abs(deg) * (Math.PI / 180))
		const normalizeRadius: number =
			w === h
				? 0
				: w > h
				? -diff * Math.sin(Math.abs(initRad))
				: diff * Math.sin(Math.abs(initRad))

		console.log(normalizeRadius)

		// 2. Rotate the cloned nodes using affine transformation
		const translateX: number =
			(r + w - normalizeRadius) * Math.cos(rad) +
			w * Math.sin(rad) +
			(d + w * 2) / 2 +
			normalizeShape

		const translateY: number =
			(r + h - normalizeRadius) * Math.sin(rad) -
			h * Math.cos(rad) +
			(d + h * 2) / 2

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

		e.x = x + w * (1 - sin) - w * (1 - cos)
		e.y = y + h * (1 - sin) - h * (1 - cos) + h * sin

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
			w - w * Math.cos(newRad) + h * Math.sin(newRad) - w * Math.sin(rad)
		const transformOriginY: number =
			h - w * Math.sin(newRad) - h * Math.cos(newRad) + h * Math.cos(rad)

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
