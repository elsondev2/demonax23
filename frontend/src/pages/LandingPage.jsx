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
            navigate('/login');
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
                navigate('/login');
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
            <section className="landing-hero-section container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left">
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 landing-text-primary leading-tight">
                                Premium Dog Washing Services
                            </h1>
                            <p className="text-lg md:text-xl lg:text-2xl mb-8 text-muted-foreground leading-relaxed">
                                Give your furry friend the spa day they deserve! 🐕✨
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <button className="landing-btn-primary flex items-center justify-center gap-2 text-lg px-8 py-4">
                                    <Heart className="w-6 h-6" />
                                    Book Now
                                </button>
                                <button className="landing-btn-outline text-lg px-8 py-4">
                                    Learn More
                                </button>
                            </div>
                        </div>
                        <div className="hidden lg:block">
                            <div className="landing-hero-image">
                                <div className="text-9xl mb-4">🐕</div>
                                <div className="text-6xl">✨</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="landing-section container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 landing-text-primary">Why Choose PawSpa?</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Experience the difference with our premium dog grooming services
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <div className="landing-card p-8 text-center hover:scale-105 transition-transform duration-300">
                        <div className="landing-feature-icon primary mx-auto mb-6">
                            <Sparkles className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 landing-text-primary">Premium Products</h3>
                        <p className="text-muted-foreground leading-relaxed">We use only the finest, pet-safe shampoos and conditioners formulated for your dog's specific needs</p>
                    </div>

                    <div className="landing-card p-8 text-center hover:scale-105 transition-transform duration-300">
                        <div className="landing-feature-icon accent mx-auto mb-6">
                            <Heart className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 landing-text-primary">Loving Care</h3>
                        <p className="text-muted-foreground leading-relaxed">Our trained professionals treat every dog like family, ensuring a stress-free and enjoyable experience</p>
                    </div>

                    <div className="landing-card p-8 text-center hover:scale-105 transition-transform duration-300">
                        <div className="landing-feature-icon secondary mx-auto mb-6">
                            <Star className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 landing-text-primary">5-Star Service</h3>
                        <p className="text-muted-foreground leading-relaxed">Rated #1 dog washing service in the area with hundreds of happy customers and their pampered pups</p>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="landing-section" style={{ background: 'var(--secondary)' }}>
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 landing-text-primary">Our Services</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Choose the perfect package for your furry friend's grooming needs
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                        {[
                            { name: 'Basic Bath', price: '$25', features: ['Shampoo', 'Rinse', 'Dry'], popular: false },
                            { name: 'Deluxe Spa', price: '$45', features: ['Bath', 'Conditioning', 'Nail Trim', 'Ear Cleaning'], popular: true },
                            { name: 'Premium Package', price: '$65', features: ['Full Spa', 'Teeth Brushing', 'Paw Massage', 'Bow Tie'], popular: false },
                            { name: 'Puppy Special', price: '$20', features: ['Gentle Bath', 'Soft Dry', 'Treats'], popular: false }
                        ].map((service, idx) => (
                            <div key={idx} className={`landing-card p-8 transition-all hover:scale-105 relative ${service.popular ? 'ring-2 ring-primary' : ''}`}>
                                {service.popular && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                                            Most Popular
                                        </span>
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold mb-3 landing-text-primary">{service.name}</h3>
                                <p className="text-4xl font-bold mb-6 landing-text-primary">{service.price}</p>
                                <ul className="space-y-3 mb-8">
                                    {service.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className="landing-btn-primary w-full py-3 text-lg font-semibold">Select Package</button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="landing-section container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 landing-text-primary">Our Washing Process</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        A step-by-step journey to your dog's perfect pampering experience
                    </p>
                </div>
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            { step: '01', title: 'Check-In & Assessment', desc: 'We greet your pup and assess their coat condition, temperament, and any special needs.' },
                            { step: '02', title: 'Pre-Wash Brush', desc: 'Gentle brushing removes loose fur and tangles, preparing the coat for a thorough wash.' },
                            { step: '03', title: 'Luxury Bath', desc: 'Using premium, pet-safe products tailored to your dog\'s coat type and skin sensitivity.' },
                            { step: '04', title: 'Conditioning Treatment', desc: 'Deep conditioning leaves the coat soft, shiny, and healthy.' },
                            { step: '05', title: 'Blow Dry & Style', desc: 'Professional drying and styling to make your pup look their absolute best.' },
                            { step: '06', title: 'Final Touches', desc: 'Nail trim, ear cleaning, and a spritz of pet-safe cologne.' }
                        ].map((item, idx) => (
                            <div key={idx} className="landing-card p-8 flex gap-6 items-start hover:shadow-lg transition-shadow duration-300">
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                        <span className="text-2xl font-bold landing-text-primary">{item.step}</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold mb-3 landing-text-primary">{item.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
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
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 landing-text-primary">Breed-Specific Expertise</h2>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        We understand that every breed has unique grooming needs. Our experienced team specializes in all breeds, from tiny companions to large athletic dogs.
                    </p>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {[
                        { name: 'Golden Retrievers', emoji: '🐕', specialty: 'Double coats' },
                        { name: 'Poodles', emoji: '🐩', specialty: 'Curly coats' },
                        { name: 'German Shepherds', emoji: '🐕', specialty: 'Thick undercoats' },
                        { name: 'Bulldogs', emoji: '🐕', specialty: 'Wrinkle care' },
                        { name: 'Labrador Retrievers', emoji: '🐕', specialty: 'Water-resistant coats' },
                        { name: 'Huskies', emoji: '🐺', specialty: 'Siberian coats' },
                        { name: 'Yorkies', emoji: '🐕', specialty: 'Long silky hair' },
                        { name: 'Beagles', emoji: '🐕', specialty: 'Hound ears' },
                        { name: 'Dachshunds', emoji: '🐕', specialty: 'Long backs' },
                        { name: 'Shih Tzus', emoji: '🐕', specialty: 'Luxurious coats' },
                        { name: 'Boxers', emoji: '🐕', specialty: 'Short coats' },
                        { name: 'Chihuahuas', emoji: '🐕', specialty: 'Tiny but mighty' }
                    ].map((breed, idx) => (
                        <div key={idx} className="landing-card p-6 text-center hover:scale-105 hover:shadow-lg transition-all duration-300 group cursor-pointer">
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{breed.emoji}</div>
                            <div className="font-bold text-lg mb-2 landing-text-primary">{breed.name}</div>
                            <div className="text-sm text-muted-foreground group-hover:text-primary transition-colors">{breed.specialty}</div>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-12">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-full">
                        <span className="text-2xl">✨</span>
                        <p className="text-muted-foreground font-medium">
                            Don't see your breed? We handle all dogs with expert care and personalized attention!
                        </p>
                        <span className="text-2xl">✨</span>
                    </div>
                </div>
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
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 landing-text-primary">Happy Customers</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Don't just take our word for it - hear from our satisfied customers
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {[
                        { name: 'Sarah M.', dog: 'Max', text: 'Max loves coming here! The staff is amazing and he always comes home smelling great! Been coming for 2 years now.', rating: 5 },
                        { name: 'John D.', dog: 'Bella', text: 'Best dog washing service ever! Bella gets so excited when we pull up. The de-shedding treatment is a game changer!', rating: 5 },
                        { name: 'Emily R.', dog: 'Charlie', text: 'Professional, caring, and affordable. Highly recommend! They handle my anxious pup with such patience.', rating: 5 },
                        { name: 'Michael T.', dog: 'Luna', text: 'Luna has sensitive skin and they use special hypoallergenic products. No more itching! Thank you PawSpa!', rating: 5 },
                        { name: 'Jessica L.', dog: 'Rocky', text: 'Rocky is a 90lb German Shepherd and they handle him like a pro. Great facility and friendly staff!', rating: 5 },
                        { name: 'David K.', dog: 'Milo', text: 'Worth every penny! Milo looks and smells amazing. The nail grinding service is perfect for his active lifestyle.', rating: 5 }
                    ].map((review, idx) => (
                        <div key={idx} className="landing-card p-8 hover:shadow-xl transition-shadow duration-300">
                            <div className="flex gap-1 mb-4">
                                {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5" style={{ fill: 'var(--chart-5)', color: 'var(--chart-5)' }} />
                                ))}
                            </div>
                            <blockquote className="mb-6 text-muted-foreground italic leading-relaxed">
                                "{review.text}"
                            </blockquote>
                            <div className="flex items-center gap-4">
                                <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary text-primary-foreground font-bold text-lg">
                                    {review.name[0]}
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">{review.name}</p>
                                    <p className="text-sm text-muted-foreground">Owner of {review.dog}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Section */}
            <section className="landing-section" style={{ background: 'var(--muted)' }}>
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 landing-text-primary">Frequently Asked Questions</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Everything you need to know about our dog washing services
                        </p>
                    </div>
                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                { q: 'How long does a typical wash take?', a: 'Most washes take 45-60 minutes depending on your dog\'s size and coat condition. We never rush - your pup\'s comfort is our priority!', icon: '⏱️' },
                                { q: 'Do I need an appointment?', a: 'We recommend booking ahead to guarantee your preferred time slot, but we also accept walk-ins based on availability.', icon: '📅' },
                                { q: 'What if my dog is anxious or aggressive?', a: 'Our staff is trained in handling anxious and reactive dogs. We use positive reinforcement and take breaks as needed. Your dog\'s safety and comfort come first.', icon: '🐕' },
                                { q: 'What products do you use?', a: 'We use premium, pet-safe, hypoallergenic products. All shampoos are pH-balanced and free from harsh chemicals. We can accommodate special requests for sensitive skin.', icon: '🧴' },
                                { q: 'Can I stay with my dog during the wash?', a: 'While we understand the concern, dogs typically do better when owners aren\'t present. However, you\'re welcome to watch through our viewing window!', icon: '👀' },
                                { q: 'Do you offer packages or memberships?', a: 'Yes! We offer monthly membership plans with discounted rates. Ask our staff about our loyalty program - every 10th wash is 50% off!', icon: '💎' },
                                { q: 'What age can puppies start?', a: 'Puppies can start as early as 8 weeks old after their first vaccinations. We offer gentle puppy introductions to make it a positive experience.', icon: '🐾' },
                                { q: 'Do you handle large breeds?', a: 'Absolutely! We have specialized equipment and experienced staff for dogs of all sizes, from tiny Chihuahuas to giant Great Danes.', icon: '💪' }
                            ].map((faq, idx) => (
                                <div key={idx} className="landing-card p-6 hover:shadow-lg transition-all duration-300 group">
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                                            {faq.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg mb-3 landing-text-primary group-hover:text-primary transition-colors">
                                                {faq.q}
                                            </h3>
                                            <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Hours & Location */}
            <section className="landing-section container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 landing-text-primary">Visit Us</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Come experience the PawSpa difference in person
                    </p>
                </div>
                <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    <div className="landing-card p-8 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-2xl">🕐</span>
                            </div>
                            <h3 className="text-2xl font-bold landing-text-primary">Hours of Operation</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { day: 'Monday - Friday', hours: '8:00 AM - 7:00 PM', status: 'open' },
                                { day: 'Saturday', hours: '9:00 AM - 6:00 PM', status: 'open' },
                                { day: 'Sunday', hours: '10:00 AM - 5:00 PM', status: 'open' },
                                { day: 'Holidays', hours: 'Call for hours', status: 'special' }
                            ].map((schedule, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${schedule.status === 'open' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                        <span className="font-semibold">{schedule.day}</span>
                                    </div>
                                    <span className="text-muted-foreground font-medium">{schedule.hours}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                <strong>Pro tip:</strong> Book ahead during peak hours (10 AM - 2 PM) for the best experience!
                            </p>
                        </div>
                    </div>
                    <div className="landing-card p-8 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-2xl">📍</span>
                            </div>
                            <h3 className="text-2xl font-bold landing-text-primary">Location & Contact</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                                <div>
                                    <div className="font-semibold mb-1">Address</div>
                                    <div className="text-muted-foreground">123 Bark Street<br />Dogtown, DT 12345</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                                <div>
                                    <div className="font-semibold mb-1">Phone</div>
                                    <div className="text-muted-foreground">(555) DOG-WASH</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                                <div>
                                    <div className="font-semibold mb-1">Email</div>
                                    <div className="text-muted-foreground">hello@pawspa.com</div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-border">
                                <button className="landing-btn-primary w-full flex items-center justify-center gap-2 py-3">
                                    <MapPin className="w-5 h-5" />
                                    Get Directions
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="landing-section" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                <div className="container mx-auto px-4 text-center">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Ready to Pamper Your Pup?</h2>
                        <p className="text-lg md:text-xl mb-12 opacity-90">Book your appointment today and give your furry friend the royal treatment they deserve!</p>
                        <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-3xl mx-auto">
                            <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-white/10 backdrop-blur-sm">
                                <Phone className="w-8 h-8" />
                                <div>
                                    <p className="font-semibold text-lg">(555) DOG-WASH</p>
                                    <p className="text-sm opacity-75">Call us anytime</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-white/10 backdrop-blur-sm">
                                <Mail className="w-8 h-8" />
                                <div>
                                    <p className="font-semibold text-lg">hello@pawspa.com</p>
                                    <p className="text-sm opacity-75">Email us</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-white/10 backdrop-blur-sm">
                                <MapPin className="w-8 h-8" />
                                <div>
                                    <p className="font-semibold text-lg">123 Bark Street</p>
                                    <p className="text-sm opacity-75">Dogtown, DT 12345</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                className="landing-btn-primary text-lg px-8 py-4 font-semibold"
                                style={{
                                    background: 'var(--card)',
                                    color: 'var(--primary)',
                                    border: 'none'
                                }}
                            >
                                Book Appointment Now
                            </button>
                            <button
                                className="landing-btn-outline text-lg px-8 py-4 font-semibold"
                                style={{
                                    background: 'transparent',
                                    color: 'var(--card)',
                                    border: '2px solid var(--card)'
                                }}
                            >
                                Call (555) DOG-WASH
                            </button>
                        </div>
                    </div>
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
