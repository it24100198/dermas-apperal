import PropTypes from 'prop-types'
import { XMarkIcon } from '@heroicons/react/24/outline'

const Modal = ({ open, onClose, title, children, footer }) => {
	if (!open) return null

	return (
		<div className="fixed inset-0 z-50">
			<div className="absolute inset-0 bg-brand-navy/45" onClick={onClose} />
			<div className="absolute inset-0 grid place-items-center p-4">
				<div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl">
					<div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
						<h3 className="font-display text-lg text-brand-navy">{title}</h3>
						<button type="button" className="text-slate-500 hover:text-slate-700" onClick={onClose}>
							<XMarkIcon className="h-5 w-5" />
						</button>
					</div>

					<div className="px-5 py-4">{children}</div>

					{footer ? <div className="px-5 py-4 border-t border-slate-200">{footer}</div> : null}
				</div>
			</div>
		</div>
	)
}

Modal.propTypes = {
	open: PropTypes.bool,
	onClose: PropTypes.func,
	title: PropTypes.string,
	children: PropTypes.node,
	footer: PropTypes.node
}

Modal.defaultProps = {
	open: false,
	onClose: () => {},
	title: '',
	children: null,
	footer: null
}

export default Modal
