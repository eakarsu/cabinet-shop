import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const MATERIALS = [
  { slug: "black-pearl-granite", name: "Black Pearl Granite", category: "Granite", kind: "Natural Stone", origin: "India", priceTier: "$$", featured: true, blurb: "Deep charcoal granite flecked with silver mica — a dramatic, durable workhorse.", features: ["Heat resistant", "Low porosity", "Sealed for life"], swatch: "from-stone-800 via-stone-600 to-stone-900" },
  { slug: "blue-pearl-granite", name: "Blue Pearl Granite", category: "Granite", kind: "Natural Stone", origin: "Norway", priceTier: "$$$", featured: false, blurb: "Shimmering blue-grey crystals that catch the light from every angle.", features: ["Iridescent crystals", "Scratch resistant", "Polished finish"], swatch: "from-slate-700 via-slate-500 to-slate-800" },
  { slug: "uba-tuba-granite", name: "Uba Tuba Granite", category: "Granite", kind: "Natural Stone", origin: "Brazil", priceTier: "$$", featured: false, blurb: "Forest-green to near-black with gold and green specks. A timeless kitchen classic.", features: ["Hides wear well", "Heat resistant", "200+ slabs"], swatch: "from-emerald-900 via-stone-700 to-stone-900" },
  { slug: "leathered-granite", name: "Leathered Black Granite", category: "Granite", kind: "Natural Stone", origin: "Brazil", priceTier: "$$$", featured: true, blurb: "A soft matte leathered finish that resists fingerprints and adds texture.", features: ["Matte texture", "Fingerprint-proof", "Bar favorite"], swatch: "from-neutral-700 via-neutral-600 to-neutral-900" },
  { slug: "calacatta-quartz", name: "Calacatta Quartz", category: "Quartz", kind: "Engineered", origin: "Engineered", priceTier: "$$$", featured: true, blurb: "Bold grey veining on a bright white field — the look of marble, the toughness of quartz.", features: ["Non-porous", "No sealing", "15-year warranty"], swatch: "from-slate-200 via-white to-zinc-300" },
  { slug: "carrara-quartz", name: "Carrara Quartz", category: "Quartz", kind: "Engineered", origin: "Engineered", priceTier: "$$", featured: false, blurb: "Soft, feathery grey veins for a light and airy kitchen.", features: ["Consistent pattern", "Stain resistant", "Low maintenance"], swatch: "from-zinc-200 via-white to-zinc-400" },
  { slug: "pure-white-quartz", name: "Pure White Quartz", category: "Quartz", kind: "Engineered", origin: "Engineered", priceTier: "$$", featured: false, blurb: "Crisp, uniform white with no veining for a clean modern statement.", features: ["Uniform color", "Non-porous", "Easy to clean"], swatch: "from-white via-zinc-100 to-zinc-300" },
  { slug: "charcoal-quartz", name: "Charcoal Concrete Quartz", category: "Quartz", kind: "Engineered", origin: "Engineered", priceTier: "$$", featured: false, blurb: "A matte concrete look in deep charcoal — industrial and forgiving.", features: ["Matte finish", "Hides crumbs", "Scratch resistant"], swatch: "from-zinc-600 via-zinc-500 to-zinc-800" },
  { slug: "carrara-marble", name: "Carrara Marble", category: "Marble", kind: "Natural Stone", origin: "Italy", priceTier: "$$$", featured: true, blurb: "The quintessential Italian marble — soft grey veining on warm white.", features: ["Honed or polished", "Timeless veining", "Bookmatched"], swatch: "from-slate-100 via-white to-slate-300" },
  { slug: "calacatta-gold-marble", name: "Calacatta Gold Marble", category: "Marble", kind: "Natural Stone", origin: "Italy", priceTier: "$$$", featured: false, blurb: "Dramatic gold and grey veins on a bright white background. A true centerpiece.", features: ["Gold veining", "Statement pieces", "Polished"], swatch: "from-amber-50 via-white to-stone-300" },
  { slug: "emperador-marble", name: "Emperador Brown Marble", category: "Marble", kind: "Natural Stone", origin: "Spain", priceTier: "$$", featured: false, blurb: "Rich brown marble with fine white veining — warm and elegant for baths.", features: ["Warm tones", "Fine veining", "Vanity favorite"], swatch: "from-amber-900 via-stone-700 to-amber-950" },
  { slug: "shaker-maple", name: "Shaker Maple Cabinetry", category: "Cabinetry", kind: "Built in-house", origin: "North America", priceTier: "$$", featured: true, blurb: "Clean recessed-panel maple doors — the most versatile cabinet style we build.", features: ["Solid wood", "Soft-close", "Made to measure"], swatch: "from-amber-700 via-amber-600 to-amber-900" },
  { slug: "white-painted-cabinetry", name: "White Painted Cabinetry", category: "Cabinetry", kind: "Built in-house", origin: "North America", priceTier: "$$$", featured: false, blurb: "Factory-finished painted doors in a durable conversion varnish.", features: ["Hand-sprayed", "Chip resistant", "Dovetail drawers"], swatch: "from-zinc-100 via-white to-zinc-300" },
  { slug: "rift-oak-cabinetry", name: "Rift White Oak Cabinetry", category: "Cabinetry", kind: "Built in-house", origin: "North America", priceTier: "$$$", featured: true, blurb: "Straight-grain rift-cut oak for a warm, modern, natural look.", features: ["Rift-cut grain", "Natural finish", "Custom sizing"], swatch: "from-amber-200 via-amber-400 to-amber-700" },
  { slug: "two-tone-navy", name: "Two-Tone Navy & Oak", category: "Cabinetry", kind: "Built in-house", origin: "North America", priceTier: "$$$", featured: false, blurb: "Deep navy base cabinets paired with natural oak uppers and island.", features: ["Custom color match", "Mixed materials", "Designer favorite"], swatch: "from-emerald-900 via-amber-700 to-stone-800" },
  { slug: "soapstone", name: "Soapstone", category: "Granite", kind: "Natural Stone", origin: "Brazil", priceTier: "$$$", featured: false, blurb: "Soft to the touch, heat-proof, and naturally non-porous — a farmhouse staple.", features: ["Heat-proof", "Non-porous", "Ages beautifully"], swatch: "from-slate-800 via-slate-600 to-neutral-900" },
];

const PROJECTS = [
  { title: "Calacatta Quartz Waterfall Island", tag: "Quartz", location: "Riverton Heights", year: 2024, featured: true, grad: "from-slate-200 to-zinc-400", description: "A 10-foot island with double waterfall edges in Calacatta quartz." },
  { title: "Black Pearl Galley Kitchen", tag: "Granite", location: "Old Town", year: 2024, featured: true, grad: "from-stone-800 to-stone-600", description: "Compact galley remodel with seamless Black Pearl granite runs." },
  { title: "Shaker Maple Family Kitchen", tag: "Cabinetry", location: "Maple Grove", year: 2023, featured: false, grad: "from-amber-700 to-amber-900", description: "Full set of soft-close shaker maple cabinets with a butler's pantry." },
  { title: "Carrara Marble Master Bath", tag: "Marble", location: "Lakeshore", year: 2023, featured: true, grad: "from-slate-100 to-slate-300", description: "Honed Carrara vanity tops and a bookmatched shower surround." },
  { title: "Waterfall Edge Peninsula", tag: "Quartz", location: "Brookside", year: 2024, featured: false, grad: "from-zinc-200 to-zinc-500", description: "Seating peninsula with a waterfall return in pure white quartz." },
  { title: "Two-Tone Navy Kitchen", tag: "Cabinetry", location: "Riverton", year: 2024, featured: true, grad: "from-emerald-900 to-stone-700", description: "Navy base cabinets, rift oak uppers, and a quartz-topped island." },
  { title: "Leathered Granite Wet Bar", tag: "Granite", location: "Hillcrest", year: 2022, featured: false, grad: "from-neutral-700 to-neutral-900", description: "Basement wet bar in leathered black granite with floating shelves." },
  { title: "Honed Marble Powder Room", tag: "Marble", location: "Old Town", year: 2023, featured: false, grad: "from-stone-200 to-slate-300", description: "Petite powder-room vanity in honed Emperador marble." },
  { title: "Blue Pearl Entertainer's Kitchen", tag: "Granite", location: "Lakeshore", year: 2022, featured: false, grad: "from-slate-700 to-slate-900", description: "Iridescent Blue Pearl counters across a U-shaped layout." },
  { title: "Rift Oak Modern Kitchen", tag: "Cabinetry", location: "Midtown", year: 2024, featured: true, grad: "from-amber-300 to-amber-700", description: "Flat-panel rift white oak cabinetry with integrated appliances." },
  { title: "Calacatta Gold Statement Island", tag: "Marble", location: "Highland Park", year: 2024, featured: false, grad: "from-amber-100 to-stone-300", description: "A single bookmatched Calacatta Gold slab as the island centerpiece." },
  { title: "Charcoal Quartz Loft Kitchen", tag: "Quartz", location: "The Mill District", year: 2023, featured: false, grad: "from-zinc-600 to-zinc-800", description: "Industrial loft with matte charcoal quartz and black hardware." },
  { title: "Soapstone Farmhouse Kitchen", tag: "Granite", location: "County Line", year: 2022, featured: false, grad: "from-slate-800 to-neutral-900", description: "Classic farmhouse with soapstone counters and an apron sink." },
  { title: "White Painted Coastal Kitchen", tag: "Cabinetry", location: "Bayview", year: 2023, featured: false, grad: "from-zinc-100 to-zinc-300", description: "Bright coastal kitchen in hand-sprayed white painted cabinetry." },
  { title: "Carrara Quartz Butler's Pantry", tag: "Quartz", location: "Highland Park", year: 2024, featured: false, grad: "from-zinc-200 to-zinc-400", description: "A walk-in butler's pantry wrapped in Carrara quartz." },
  { title: "Uba Tuba Outdoor Kitchen", tag: "Granite", location: "Riverton Heights", year: 2023, featured: false, grad: "from-emerald-900 to-stone-900", description: "Weather-tough Uba Tuba granite for a covered outdoor kitchen." },
];

const SERVICES = [
  { slug: "design-consultation", title: "Design Consultation", icon: "DraftingCompass", description: "Plan layout, material, and finish with a designer. Bring photos — we bring the slabs." },
  { slug: "laser-templating", title: "Laser Templating", icon: "Ruler", description: "Digital templating captures your space to the millimeter for a perfect fit." },
  { slug: "cnc-fabrication", title: "CNC Fabrication", icon: "PencilRuler", description: "Stone and cabinets cut on our in-house CNC for precise, repeatable edges." },
  { slug: "professional-install", title: "Professional Install", icon: "Hammer", description: "Our crews handle removal, reconnect, and a flawless install — often in a day." },
  { slug: "cabinet-refacing", title: "Cabinet Refacing", icon: "Paintbrush", description: "Keep your layout, transform the look — new doors, fronts, and veneers." },
  { slug: "custom-cabinetry", title: "Custom Cabinetry", icon: "Layers", description: "Shop-built cabinets in any size, wood, and finish you can imagine." },
  { slug: "countertop-replacement", title: "Countertop Replacement", icon: "SquareStack", description: "Swap dated counters for new stone, usually within two weeks." },
  { slug: "edge-profiling", title: "Edge Profiling", icon: "Scissors", description: "Eased, bullnose, ogee, mitered waterfall — your edge, your choice." },
  { slug: "sink-faucet-cutouts", title: "Sink & Faucet Cutouts", icon: "Droplets", description: "Precision undermount sink and faucet cutouts done in-shop." },
  { slug: "backsplash-install", title: "Backsplash Installation", icon: "Square", description: "Full-height stone backsplashes that match your counters seamlessly." },
  { slug: "sealing-restoration", title: "Sealing & Restoration", icon: "Sparkles", description: "Reseal, polish, and restore tired natural-stone surfaces." },
  { slug: "kitchen-remodel", title: "Full Kitchen Remodel", icon: "Home", description: "End-to-end kitchen projects coordinated by one accountable team." },
  { slug: "bathroom-vanities", title: "Bathroom Vanities", icon: "Gem", description: "Custom vanities and stone tops sized to any bathroom." },
  { slug: "outdoor-kitchens", title: "Outdoor Kitchens", icon: "Sun", description: "Weather-resistant stone and cabinetry built for the elements." },
  { slug: "old-counter-removal", title: "Old Counter Removal", icon: "Truck", description: "We haul away and responsibly recycle your old countertops." },
  { slug: "workmanship-warranty", title: "Workmanship Warranty", icon: "ShieldCheck", description: "Every install is backed by our written workmanship warranty." },
];

const TESTIMONIALS = [
  { quote: "From the showroom to install day, every step was on time and on budget. Our quartz island is the centerpiece of the house.", name: "Dana & Marcus T.", detail: "Kitchen remodel, Riverton" },
  { quote: "They templated on Monday and installed the following week. The seam on our granite is genuinely invisible.", name: "Priya S.", detail: "Countertop replacement" },
  { quote: "Custom maple cabinets that fit our awkward galley kitchen perfectly. Craftsmanship you just don't see anymore.", name: "The Olsen Family", detail: "Full cabinetry build" },
  { quote: "The designer talked me out of a more expensive stone that wasn't right for us. Honest people.", name: "Robert M.", detail: "Granite counters" },
  { quote: "Our Calacatta quartz looks like a million dollars and wipes clean in seconds. Zero regrets.", name: "Helen & Greg P.", detail: "Quartz island" },
  { quote: "Install crew was tidy, polite, and reconnected the plumbing without a hitch.", name: "Tanya R.", detail: "Kitchen remodel" },
  { quote: "We compared four shops. Heritage was the only one that fabricates in-house, and it showed in the quality.", name: "Jorge L.", detail: "Quartz counters" },
  { quote: "The refacing transformed our 90s kitchen for a fraction of a full remodel.", name: "Susan D.", detail: "Cabinet refacing" },
  { quote: "Bookmatched marble on our island stops every guest in their tracks.", name: "The Whitfields", detail: "Marble island" },
  { quote: "Quoted price was the final price. No surprises, no upcharges.", name: "Aaron K.", detail: "Countertop replacement" },
  { quote: "They squeezed our project in before the holidays and still nailed the details.", name: "Megan F.", detail: "Full kitchen remodel" },
  { quote: "Soapstone counters were exactly the farmhouse look we wanted. Beautiful work.", name: "Carl & June B.", detail: "Soapstone kitchen" },
  { quote: "Our outdoor kitchen has survived two winters with zero issues.", name: "Diego S.", detail: "Outdoor kitchen" },
  { quote: "The rift oak cabinets are a work of art. Friends keep asking who built them.", name: "Nadia H.", detail: "Custom cabinetry" },
  { quote: "Responsive from the first call to the final walkthrough. Highly recommend.", name: "Patrick O.", detail: "Bathroom vanity" },
  { quote: "Best contractor experience we've had, period. We'll use them again for the basement.", name: "The Castellanos", detail: "Kitchen + bath" },
];

const TEAM = [
  { name: "Frank Delgado", role: "Founder & Master Fabricator", initials: "FD", bio: "Started Heritage in 1998 and still runs the saw on complex jobs." },
  { name: "Maria Delgado", role: "Co-Owner & Operations", initials: "MD", bio: "Keeps every project on schedule and every promise kept." },
  { name: "Sam Whitfield", role: "Lead Designer", initials: "SW", bio: "Turns inspiration photos into buildable, budget-aware plans." },
  { name: "Aisha Okafor", role: "Kitchen Designer", initials: "AO", bio: "Specializes in small-space layouts and clever storage." },
  { name: "Tom Becker", role: "Shop Foreman", initials: "TB", bio: "Runs the fabrication floor and quality control." },
  { name: "Luis Romero", role: "Senior Fabricator", initials: "LR", bio: "Twenty years of flawless seams and edge work." },
  { name: "Grace Lin", role: "Stone Specialist", initials: "GL", bio: "Sources and matches slabs from quarries worldwide." },
  { name: "Derek Hughes", role: "Cabinet Maker", initials: "DH", bio: "Builds every box, door, and dovetail drawer by hand." },
  { name: "Nina Patel", role: "Cabinet Finisher", initials: "NP", bio: "Hand-sprays painted finishes in our dust-free booth." },
  { name: "Carlos Mendez", role: "Install Lead", initials: "CM", bio: "Leads the crew that brings it all together on install day." },
  { name: "Brian Foster", role: "Installer", initials: "BF", bio: "Precision plumbing reconnects and seamless fits." },
  { name: "Kayla Brooks", role: "Project Coordinator", initials: "KB", bio: "Your single point of contact from quote to completion." },
  { name: "Owen Nakamura", role: "Templating Tech", initials: "ON", bio: "Runs the laser templater for millimeter-perfect measures." },
  { name: "Rosa Jimenez", role: "Showroom Manager", initials: "RJ", bio: "Helps you fall in love with the right slab." },
  { name: "Eli Carter", role: "Estimator", initials: "EC", bio: "Builds the honest, line-item quotes we're known for." },
];

const FAQS = [
  { question: "Do you fabricate in-house?", answer: "Yes. We template, cut, and finish every countertop and build every cabinet in our own shop — no subcontractors." },
  { question: "How long does a typical kitchen take?", answer: "Most kitchens are templated and installed within two weeks of slab selection." },
  { question: "Is the estimate really free?", answer: "Always. We come measure, talk through options, and provide a detailed written quote at no cost or obligation." },
  { question: "Do you offer a warranty?", answer: "Every installation is backed by our written workmanship warranty, in addition to manufacturer warranties on quartz." },
  { question: "Granite vs. quartz — which should I choose?", answer: "Granite is natural and heat-resistant; quartz is non-porous and maintenance-free. We'll help you weigh both for your kitchen." },
  { question: "Does quartz need to be sealed?", answer: "No. Engineered quartz is non-porous and never needs sealing. Natural stone is sealed by us on install." },
  { question: "Can you match an existing countertop?", answer: "Often yes — bring a photo or sample and our stone specialist will hunt down the closest slab." },
  { question: "Do you remove my old countertops?", answer: "Yes, removal and responsible recycling of your old tops is included in most installs." },
  { question: "Can I see the actual slab before you cut it?", answer: "Absolutely. You can reserve the exact slab you love right in our showroom yard." },
  { question: "Do you do bathrooms and outdoor kitchens too?", answer: "Yes — vanities, bar tops, fireplace surrounds, and weather-tough outdoor kitchens." },
  { question: "What does cabinet refacing involve?", answer: "We keep your existing cabinet boxes and replace the doors, drawer fronts, and visible veneers for a fresh look." },
  { question: "How do I care for natural stone?", answer: "Wipe with mild soap and water, avoid harsh acids, and let us reseal it every few years." },
  { question: "Do you offer financing?", answer: "We partner with a home-improvement lender and can walk you through options during your consultation." },
  { question: "What areas do you serve?", answer: "Riverton and surrounding communities within roughly a 50-mile radius of our showroom." },
  { question: "How do I get started?", answer: "Request a free estimate through our contact page or call the showroom — we'll schedule your in-home measure within a day or two." },
];

const PROJECT_TYPES = ["Kitchen countertops", "Bathroom vanity", "Custom cabinetry", "Cabinet refacing", "Full kitchen remodel"];
const MATERIAL_INTERESTS = ["Granite", "Quartz", "Marble", "Wood cabinetry", "Not sure yet"];
const STATUSES = ["new", "contacted", "scheduled", "won", "lost"];
const LEAD_NAMES = ["Avery Collins", "Ben Tanaka", "Chloe Reyes", "Dmitri Volkov", "Elena Marsh", "Felix Ward", "Gina Russo", "Harold Pine", "Imani Clarke", "Jonah Webb", "Keira Adams", "Liam Doyle", "Maya Singh", "Noah Bennett", "Olivia Frost", "Pedro Alvarez", "Quinn Harper"];

async function main() {
  console.log("🌱 Seeding Heritage Cabinet & Stone database...");

  // Clear existing data (idempotent re-seed)
  await prisma.$transaction([
    prisma.user.deleteMany(),
    prisma.consultation.deleteMany(),
    prisma.quoteRequest.deleteMany(),
    prisma.faq.deleteMany(),
    prisma.teamMember.deleteMany(),
    prisma.testimonial.deleteMany(),
    prisma.service.deleteMany(),
    prisma.project.deleteMany(),
    prisma.material.deleteMany(),
  ]);

  // Slab stock data for the cut optimizer (stone slabs only; cabinetry = sheet goods, left null).
  const SLAB_COST: Record<string, number> = { "$": 500, "$$": 900, "$$$": 1400 };
  const slabSize = (category: string) =>
    category === "Marble" ? { w: 118, h: 55 } : category === "Cabinetry" ? null : { w: 126, h: 63 };
  await prisma.material.createMany({
    data: MATERIALS.map((m, i) => {
      const size = slabSize(m.category);
      return {
        ...m,
        order: i,
        slabWidth: size?.w ?? null,
        slabHeight: size?.h ?? null,
        slabCost: size ? SLAB_COST[m.priceTier] ?? 900 : null,
      };
    }),
  });
  console.log(`  ✓ ${MATERIALS.length} materials`);

  await prisma.project.createMany({
    data: PROJECTS.map((p, i) => ({ ...p, order: i })),
  });
  console.log(`  ✓ ${PROJECTS.length} gallery projects`);

  await prisma.service.createMany({
    data: SERVICES.map((s, i) => ({ ...s, order: i })),
  });
  console.log(`  ✓ ${SERVICES.length} services`);

  await prisma.testimonial.createMany({
    data: TESTIMONIALS.map((t, i) => ({ ...t, rating: 5, order: i })),
  });
  console.log(`  ✓ ${TESTIMONIALS.length} testimonials`);

  await prisma.teamMember.createMany({
    data: TEAM.map((t, i) => ({ ...t, order: i })),
  });
  console.log(`  ✓ ${TEAM.length} team members`);

  await prisma.faq.createMany({
    data: FAQS.map((f, i) => ({ ...f, order: i })),
  });
  console.log(`  ✓ ${FAQS.length} FAQs`);

  // Sample leads spread over the last ~3 months
  const now = Date.now();
  await prisma.quoteRequest.createMany({
    data: LEAD_NAMES.map((name, i) => {
      const first = name.split(" ")[0].toLowerCase();
      return {
        name,
        email: `${first}@example.com`,
        phone: `(555) ${String(200 + i).padStart(3, "0")}-${String(1000 + i * 7).slice(0, 4)}`,
        projectType: PROJECT_TYPES[i % PROJECT_TYPES.length],
        material: MATERIAL_INTERESTS[i % MATERIAL_INTERESTS.length],
        zip: `${48000 + i}`,
        message: "Interested in an estimate — please reach out to schedule a measure.",
        status: STATUSES[i % STATUSES.length],
        createdAt: new Date(now - i * 5 * 24 * 60 * 60 * 1000),
      };
    }),
  });
  console.log(`  ✓ ${LEAD_NAMES.length} sample quote requests`);

  // Sample consultations spread across upcoming weekdays
  const TIMES = ["09:00", "10:30", "13:00", "14:30", "16:00"];
  const CONSULT_STATUSES = ["requested", "confirmed", "completed", "cancelled"];
  await prisma.consultation.createMany({
    data: LEAD_NAMES.map((name, i) => {
      const first = name.split(" ")[0].toLowerCase();
      const date = new Date(now + (i + 1) * 2 * 24 * 60 * 60 * 1000);
      date.setHours(0, 0, 0, 0);
      return {
        name,
        email: `${first}@example.com`,
        phone: `(555) ${String(300 + i).padStart(3, "0")}-${String(2000 + i * 9).slice(0, 4)}`,
        date,
        time: TIMES[i % TIMES.length],
        projectType: PROJECT_TYPES[i % PROJECT_TYPES.length],
        material: MATERIAL_INTERESTS[i % MATERIAL_INTERESTS.length],
        address: `${100 + i} Birch Lane, Riverton`,
        notes: "Booked via seed data.",
        status: CONSULT_STATUSES[i % CONSULT_STATUSES.length],
      };
    }),
  });
  console.log(`  ✓ ${LEAD_NAMES.length} sample consultations`);

  // --- Login accounts -----------------------------------------------------
  const adminHash = await bcrypt.hash("admin123", 10);
  const customerHash = await bcrypt.hash("customer123", 10);

  const users: { email: string; password: string; name: string; role: string }[] = [
    { email: "admin@heritage.com", password: adminHash, name: "Frank Delgado", role: "admin" },
    // Demo customers whose emails match seeded estimates/consultations, so the
    // customer portal shows real data on first login.
    { email: "avery@example.com", password: customerHash, name: "Avery Collins", role: "customer" },
    { email: "ben@example.com", password: customerHash, name: "Ben Tanaka", role: "customer" },
    { email: "chloe@example.com", password: customerHash, name: "Chloe Reyes", role: "customer" },
  ];
  await prisma.user.createMany({ data: users });
  console.log(`  ✓ ${users.length} login accounts (1 admin, ${users.length - 1} customers)`);

  // Singleton site settings
  await prisma.setting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "Heritage Cabinet & Stone",
      phone: "(555) 482-7100",
      email: "hello@heritagecabinetstone.com",
      address: "1840 Millwright Ave, Suite 5, Riverton",
      hours: ["Mon–Fri · 8am–6pm", "Saturday · 9am–2pm", "Sunday · Closed"],
    },
  });
  console.log("  ✓ site settings");

  console.log("✅ Seed complete.");
  console.log("");
  console.log("   Admin login:    admin@heritage.com / admin123");
  console.log("   Customer login: avery@example.com / customer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
