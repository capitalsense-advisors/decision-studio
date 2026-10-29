export type SmallcaseHolding = {
  name: string;
  symbol: string;
  weight: number;
  role: string;
  price?: number;
  shares?: number;
};

export type SmallcaseTheme = {
  id: string;
  label: string;
  weight: number;
  title: string;
  narrative: string;
  takeaway: string;
  holdings: SmallcaseHolding[];
};

export type SmallcaseStrategy = {
  id: string;
  name: string;
  shortName: string;
  smallcaseUrl: string;
  tagline: string;
  question: string;
  style: string;
  lens: string;
  opener: string;
  themes: SmallcaseTheme[];
  cash?: number;
  snapshot?: {
    basketAmount: number;
    periodLabel: string;
    periodReturn: number;
    weighting: string;
    suppliedAt: string;
  };
};

const holding = (
  name: string,
  symbol: string,
  weight: number,
  role: string,
  price?: number,
  shares?: number,
): SmallcaseHolding => ({ name, symbol, weight, role, price, shares });

export const smallcaseStrategies: SmallcaseStrategy[] = [
  {
    id: "india-emergent-industries",
    name: "India Emergent Industries",
    shortName: "Emergent Industries",
    smallcaseUrl: "https://smlc.se/ScIYx",
    tagline: "The next layer of India’s growth.",
    question: "What is India building next?",
    style: "Structural growth",
    lens: "Emerging industrial capability",
    opener: "India’s next decade needs more electricity, manufacturing, aircraft, solar capacity and electronics. This strategy looks behind the headline projects to the specialist companies supplying the equipment, engineering and production capability that make those projects possible.",
    themes: [
      {
        id: "power",
        label: "Power infrastructure",
        weight: 42,
        title: "The AI boom needs more than servers. It needs power.",
        narrative: "Data centres, factories and renewable capacity all depend on generation, transmission, transformers and dependable distributed power. The opportunity extends beyond the operator to the industrial chain around it.",
        takeaway: "You do not have to own the data centre to own the growth around it.",
        holdings: [
          holding("Transformers & Rectifiers India", "TARIL", 14, "Power transmission equipment"),
          holding("Anant Raj", "ANANTRAJ", 10, "Digital and physical infrastructure"),
          holding("Cummins India", "CUMMINSIND", 10, "Power systems and energy reliability"),
          holding("Techno Electric & Engineering", "TECHNOE", 8, "Transmission, smart metering and data centres"),
        ],
      },
      {
        id: "aerospace",
        label: "Aerospace & precision",
        weight: 26,
        title: "The aircraft of tomorrow needs an industrial supply chain today.",
        narrative: "Aerospace suppliers need engineering depth, certification and years of demonstrated reliability. Those long qualification cycles can become a barrier to entry when programmes begin to scale.",
        takeaway: "The opportunity is moving from assembling products to mastering the parts inside them.",
        holdings: [
          holding("Dynamatic Technologies", "DYNAMATECH", 11, "Aerospace structures and precision engineering"),
          holding("Azad Engineering", "AZAD", 10, "High-precision aerospace manufacturing"),
          holding("Belrise Industries", "BELRISE", 5, "Precision components and content per vehicle"),
        ],
      },
      {
        id: "solar",
        label: "Solar manufacturing",
        weight: 19,
        title: "India is not only installing solar. It is building the supply chain.",
        narrative: "The next phase is increasingly about domestic cells, modules and deeper vertical integration, not only adding generation capacity.",
        takeaway: "The next solar opportunity may sit in the factory behind the solar farm.",
        holdings: [
          holding("Emmvee Photovoltaic Power", "EMMVEE", 11, "Integrated solar manufacturing"),
          holding("Premier Energies", "PREMIERENE", 8, "Solar cells, modules and vertical integration"),
        ],
      },
      {
        id: "electronics",
        label: "Electronics",
        weight: 13,
        title: "The value is moving deeper into the electronics supply chain.",
        narrative: "India’s electronics opportunity is widening from assembly into complex manufacturing, components and semiconductor packaging capability.",
        takeaway: "Capability, not only capacity, is the scarce asset.",
        holdings: [holding("Kaynes Technology", "KAYNES", 13, "Complex electronics and semiconductor ecosystem")],
      },
    ],
  },
  {
    id: "india-execution-engine",
    name: "India Execution Engine",
    shortName: "Execution Engine",
    smallcaseUrl: "https://smlc.se/xBASN",
    tagline: "Build it. Power it. Defend it. Bank it.",
    question: "Who is actually delivering it?",
    style: "Execution",
    lens: "Order books and industrial delivery",
    opener: "This strategy moves one step closer to execution. It asks who receives the orders, manufactures the equipment, builds the infrastructure, supplies defence systems and benefits when India’s capital-investment cycle becomes delivered revenue.",
    cash: 3,
    themes: [
      {
        id: "defend",
        label: "Defend",
        weight: 27,
        title: "Defence spending matters when it becomes an executed order.",
        narrative: "India’s defence story is moving from import dependence toward domestic design, manufacturing and systems delivery. The portfolio focuses on the companies closest to that execution chain.",
        takeaway: "An approval becomes investable only when it converts into profitable delivery.",
        holdings: [
          holding("Bharat Electronics", "BEL", 16, "Defence electronics and systems"),
          holding("Hindustan Aeronautics", "HAL", 7, "Aerospace and defence platforms"),
          holding("Astra Microwave", "ASTRAMICRO", 4, "Defence electronics and RF systems"),
        ],
      },
      {
        id: "power",
        label: "Power",
        weight: 32,
        title: "Industrial ambition stops where the grid stops.",
        narrative: "Factories, trains, data centres and renewable capacity require transmission networks, power equipment and reliable distributed generation.",
        takeaway: "The industrial cycle cannot outrun the electricity system beneath it.",
        holdings: [
          holding("Cummins India", "CUMMINSIND", 14, "Power systems and distributed generation"),
          holding("Siemens Energy India", "SIEMENSENERGY", 7, "Grid and power equipment"),
          holding("Kalpataru Projects International", "KPIL", 4, "Transmission and infrastructure execution"),
          holding("GE Vernova T&D India", "GVT&D", 4, "High-voltage transmission technology"),
          holding("KEC International", "KEC", 3, "Transmission and infrastructure execution"),
        ],
      },
      {
        id: "build",
        label: "Build",
        weight: 27,
        title: "Move from assembling products to building capability.",
        narrative: "Electronics, defence and industrial equipment need deeper component integration, complex manufacturing and production at scale.",
        takeaway: "Execution quality matters more than a large addressable market.",
        holdings: [
          holding("Kaynes Technology", "KAYNES", 10, "Complex electronics and semiconductor ecosystem"),
          holding("Syrma SGS", "SYRMA", 9, "Specialised electronics manufacturing"),
          holding("Avalon Technologies", "AVALON", 5, "High-complexity electronics manufacturing"),
          holding("Dixon Technologies", "DIXON", 3, "Scale electronics manufacturing"),
        ],
      },
      {
        id: "bank",
        label: "Bank",
        weight: 11,
        title: "Economic expansion creates wealth that needs managing.",
        narrative: "More entrepreneurs, businesses and financial assets expand the pool of households seeking professional wealth management.",
        takeaway: "When an economy creates wealth, an industry grows around managing it.",
        holdings: [holding("360 ONE WAM", "360ONE", 11, "Wealth management")],
      },
    ],
  },
  {
    id: "alphas-of-the-pack",
    name: "Alpha’s of the Pack",
    shortName: "Alpha’s",
    smallcaseUrl: "https://smlc.se/WFt3j",
    tagline: "Thirty ideas. Four engines. One deliberately active pack.",
    question: "Where could tomorrow’s category leaders emerge?",
    style: "Custom weighted",
    lens: "High-conviction challengers with hard-asset ballast",
    opener: "Alpha’s of the Pack is the broadest and most active of the three strategies. It combines industrial bottlenecks, new consumer and technology platforms, financial rails and a measured gold-silver sleeve. Breadth creates more paths to win, but it does not make the portfolio low risk: several holdings are young listings, turnaround stories or high-expectation businesses.",
    snapshot: {
      basketAmount: 507540.89,
      periodLabel: "Past 2M",
      periodReturn: -7.84,
      weighting: "Custom weighted",
      suppliedAt: "User-supplied Smallcase snapshot",
    },
    themes: [
      {
        id: "industrial-backbone",
        label: "Industrial backbone",
        weight: 34,
        title: "Own the bottlenecks, not only the headline project.",
        narrative: "Storage terminals, recycling, fluorochemicals, solar manufacturing, cables, power equipment and precision production sit underneath India’s physical build-out. These holdings carry execution and cycle risk, but they also sit where capacity can become scarce.",
        takeaway: "A boom is often monetised first by the companies supplying its constraints.",
        holdings: [
          holding("Aegis Vopak Terminals Ltd", "AEGISVOPAK", 2.6, "Storage and logistics infrastructure", 236, 57),
          holding("Jain Resource Recycling Ltd", "JAINREC", 3, "Circular materials and recycling", 274, 56),
          holding("Gujarat Fluorochemicals Ltd", "FLUOROCHEM", 3.6, "Specialty materials", 4280, 4),
          holding("Waaree Energies Ltd", "WAAREEENER", 2.5, "Solar manufacturing", 2318, 6),
          holding("Premier Energies Ltd", "PREMIERENE", 2.9, "Solar cells and modules", 865, 17),
          holding("Diamond Power Infrastructure Ltd", "DIACABS", 2.4, "Power cables and conductors", 341, 36),
          holding("Garware Hi-Tech Films Ltd", "GRWRHITECH", 2.6, "Specialty films", 7017, 2),
          holding("PTC Industries Ltd", "PTCIL", 4.8, "Precision metal components", 24700, 1),
          holding("CG Power and Industrial Solutions Ltd", "CGPOWER", 3.1, "Power and industrial equipment", 829, 19),
          holding("Apar Industries Ltd", "APARINDS", 3.9, "Conductors, cables and specialty oils", 15846, 1),
          holding("Aditya Infotech Ltd", "CPPLUS", 2.6, "Security and surveillance systems", 3951, 3),
        ],
      },
      {
        id: "category-creators",
        label: "Category creators",
        weight: 40.7,
        title: "Back the challengers trying to redraw everyday categories.",
        narrative: "Consumer electronics, defence technology, healthcare, electric mobility, digital payments, food delivery, jewellery, eyewear and commerce platforms make this the portfolio’s fastest-moving sleeve. The upside is category creation; the price is higher volatility and a wider range of outcomes.",
        takeaway: "The pack is strongest when adoption becomes durable economics, not only attention.",
        holdings: [
          holding("Amber Enterprises India Ltd", "AMBER", 2.9, "Electronics manufacturing", 6234, 2),
          holding("Zen Technologies Ltd", "ZENTEC", 3.9, "Defence training and anti-drone systems", 1621, 12),
          holding("Manipal Health Enterprises Ltd", "MANIPALHOS", 2.8, "Healthcare delivery", 638, 23),
          holding("Onesource Specialty Pharma Ltd", "ONESOURCE", 2.1, "Specialty pharmaceutical services", 1569, 7),
          holding("Ola Electric Mobility Ltd", "OLAELEC", 2.9, "Electric mobility", 35, 424),
          holding("Ather Energy Ltd", "ATHERENERG", 3.8, "Electric mobility", 1663, 12),
          holding("One 97 Communications Ltd", "PAYTM", 4.6, "Digital payments and financial distribution", 1686, 14),
          holding("Eternal Ltd", "ETERNAL", 5.1, "Consumer internet and commerce", 337, 78),
          holding("Lalithaa Jewellery Mart Ltd", "LALITHAA", 2.1, "Organised jewellery retail", 354, 30),
          holding("Lenskart Solutions Ltd", "LENSKART", 2.9, "Omnichannel eyewear", 681, 22),
          holding("Radico Khaitan Ltd", "RADICO", 2.6, "Premium consumer brands", 4235, 3),
          holding("Prestige Estates Projects Ltd", "PRESTIGE", 2.1, "Urban development", 1439, 8),
          holding("Meesho Ltd", "MEESHO", 2.9, "Digital commerce", 224, 66),
        ],
      },
      {
        id: "financial-rails",
        label: "Financial rails",
        weight: 15.1,
        title: "Growth needs credit, distribution and market access.",
        narrative: "Secured lending, diversified finance and investing infrastructure form the financial layer of the basket. This sleeve can benefit from formalisation while remaining sensitive to credit quality, funding costs and market activity.",
        takeaway: "Financial growth is useful only when underwriting and funding remain disciplined.",
        holdings: [
          holding("Muthoot Finance Ltd", "MUTHOOTFIN", 3.7, "Secured retail lending", 2497, 8),
          holding("Shriram Finance Ltd", "SHRIRAMFIN", 4.6, "Diversified retail and vehicle finance", 841, 28),
          holding("Piramal Finance Ltd", "PIRAMALFIN", 3.2, "Retail and wholesale finance", 1864, 9),
          holding("Billionbrains Garage Ventures Ltd", "GROWW", 3.6, "Digital investing infrastructure", 191, 97),
        ],
      },
      {
        id: "hard-asset-ballast",
        label: "Hard-asset ballast",
        weight: 10.2,
        title: "Keep a counterweight inside an otherwise high-beta pack.",
        narrative: "Gold and silver ETFs add liquid commodity exposure. They may diversify company-specific risk, but they can still fall and should not be described as guaranteed protection.",
        takeaway: "Ballast changes the ride; it does not remove market risk.",
        holdings: [
          holding("Zerodha Silver ETF", "SILVERCASE", 4.89, "Silver exposure", 19, 1322),
          holding("Zerodha Gold ETF", "GOLDCASE", 5.31, "Gold exposure", 22, 1233),
        ],
      },
    ],
  },
];

export function strategyHoldings(strategy: SmallcaseStrategy) {
  return strategy.themes.flatMap((theme) => theme.holdings);
}

export function strategyTotalWeight(strategy: SmallcaseStrategy) {
  return strategy.themes.reduce((total, theme) => total + theme.weight, strategy.cash ?? 0);
}
