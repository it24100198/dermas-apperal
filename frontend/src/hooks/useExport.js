import { downloadBlob } from '../utils/helpers'

const useExport = () => {
	const exportBlob = (blob, filename) => {
		downloadBlob(blob, filename)
	}

	const exportJson = (payload, filename = 'export.json') => {
		const blob = new Blob([JSON.stringify(payload, null, 2)], {
			type: 'application/json;charset=utf-8;'
		})
		downloadBlob(blob, filename)
	}

	return {
		exportBlob,
		exportJson
	}
}

export default useExport
