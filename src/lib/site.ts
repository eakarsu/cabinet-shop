// Central content for the Heritage Cabinet & Stone marketing site.

export const COMPANY = {
  name: "Heritage Cabinet & Stone",
  short: "Heritage",
  tagline: "Custom Cabinetry & Natural Stone Countertops",
  phone: "(555) 482-7100",
  phoneHref: "tel:+15554827100",
  email: "hello@heritagecabinetstone.com",
  address: "1840 Millwright Ave, Suite 5, Riverton",
  established: 1998,
  hours: [
    "Mon–Fri · 8am–6pm",
    "Saturday · 9am–2pm",
    "Sunday · Closed",
  ],
};

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Materials",
    href: "/materials",
    children: [
      { label: "All Materials", href: "/materials" },
      { label: "Granite", href: "/materials?category=Granite" },
      { label: "Quartz", href: "/materials?category=Quartz" },
      { label: "Marble", href: "/materials?category=Marble" },
      { label: "Cabinetry", href: "/materials?category=Cabinetry" },
    ],
  },
  { label: "Gallery", href: "/gallery" },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "Our Story", href: "/about" },
      { label: "Team", href: "/about#team" },
      { label: "FAQ", href: "/about#faq" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

export type Material = {
  slug: string;
  name: string;
  kind: string;
  blurb: string;
  features: string[];
  swatch: string; // tailwind gradient placeholder for a slab photo
};

export const MATERIALS: Material[] = [
  {
    slug: "granite",
    name: "Granite",
    kind: "Natural Stone",
    blurb:
      "Hard-wearing igneous stone with one-of-a-kind movement. Heat, scratch, and stain resistant when sealed — built for kitchens that get used.",
    features: ["Heat resistant", "200+ slabs in stock", "Sealed for life"],
    swatch: "from-stone-700 via-stone-500 to-stone-900",
  },
  {
    slug: "quartz",
    name: "Quartz",
    kind: "Engineered",
    blurb:
      "Non-porous, low-maintenance surfaces in consistent colors and patterns. No sealing required, with industry-leading warranties.",
    features: ["Non-porous", "No sealing", "15-year warranty"],
    swatch: "from-zinc-200 via-white to-zinc-400",
  },
  {
    slug: "marble",
    name: "Marble",
    kind: "Natural Stone",
    blurb:
      "Timeless veined elegance for islands, baths, and feature pieces. Honed or polished finishes tailored to your design, with bookmatched options.",
    features: ["Honed or polished", "Bookmatched slabs", "Timeless veining"],
    swatch: "from-slate-100 via-white to-slate-300",
  },
  {
    slug: "cabinetry",
    name: "Custom Cabinetry",
    kind: "Built in-house",
    blurb:
      "Shop-built cabinets in maple, oak, and painted finishes. Soft-close hardware and dovetail drawers as standard, sized to your room down to the inch.",
    features: ["Solid wood boxes", "Soft-close hardware", "Made to measure"],
    swatch: "from-amber-800 via-amber-600 to-amber-950",
  },
];

export const SERVICES = [
  {
    icon: "DraftingCompass",
    title: "Design Consultation",
    text: "Plan layout, material, and finish with a designer. Bring photos — we bring the slabs.",
  },
  {
    icon: "Ruler",
    title: "Templating & Fabrication",
    text: "Laser templating for a precise fit, then CNC fabrication in our own shop.",
  },
  {
    icon: "Hammer",
    title: "Professional Install",
    text: "In-house crews handle removal, reconnect, and a flawless install — often in a day.",
  },
  {
    icon: "Paintbrush",
    title: "Cabinet Refacing",
    text: "Keep your layout, transform the look — new doors, fronts, and veneers.",
  },
] as const;

export const STEPS = [
  { n: "01", title: "Free in-home measure", text: "We visit, measure, and talk ideas and budget — no obligation." },
  { n: "02", title: "Pick your material", text: "Browse full slabs in our showroom and reserve the exact piece." },
  { n: "03", title: "We fabricate", text: "Stone and cabinets cut and built to spec in our local shop." },
  { n: "04", title: "Install day", text: "Most kitchens are templated and installed within two weeks." },
];

export const STATS = [
  { value: "25+", label: "Years in business" },
  { value: "6,000+", label: "Kitchens completed" },
  { value: "200+", label: "Slabs in stock" },
  { value: "4.9★", label: "Average review" },
];

export const TESTIMONIALS = [
  {
    quote:
      "From the showroom to install day, every step was on time and on budget. Our quartz island is the centerpiece of the house.",
    name: "Dana & Marcus T.",
    detail: "Kitchen remodel, Riverton",
  },
  {
    quote:
      "They templated on Monday and installed the following week. The seam on our granite is genuinely invisible.",
    name: "Priya S.",
    detail: "Countertop replacement",
  },
  {
    quote:
      "Custom maple cabinets that fit our awkward galley kitchen perfectly. Craftsmanship you just don't see anymore.",
    name: "The Olsen Family",
    detail: "Full cabinetry build",
  },
];

export type GalleryItem = { title: string; tag: string; grad: string };

export const GALLERY: GalleryItem[] = [
  { title: "Calacatta Quartz Island", tag: "Quartz", grad: "from-slate-200 to-zinc-400" },
  { title: "Black Pearl Granite Kitchen", tag: "Granite", grad: "from-stone-800 to-stone-600" },
  { title: "Shaker Maple Cabinetry", tag: "Cabinetry", grad: "from-amber-700 to-amber-900" },
  { title: "Carrara Marble Bath", tag: "Marble", grad: "from-slate-100 to-slate-300" },
  { title: "Waterfall Edge Peninsula", tag: "Quartz", grad: "from-zinc-200 to-zinc-500" },
  { title: "Two-Tone Painted Kitchen", tag: "Cabinetry", grad: "from-emerald-800 to-stone-700" },
  { title: "Leathered Granite Bar", tag: "Granite", grad: "from-neutral-700 to-neutral-900" },
  { title: "Honed Marble Vanity", tag: "Marble", grad: "from-stone-200 to-slate-300" },
];

export const GALLERY_TAGS = ["All", "Granite", "Quartz", "Marble", "Cabinetry"];

// Category tiles for the landing page (classicgranite-style product grid).
export const CATEGORY_TILES = [
  { name: "Granite", tagline: "Sophisticated & Timeless", grad: "from-stone-800 to-stone-600", href: "/materials" },
  { name: "Quartz", tagline: "Modern & Versatile", grad: "from-zinc-300 to-zinc-500", href: "/materials" },
  { name: "Marble", tagline: "Prestige & Luxury", grad: "from-slate-200 to-slate-400", href: "/materials" },
  { name: "Cabinetry", tagline: "Crafted & Custom", grad: "from-amber-700 to-amber-900", href: "/materials" },
  { name: "Soapstone", tagline: "Tactile & Enduring", grad: "from-slate-700 to-neutral-900", href: "/materials" },
  { name: "Turnkey Remodel", tagline: "Design to Install", grad: "from-emerald-900 to-stone-700", href: "/contact" },
];

// Communities served, shown near the footer of the landing page.
export const SERVICE_AREAS = [
  "Riverton", "Old Town", "Lakeshore", "Maple Grove", "Brookside",
  "Hillcrest", "Highland Park", "Midtown", "Bayview", "The Mill District",
  "County Line", "Riverton Heights", "Northgate", "Stonebridge",
];
