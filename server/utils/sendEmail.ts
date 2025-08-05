import nodemailer from 'nodemailer';
import { config } from 'dotenv';
config({
	path: '../.env',
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
	console.log('SMTP Config:', {
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT,
		user: process.env.EMAIL_USERNAME,
		pass: process.env.EMAIL_PASSWORD,
	});

	const mailOptions = {
		from: process.env.EMAIL_USERNAME,
		to: options.to,
		subject: options.subject,
		html: options.html,
	};
	transporter.sendMail(mailOptions, (error: any, info: any) => {
		if (error) {
			console.log('Error sending email:', error);
		} else {
			console.log('Email sent successfully:', info.response);
		}
	});
};

sendEmail({
	to: 'manish.shivabhakti.99@gmail.com',
	subject: 'Test Email',
	text: 'This is a test email',
	html: '<p>This is a test email</p>',
})
	.then(() => {
		console.log('Email sent successfully');
	})
	.catch((error) => {
		console.error('Error sending email:', error);
	});
