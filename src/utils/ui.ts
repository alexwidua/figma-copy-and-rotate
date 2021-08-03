/**
 * Debounce utility, used here to debounce input changes which render expensive transforms.
 * @param callback - Input func
 * @param wait - Wait for x ms before triggering input func
 */
export const debounce = <T extends (...args: any[]) => any>(
	callback: T,
	wait: number
) => {
	let timeout = 0
	return (...args: Parameters<T>): ReturnType<T> => {
		let result: any
		clearTimeout(timeout)
		timeout = setTimeout(() => {
			result = callback(...args)
		}, wait)
		return result
	}
}
