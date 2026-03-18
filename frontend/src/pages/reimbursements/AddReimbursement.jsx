import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import ReimbursementForm from '../../components/forms/ReimbursementForm'
import reimbursementService from '../../services/reimbursementService'
import Card from '../../components/common/Card'
import { getErrorMessage } from '../../utils/helpers'

const AddReimbursement = () => {
	const navigate = useNavigate()
	const [loading, setLoading] = useState(false)

	const submitHandler = async (payload) => {
		try {
			setLoading(true)
			await reimbursementService.submitClaim(payload)
			toast.success('Reimbursement claim submitted')
			navigate('/reimbursements')
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to submit claim'))
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="max-w-4xl mx-auto space-y-5">
			<h1 className="text-3xl font-display text-brand-navy">Submit Reimbursement Claim</h1>
			<Card>
				<ReimbursementForm
					initialValues={{}}
					loading={loading}
					submitLabel="Submit Claim"
					onSubmit={submitHandler}
					onCancel={() => navigate('/reimbursements')}
				/>
			</Card>
		</div>
	)
}

export default AddReimbursement
