import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export interface EmailOptions {
	to: string;
	subject: string;
	text?: string;
	html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
	try {
		// Check if email is configured
		if (
			!process.env.SMTP_HOST ||
			!process.env.EMAIL_USERNAME ||
			!process.env.EMAIL_PASSWORD
		) {
			console.log('📧 Email not configured - skipping email send');
			return false;
		}

		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			secure: true,
			port: 465,
			auth: {
				user: process.env.EMAIL_USERNAME,
				pass: process.env.EMAIL_PASSWORD,
			},
		});

		console.log('📧 Attempting to send email:');
		console.log('   To:', options.to);
		console.log('   Subject:', options.subject);
		console.log('   From:', process.env.EMAIL_USERNAME);

		const mailOptions = {
			from: `"Shoq Store" <${process.env.EMAIL_USERNAME}>`,
			to: options.to,
			subject: options.subject,
			text: options.text,
			html: options.html,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log('✅ Email sent successfully:', info.messageId);
		console.log('   Message ID:', info.messageId);
		console.log('   Response:', info.response);
		return true;
	} catch (error) {
		console.error('❌ Error sending email:', error);
		return false;
	}
};
