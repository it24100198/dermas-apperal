import PropTypes from 'prop-types'
import { PaperClipIcon, TrashIcon } from '@heroicons/react/24/outline'

const FileUpload = ({
	label,
	accept,
	multiple,
	files,
	onChange,
	helperText
}) => {
	const handleChange = (event) => {
		const fileList = Array.from(event.target.files || [])
		if (!multiple) {
			onChange(fileList.slice(0, 1))
			return
		}
		onChange(fileList)
	}

	return (
		<div>
			{label ? <label className="label">{label}</label> : null}

			<label className="w-full border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:border-brand-cyan hover:text-brand-cyan transition">
				<PaperClipIcon className="h-6 w-6 mb-2" />
				<span className="text-sm font-medium">Upload file</span>
				<span className="text-xs mt-1">PNG, JPG, PDF up to 5MB</span>
				<input
					type="file"
					className="hidden"
					accept={accept}
					multiple={multiple}
					onChange={handleChange}
				/>
			</label>

			{helperText ? <p className="text-xs text-slate-500 mt-2">{helperText}</p> : null}

			{files?.length > 0 ? (
				<ul className="mt-3 space-y-2">
					{files.map((file, index) => (
						<li key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm">
							<span className="truncate max-w-[75%]">{file.name}</span>
							<button
								type="button"
								className="text-rose-600 hover:text-rose-700"
								onClick={() => {
									const next = files.filter((_, fileIndex) => fileIndex !== index)
									onChange(next)
								}}
								aria-label="Remove file"
							>
								<TrashIcon className="h-4 w-4" />
							</button>
						</li>
					))}
				</ul>
			) : null}
		</div>
	)
}

FileUpload.propTypes = {
	label: PropTypes.string,
	accept: PropTypes.string,
	multiple: PropTypes.bool,
	files: PropTypes.arrayOf(PropTypes.instanceOf(File)),
	onChange: PropTypes.func,
	helperText: PropTypes.string
}

FileUpload.defaultProps = {
	label: '',
	accept: 'image/*,.pdf',
	multiple: false,
	files: [],
	onChange: () => {},
	helperText: ''
}

export default FileUpload
