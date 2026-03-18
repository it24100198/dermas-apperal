import PropTypes from 'prop-types'
import clsx from 'clsx'

const Card = ({ title, subtitle, actions, className, children }) => {
	return (
		<section className={clsx('panel', className)}>
			{(title || actions) && (
				<header className="flex items-start justify-between gap-4 mb-4">
					<div>
						{title ? <h3 className="text-lg text-brand-navy">{title}</h3> : null}
						{subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
					</div>
					{actions ? <div>{actions}</div> : null}
				</header>
			)}
			{children}
		</section>
	)
}

Card.propTypes = {
	title: PropTypes.string,
	subtitle: PropTypes.string,
	actions: PropTypes.node,
	className: PropTypes.string,
	children: PropTypes.node.isRequired
}

Card.defaultProps = {
	title: '',
	subtitle: '',
	actions: null,
	className: ''
}

export default Card
