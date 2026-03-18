import PropTypes from 'prop-types'
import clsx from 'clsx'

const Button = ({
	type,
	variant,
	className,
	children,
	loading,
	disabled,
	...props
}) => {
	const variantClass = {
		primary: 'btn-primary',
		dashboard: 'btn-dashboard',
		secondary: 'btn-secondary',
		danger: 'btn-danger'
	}[variant]

	return (
		<button
			type={type}
			className={clsx(variantClass, className)}
			disabled={disabled || loading}
			{...props}
		>
			{loading ? 'Please wait...' : children}
		</button>
	)
}

Button.propTypes = {
	type: PropTypes.oneOf(['button', 'submit', 'reset']),
	variant: PropTypes.oneOf(['primary', 'dashboard', 'secondary', 'danger']),
	className: PropTypes.string,
	children: PropTypes.node.isRequired,
	loading: PropTypes.bool,
	disabled: PropTypes.bool
}

Button.defaultProps = {
	type: 'button',
	variant: 'primary',
	className: '',
	loading: false,
	disabled: false
}

export default Button
