import { Component } from 'react'
import PropTypes from 'prop-types'

class ErrorBoundary extends Component {
	constructor(props) {
		super(props)
		this.state = { hasError: false, errorMessage: '' }
	}

	static getDerivedStateFromError(error) {
		return {
			hasError: true,
			errorMessage: error?.message || 'Unexpected application error'
		}
	}

	componentDidCatch(error, errorInfo) {
		 
		console.error('Unhandled React error', error, errorInfo)
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen grid place-items-center bg-shell p-8">
					<div className="panel max-w-xl text-center">
						<h1 className="font-display text-3xl text-brand-navy">Something went wrong</h1>
						<p className="mt-3 text-slate-600">{this.state.errorMessage}</p>
						<button
							type="button"
							className="btn-primary mt-5"
							onClick={() => window.location.reload()}
						>
							Reload App
						</button>
					</div>
				</div>
			)
		}

		return this.props.children
	}
}

ErrorBoundary.propTypes = {
	children: PropTypes.node.isRequired
}

export default ErrorBoundary
