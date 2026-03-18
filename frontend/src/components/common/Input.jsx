import PropTypes from 'prop-types'

const Input = ({
	label,
	error,
	className,
	as,
	options,
	...props
}) => {
	const ComponentTag = as

	return (
		<div>
			{label ? <label className="label">{label}</label> : null}

			{ComponentTag === 'select' ? (
				<select className={`input-field ${className}`} {...props}>
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			) : ComponentTag === 'textarea' ? (
				<textarea className={`input-field ${className}`} {...props} />
			) : (
				<input className={`input-field ${className}`} {...props} />
			)}

			{error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
		</div>
	)
}

Input.propTypes = {
	label: PropTypes.string,
	error: PropTypes.string,
	className: PropTypes.string,
	as: PropTypes.oneOf(['input', 'select', 'textarea']),
	options: PropTypes.arrayOf(
		PropTypes.shape({
			value: PropTypes.string.isRequired,
			label: PropTypes.string.isRequired
		})
	)
}

Input.defaultProps = {
	label: '',
	error: '',
	className: '',
	as: 'input',
	options: []
}

export default Input
