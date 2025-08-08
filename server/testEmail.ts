import nodemailer from 'nodemailer';
import { config } from 'dotenv';
config({
	path: '.env',
});

export const sendEmail = async (options: {
	to: string;
	subject: string;
	text: string;
	html: string;
}) => {
	let transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		secure: true,
		port: 465,
		auth: {
			user: process.env.EMAIL_USERNAME,
			pass: process.env.EMAIL_PASSWORD,
		},
	});

	const mailOptions = {
		from: `"Shoq Store" <${process.env.EMAIL_USERNAME}>`,
		to: options.to,
		subject: options.subject,
		html: options.html,
	};

	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, (error: any, info: any) => {
			if (error) {
				console.log('Error sending email:', error);
				reject(error);
			} else {
				console.log('Email sent successfully:', info.response);
				resolve(info);
			}
		});
	});
};

sendEmail({
	to: 'manish.shivabhakti.99@gmail.com',
	subject: 'Shoq Store - Test Email',
	text: 'This is a test email from Shoq Store',
	html: `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #6366f1;">Shoq Store</h2>
			<p>Hello!</p>
			<p>This is a test email from <strong>Shoq Store</strong> to verify that our email system is working correctly.</p>
			<p>If you received this email, it means our email configuration is properly set up.</p>
			<hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
			<p style="color: #6b7280; font-size: 14px;">
				This is an automated test email. Please ignore if not intended for you.
			</p>
		</div>
	`,
})
	.then(() => {
		console.log('Email sent successfully');
	})
	.catch((error) => {
		console.error('Error sending email:', error);
	});
