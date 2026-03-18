const nodemailer = require('nodemailer');

const createTransporter = () => {
	if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
		return nodemailer.createTransport({
			host: process.env.EMAIL_HOST,
			port: Number(process.env.EMAIL_PORT),
			secure: process.env.EMAIL_PORT === '465',
			auth: process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD
				? {
					user: process.env.EMAIL_USERNAME,
					pass: process.env.EMAIL_PASSWORD
				}
				: undefined
		});
	}

	// Fallback transport logs messages in development when SMTP is not configured.
	return nodemailer.createTransport({ jsonTransport: true });
};

const sendEmail = async ({ email, subject, message, html }) => {
	if (!email || !subject || (!message && !html)) {
		throw new Error('email, subject, and message or html are required to send email');
	}

	const transporter = createTransporter();

	const info = await transporter.sendMail({
		from: process.env.EMAIL_FROM || 'noreply@derma-apparel.local',
		to: email,
		subject,
		text: message,
		html
	});

	return info;
};

module.exports = sendEmail;
