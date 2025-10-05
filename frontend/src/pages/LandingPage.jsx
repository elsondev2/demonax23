import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Sparkles, Heart, Star, Phone, Mail, MapPin, Moon, Sun } from "lucide-react";
import "../styles/landing.css";

export default function LandingPage() {
    const navigate = useNavigate();
    const [keySequence, setKeySequence] = useState([]);
    const [isDark, setIsDark] = useState(true); // Default to dark theme
    const [tapCount, setTapCount] = useState(0);
    const [lastTapTime, setLastTapTime] = useState(0);

    // Toggle theme
    const toggleTheme = () => {
        setIsDark(!isDark);
    };

    // Handle secret tap gesture for mobile (tap logo 5 times quickly)
    const handleLogoTap = () => {
        const now = Date.now();

        // Reset if more than 2 seconds since last tap
        if (now - lastTapTime > 2000) {
            setTapCount(1);
        } else {
            setTapCount(prev => prev + 1);
        }

        setLastTapTime(now);

        // If tapped 5 times within 2 seconds, activate
        if (tapCount >= 4) {
            console.log('🐕 Secret tap activated! Redirecting to app...');
            navigate('/logintowoof');
        }
    };

    useEffect(() => {
        const CHEAT_CODE = ['w', 'o', 'o', 'f']; // Type "woof" to access the app

        const handleKeyPress = (e) => {
            const newSequence = [...keySequence, e.key.toLowerCase()].slice(-4);
            setKeySequence(newSequence);

            // Check if cheat code matches
            if (newSequence.join('') === CHEAT_CODE.join('')) {
                console.log('🐕 Cheat code activated! Redirecting to app...');
                navigate('/logintowoof');
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [keySequence, navigate]);

    // Force body to allow scrolling - aggressive approach
    useEffect(() => {
        // Store original styles
        const originalBodyOverflow = document.body.style.overflow;
        const originalBodyHeight = document.body.style.height;
        const originalBodyPosition = document.body.style.position;
        const originalBodyWidth = document.body.style.width;
        const originalHtmlOverflow = document.documentElement.style.overflow;
        const originalHtmlHeight = document.documentElement.style.height;

        // Force scrolling
        document.body.style.setProperty('overflow', 'auto', 'important');
        document.body.style.setProperty('height', 'auto', 'important');
        document.body.style.setProperty('position', 'static', 'important');
        document.body.style.setProperty('width', '100%', 'important');
        document.documentElement.style.setProperty('overflow', 'auto', 'important');
        document.documentElement.style.setProperty('height', 'auto', 'important');

        const root = document.getElementById('root');
        let originalRootOverflow, originalRootHeight, originalRootPosition;
        if (root) {
            originalRootOverflow = root.style.overflow;
            originalRootHeight = root.style.height;
            originalRootPosition = root.style.position;
            root.style.setProperty('overflow', 'visible', 'important');
            root.style.setProperty('height', 'auto', 'important');
            root.style.setProperty('position', 'static', 'important');
        }

        console.log('🔧 Landing page: Forced scrolling enabled');

        return () => {
            // Restore original styles
            document.body.style.overflow = originalBodyOverflow;
            document.body.style.height = originalBodyHeight;
            document.body.style.position = originalBodyPosition;
            document.body.style.width = originalBodyWidth;
            document.documentElement.style.overflow = originalHtmlOverflow;
            document.documentElement.style.height = originalHtmlHeight;
            if (root) {
                root.style.overflow = originalRootOverflow;
                root.style.height = originalRootHeight;
                root.style.position = originalRootPosition;
            }
            console.log('🔧 Landing page: Restored original styles');
        };
    }, []);

    return (
        <div className={`landing-page ${isDark ? 'dark' : ''}`}>
            {/* Header */}
            <header className="container mx-auto px-4 py-6">
                <nav className="flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoTap}>
                        <div className="landing-feature-icon primary" style={{ width: '3rem', height: '3rem', marginBottom: 0 }}>
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold landing-text-primary">
                            PawSpa
                        </span>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="landing-btn-outline"
                        style={{ padding: '0.5rem', fontSize: '0.875rem', borderRadius: '50%', width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="landing-section container mx-auto px-4 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 landing-text-primary">
                        Premium Dog Washing Services
                    </h1>
                    <p className="text-xl md:text-2xl mb-8" style={{ color: 'var(--muted-foreground)' }}>
                        Give your furry friend the spa day they deserve! 🐕✨
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button className="landing-btn-primary flex items-center gap-2" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
                            <Heart className="w-5 h-5" />
                            Book Now
                        </button>
                        <button className="landing-btn-outline" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
                            Learn More
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="landing-section container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-12">Why Choose PawSpa?</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="landing-card p-6 text-center">
                        <div className="landing-feature-icon primary mx-auto">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Premium Products</h3>
                        <p style={{ color: 'var(--muted-foreground)' }}>We use only the finest, pet-safe shampoos and conditioners</p>
                    </div>

                    <div className="landing-card p-6 text-center">
                        <div className="landing-feature-icon accent mx-auto">
                            <Heart className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Loving Care</h3>
                        <p style={{ color: 'var(--muted-foreground)' }}>Our trained professionals treat every dog like family</p>
                    </div>

                    <div className="landing-card p-6 text-center">
                        <div className="landing-feature-icon secondary mx-auto">
                            <Star className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">5-Star Service</h3>
                        <p style={{ color: 'var(--muted-foreground)' }}>Rated #1 dog washing service in the area</p>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="landing-section" style={{ background: 'var(--secondary)' }}>
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-12">Our Services</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: 'Basic Bath', price: '$25', features: ['Shampoo', 'Rinse', 'Dry'] },
                            { name: 'Deluxe Spa', price: '$45', features: ['Bath', 'Conditioning', 'Nail Trim', 'Ear Cleaning'] },
                            { name: 'Premium Package', price: '$65', features: ['Full Spa', 'Teeth Brushing', 'Paw Massage', 'Bow Tie'] },
                            { name: 'Puppy Special', price: '$20', features: ['Gentle Bath', 'Soft Dry', 'Treats'] }
                        ].map((service, idx) => (
                            <div key={idx} className="landing-card p-6 transition-all hover:scale-105">
                                <h3 className="text-2xl font-bold mb-2">{service.name}</h3>
                                <p className="text-3xl font-bold mb-4" style={{ color: 'var(--primary)' }}>{service.price}</p>
                                <ul className="space-y-2 mb-4">
                                    {service.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--primary)' }}></div>
                                            <span style={{ color: 'var(--muted-foreground)' }}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className="landing-btn-primary w-full" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Select</button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="landing-section container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-12">Our Washing Process</h2>
                <div className="max-w-4xl mx-auto space-y-8">
                    {[
                        { step: '01', title: 'Check-In & Assessment', desc: 'We greet your pup and assess their coat condition, temperament, and any special needs.' },
                        { step: '02', title: 'Pre-Wash Brush', desc: 'Gentle brushing removes loose fur and tangles, preparing the coat for a thorough wash.' },
                        { step: '03', title: 'Luxury Bath', desc: 'Using premium, pet-safe products tailored to your dog\'s coat type and skin sensitivity.' },
                        { step: '04', title: 'Conditioning Treatment', desc: 'Deep conditioning leaves the coat soft, shiny, and healthy.' },
                        { step: '05', title: 'Blow Dry & Style', desc: 'Professional drying and styling to make your pup look their absolute best.' },
                        { step: '06', title: 'Final Touches', desc: 'Nail trim, ear cleaning, and a spritz of pet-safe cologne.' }
                    ].map((item, idx) => (
                        <div key={idx} className="landing-card p-6 flex gap-6 items-start">
                            <div className="text-4xl font-bold" style={{ color: 'var(--primary)', minWidth: '4rem' }}>{item.step}</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p style={{ color: 'var(--muted-foreground)' }}>{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why Professional Grooming */}
            <section className="landing-section" style={{ background: 'var(--muted)' }}>
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-12">Why Professional Dog Washing?</h2>
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {[
                            { title: 'Health Benefits', points: ['Prevents skin infections', 'Removes parasites and allergens', 'Early detection of health issues', 'Maintains healthy coat and skin'] },
                            { title: 'Expert Care', points: ['Trained professionals', 'Proper handling techniques', 'Breed-specific knowledge', 'Stress-free experience'] },
                            { title: 'Quality Products', points: ['Hypoallergenic shampoos', 'Natural ingredients', 'pH-balanced formulas', 'Coat-specific treatments'] },
                            { title: 'Time Saving', points: ['No mess at home', 'Professional equipment', 'Faster drying time', 'Complete service in one visit'] }
                        ].map((section, idx) => (
                            <div key={idx} className="landing-card p-6">
                                <h3 className="text-xl font-bold mb-4 landing-text-primary">{section.title}</h3>
                                <ul className="space-y-2">
                                    {section.points.map((point, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full mt-2" style={{ background: 'var(--primary)' }}></div>
                                            <span style={{ color: 'var(--muted-foreground)' }}>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Breed Specialties */}
            <section className="landing-section container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-12">Breed-Specific Expertise</h2>
                <p className="text-center mb-12 text-lg" style={{ color: 'var(--muted-foreground)' }}>
                    We understand that every breed has unique grooming needs
                </p>
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[
                        'Golden Retrievers', 'Poodles', 'German Shepherds', 'Bulldogs',
                        'Labrador Retrievers', 'Huskies', 'Yorkies', 'Beagles',
                        'Dachshunds', 'Shih Tzus', 'Boxers', 'Chihuahuas'
                    ].map((breed, idx) => (
                        <div key={idx} className="landing-card p-4 text-center hover:scale-105 transition-transform">
                            <div className="text-3xl mb-2">🐕</div>
                            <div className="font-semibold">{breed}</div>
                        </div>
                    ))}
                </div>
                <p className="text-center mt-8" style={{ color: 'var(--muted-foreground)' }}>
                    ...and many more! Don't see your breed? We handle all dogs with expert care.
                </p>
            </section>

            {/* Add-On Services */}
            <section className="landing-section" style={{ background: 'var(--muted)' }}>
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-12">Premium Add-Ons</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {[
                            { name: 'Teeth Brushing', price: '$10', desc: 'Keep those pearly whites shining' },
                            { name: 'Nail Grinding', price: '$8', desc: 'Smooth, rounded nails for comfort' },
                            { name: 'Paw Pad Treatment', price: '$12', desc: 'Moisturizing balm for healthy paws' },
                            { name: 'De-Shedding Treatment', price: '$15', desc: 'Reduce shedding by up to 80%' },
                            { name: 'Flea & Tick Treatment', price: '$18', desc: 'Protect against parasites' },
                            { name: 'Aromatherapy', price: '$10', desc: 'Calming lavender or energizing citrus' }
                        ].map((addon, idx) => (
                            <div key={idx} className="landing-card p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-lg">{addon.name}</h3>
                                    <span className="font-bold landing-text-primary">{addon.price}</span>
                                </div>
                                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{addon.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="landing-section container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-12">Happy Customers</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { name: 'Sarah M.', dog: 'Max', text: 'Max loves coming here! The staff is amazing and he always comes home smelling great! Been coming for 2 years now.' },
                        { name: 'John D.', dog: 'Bella', text: 'Best dog washing service ever! Bella gets so excited when we pull up. The de-shedding treatment is a game changer!' },
                        { name: 'Emily R.', dog: 'Charlie', text: 'Professional, caring, and affordable. Highly recommend! They handle my anxious pup with such patience.' },
                        { name: 'Michael T.', dog: 'Luna', text: 'Luna has sensitive skin and they use special hypoallergenic products. No more itching! Thank you PawSpa!' },
                        { name: 'Jessica L.', dog: 'Rocky', text: 'Rocky is a 90lb German Shepherd and they handle him like a pro. Great facility and friendly staff!' },
                        { name: 'David K.', dog: 'Milo', text: 'Worth every penny! Milo looks and smells amazing. The nail grinding service is perfect for his active lifestyle.' }
                    ].map((review, idx) => (
                        <div key={idx} className="landing-card p-6">
                            <div className="flex gap-1 mb-3">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4" style={{ fill: 'var(--chart-5)', color: 'var(--chart-5)' }} />
                                ))}
                            </div>
                            <p className="mb-4" style={{ color: 'var(--muted-foreground)' }}>"{review.text}"</p>
                            <div className="flex items-center gap-3">
                                <div className="rounded-full w-10 h-10 flex items-center justify-center" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                                    <span className="text-lg font-bold">{review.name[0]}</span>
                                </div>
                                <div>
                                    <p className="font-semibold">{review.name}</p>
                                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Owner of {review.dog}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Section */}
            <section className="landing-section" style={{ background: 'var(--muted)' }}>
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                    <div className="max-w-3xl mx-auto space-y-4">
                        {[
                            { q: 'How long does a typical wash take?', a: 'Most washes take 45-60 minutes depending on your dog\'s size and coat condition. We never rush - your pup\'s comfort is our priority!' },
                            { q: 'Do I need an appointment?', a: 'We recommend booking ahead to guarantee your preferred time slot, but we also accept walk-ins based on availability.' },
                            { q: 'What if my dog is anxious or aggressive?', a: 'Our staff is trained in handling anxious and reactive dogs. We use positive reinforcement and take breaks as needed. Your dog\'s safety and comfort come first.' },
                            { q: 'What products do you use?', a: 'We use premium, pet-safe, hypoallergenic products. All shampoos are pH-balanced and free from harsh chemicals. We can accommodate special requests for sensitive skin.' },
                            { q: 'Can I stay with my dog during the wash?', a: 'While we understand the concern, dogs typically do better when owners aren\'t present. However, you\'re welcome to watch through our viewing window!' },
                            { q: 'Do you offer packages or memberships?', a: 'Yes! We offer monthly membership plans with discounted rates. Ask our staff about our loyalty program - every 10th wash is 50% off!' },
                            { q: 'What age can puppies start?', a: 'Puppies can start as early as 8 weeks old after their first vaccinations. We offer gentle puppy introductions to make it a positive experience.' },
                            { q: 'Do you handle large breeds?', a: 'Absolutely! We have specialized equipment and experienced staff for dogs of all sizes, from tiny Chihuahuas to giant Great Danes.' }
                        ].map((faq, idx) => (
                            <div key={idx} className="landing-card p-6">
                                <h3 className="font-bold text-lg mb-2 landing-text-primary">{faq.q}</h3>
                                <p style={{ color: 'var(--muted-foreground)' }}>{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Hours & Location */}
            <section className="landing-section container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-12">Visit Us</h2>
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div className="landing-card p-8">
                        <h3 className="text-2xl font-bold mb-6 landing-text-primary">Hours</h3>
                        <div className="space-y-3">
                            {[
                                { day: 'Monday - Friday', hours: '8:00 AM - 7:00 PM' },
                                { day: 'Saturday', hours: '9:00 AM - 6:00 PM' },
                                { day: 'Sunday', hours: '10:00 AM - 5:00 PM' },
                                { day: 'Holidays', hours: 'Call for hours' }
                            ].map((schedule, idx) => (
                                <div key={idx} className="flex justify-between items-center pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                                    <span className="font-semibold">{schedule.day}</span>
                                    <span style={{ color: 'var(--muted-foreground)' }}>{schedule.hours}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="landing-card p-8">
                        <h3 className="text-2xl font-bold mb-6 landing-text-primary">Location</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="font-semibold mb-1">Address</div>
                                <div style={{ color: 'var(--muted-foreground)' }}>123 Bark Street<br />Dogtown, DT 12345</div>
                            </div>
                            <div>
                                <div className="font-semibold mb-1">Phone</div>
                                <div style={{ color: 'var(--muted-foreground)' }}>(555) DOG-WASH</div>
                            </div>
                            <div>
                                <div className="font-semibold mb-1">Email</div>
                                <div style={{ color: 'var(--muted-foreground)' }}>hello@pawspa.com</div>
                            </div>
                            <div className="pt-4">
                                <button className="landing-btn-primary w-full">Get Directions</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="landing-section" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-8">Ready to Pamper Your Pup?</h2>
                    <p className="text-xl mb-8">Book your appointment today!</p>
                    <div className="flex flex-wrap gap-6 justify-center mb-12">
                        <div className="flex items-center gap-2">
                            <Phone className="w-5 h-5" />
                            <span>(555) DOG-WASH</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            <span>hello@pawspa.com</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            <span>123 Bark Street, Dogtown</span>
                        </div>
                    </div>
                    <button
                        className="landing-btn-primary"
                        style={{
                            background: 'var(--card)',
                            color: 'var(--primary)',
                            fontSize: '1.125rem',
                            padding: '1rem 2rem'
                        }}
                    >
                        Book Appointment
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ background: 'var(--muted)', padding: '2rem 0' }}>
                <div className="container mx-auto px-4 text-center">
                    <p style={{ color: 'var(--muted-foreground)' }}>
                        © 2024 PawSpa. All rights reserved. Made with <Heart className="w-4 h-4 inline" style={{ color: 'var(--destructive)' }} /> for dogs.
                    </p>
                    <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>
                        🐕 Psst... Desktop: Type "1 4M 4N 1D10T" Bcoz you are...! | Mobile: Draw the number of brain sell you have left. Let me guess is it 0.
                    </p>    
                </div>
            </footer>
        </div>
    );
}
