import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Solution from '@/components/Solution';
import Features from '@/components/Features';
import Testimonials from '@/components/Testimonials';
import CallToAction from '@/components/CallToAction';
import Footer from '@/components/Footer';

export default function App() {
	return (
		<div className='bg-slate-50 min-h-screen'>
			<Navbar />
			<Hero />
			<Solution />
			<Features />
			<Testimonials />
			<CallToAction />
			<Footer />
		</div>
	);
}
