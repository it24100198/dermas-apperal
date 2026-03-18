import PropTypes from 'prop-types'

const Loader = ({ text, inline }) => {
	if (inline) {
		return (
			<div className="flex items-center gap-2 text-sm text-slate-600">
				<span className="h-4 w-4 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
				{text}
			</div>
		)
	}

	return (
		<div className="min-h-[280px] grid place-items-center">
			<div className="flex flex-col items-center gap-3">
				<span className="h-10 w-10 border-[3px] border-brand-cyan border-t-transparent rounded-full animate-spin" />
				<p className="text-sm text-slate-600">{text}</p>
			</div>
		</div>
	)
}

Loader.propTypes = {
	text: PropTypes.string,
	inline: PropTypes.bool
}

Loader.defaultProps = {
	text: 'Loading...',
	inline: false
}

export default Loader
