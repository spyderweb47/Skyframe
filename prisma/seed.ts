import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌍 Seeding SkyFrame database...");

    // Create a system user for seeded events
    const hashedPassword = await bcrypt.hash("skyframe2026", 12);
    const systemUser = await prisma.user.upsert({
        where: { email: "historian@skyframe.app" },
        update: {},
        create: {
            email: "historian@skyframe.app",
            name: "SkyFrame Historian",
            password: hashedPassword,
        },
    });

    const events = [
        // Ancient World
        {
            title: "Construction of the Great Pyramid of Giza",
            description:
                "The Great Pyramid of Giza was built as a tomb for Pharaoh Khufu. It is the oldest and largest of the three pyramids in the Giza pyramid complex and was the tallest man-made structure for over 3,800 years.",
            year: -2560,
            latitude: 29.9792,
            longitude: 31.1342,
            source: "Ancient Egyptian Records",
        },
        {
            title: "Founding of Rome",
            description:
                "According to tradition, Rome was founded by Romulus and Remus on April 21, 753 BC. This legendary founding marks the beginning of one of the most influential civilizations in human history.",
            year: -753,
            latitude: 41.9028,
            longitude: 12.4964,
            source: "Roman Mythology / Livy",
        },
        {
            title: "Battle of Thermopylae",
            description:
                "King Leonidas I of Sparta and 300 Spartans, along with several thousand other Greek soldiers, made a legendary last stand against the massive Persian army of Xerxes I at the narrow coastal pass of Thermopylae.",
            year: -480,
            latitude: 38.7956,
            longitude: 22.5367,
            source: "Herodotus, Histories",
        },
        {
            title: "Alexander the Great conquers Persia",
            description:
                "Alexander III of Macedon defeated Darius III at the Battle of Gaugamela, effectively ending the Achaemenid Empire and establishing one of the largest empires in ancient history.",
            year: -331,
            latitude: 36.3667,
            longitude: 43.2500,
            source: "Plutarch, Arrian",
        },
        {
            title: "Construction of the Great Wall of China begins",
            description:
                "Emperor Qin Shi Huang ordered the connection and extension of existing walls to protect against northern invasions. This marked the beginning of what would become one of the most impressive architectural feats in history.",
            year: -221,
            latitude: 40.4319,
            longitude: 116.5704,
            source: "Records of the Grand Historian",
        },
        {
            title: "Birth of Jesus Christ",
            description:
                "According to Christian tradition, Jesus of Nazareth was born in Bethlehem. His life and teachings would go on to form the foundation of Christianity, the world's largest religion.",
            year: -4,
            latitude: 31.7054,
            longitude: 35.2024,
            source: "Biblical Accounts",
        },
        {
            title: "Eruption of Mount Vesuvius destroys Pompeii",
            description:
                "Mount Vesuvius erupted catastrophically, burying the Roman cities of Pompeii and Herculaneum under volcanic ash and pumice. The preserved ruins provide an extraordinary snapshot of Roman life.",
            year: 79,
            latitude: 40.7488,
            longitude: 14.4847,
            source: "Pliny the Younger",
        },
        {
            title: "Fall of the Western Roman Empire",
            description:
                "The last Western Roman Emperor, Romulus Augustulus, was deposed by the Germanic chieftain Odoacer, marking the traditional end of the Western Roman Empire and the beginning of the Middle Ages in Europe.",
            year: 476,
            latitude: 41.8967,
            longitude: 12.4822,
            source: "Historical Records",
        },
        // Medieval Period
        {
            title: "Prophet Muhammad's Hijra to Medina",
            description:
                "The migration of Prophet Muhammad and his followers from Mecca to Medina marks the beginning of the Islamic calendar and a pivotal moment in the establishment of Islam as a major world religion.",
            year: 622,
            latitude: 24.4672,
            longitude: 39.6112,
            source: "Islamic Historical Records",
        },
        {
            title: "Viking Discovery of North America",
            description:
                "Leif Erikson and Norse explorers reached the coast of North America, establishing a brief settlement at L'Anse aux Meadows in Newfoundland, approximately 500 years before Christopher Columbus.",
            year: 1000,
            latitude: 51.5963,
            longitude: -55.5339,
            source: "Vinland Sagas",
        },
        {
            title: "Signing of the Magna Carta",
            description:
                "King John of England was forced to sign the Magna Carta at Runnymede, establishing the principle that the king was subject to the law. This document influenced the development of constitutional law worldwide.",
            year: 1215,
            latitude: 51.4430,
            longitude: -0.5610,
            source: "British Historical Records",
        },
        {
            title: "Genghis Khan establishes the Mongol Empire",
            description:
                "Temüjin united the Mongol tribes and was proclaimed Genghis Khan, going on to create the largest contiguous land empire in history, stretching from Eastern Europe to the Sea of Japan.",
            year: 1206,
            latitude: 47.9220,
            longitude: 106.9065,
            source: "Secret History of the Mongols",
        },
        {
            title: "The Black Death reaches Europe",
            description:
                "The bubonic plague, carried by fleas on rats aboard Genoese trading ships, arrived in Sicily from Central Asia. It would go on to kill approximately one-third of Europe's population over the next five years.",
            year: 1347,
            latitude: 37.5079,
            longitude: 15.0830,
            source: "Giovanni Boccaccio, Decameron",
        },
        {
            title: "Fall of Constantinople",
            description:
                "Sultan Mehmed II of the Ottoman Empire captured Constantinople, ending the Byzantine Empire after 1,100 years. The city was renamed Istanbul and became the new Ottoman capital.",
            year: 1453,
            latitude: 41.0082,
            longitude: 28.9784,
            source: "Ottoman & Byzantine Records",
        },
        // Age of Exploration
        {
            title: "Columbus reaches the Americas",
            description:
                "Christopher Columbus, sailing under the Spanish flag, made landfall in the Bahamas, initiating sustained European contact with the Americas and changing the course of world history.",
            year: 1492,
            latitude: 24.0500,
            longitude: -74.5333,
            source: "Columbus's Journal",
        },
        {
            title: "Leonardo da Vinci paints the Mona Lisa",
            description:
                "Leonardo da Vinci began painting what would become the most famous portrait in the world. The Mona Lisa exemplifies Renaissance artistry and continues to captivate millions of visitors at the Louvre.",
            year: 1503,
            latitude: 43.7696,
            longitude: 11.2558,
            source: "Giorgio Vasari",
        },
        {
            title: "Magellan's expedition circumnavigates the globe",
            description:
                "Ferdinand Magellan led the first expedition to sail around the world, proving that the Earth was round and that the oceans were all connected. Magellan himself was killed in the Philippines.",
            year: 1522,
            latitude: -33.8688,
            longitude: -71.5944,
            source: "Antonio Pigafetta",
        },
        // Early Modern Period
        {
            title: "Shakespeare writes Hamlet",
            description:
                "William Shakespeare wrote 'The Tragedy of Hamlet, Prince of Denmark,' widely regarded as one of the greatest works of literature ever written. Its exploration of revenge, mortality, and madness remains profoundly influential.",
            year: 1600,
            latitude: 51.5074,
            longitude: -0.1278,
            source: "First Folio, 1623",
        },
        {
            title: "Galileo observes Jupiter's moons",
            description:
                "Using an improved telescope, Galileo Galilei discovered four large moons orbiting Jupiter, providing crucial evidence for the Copernican heliocentric model and revolutionizing our understanding of the cosmos.",
            year: 1610,
            latitude: 43.7228,
            longitude: 10.4017,
            source: "Sidereus Nuncius",
        },
        {
            title: "American Declaration of Independence",
            description:
                "The Continental Congress adopted the Declaration of Independence, drafted primarily by Thomas Jefferson, declaring the thirteen American colonies free from British rule and establishing fundamental principles of democracy.",
            year: 1776,
            latitude: 39.9489,
            longitude: -75.1500,
            source: "National Archives",
        },
        {
            title: "French Revolution begins - Storming of the Bastille",
            description:
                "Parisian revolutionaries stormed the Bastille fortress-prison, a symbol of royal authority. This event marked the beginning of the French Revolution, which would fundamentally transform French society and influence political movements worldwide.",
            year: 1789,
            latitude: 48.8532,
            longitude: 2.3692,
            source: "French Historical Records",
        },
        // 19th Century
        {
            title: "Battle of Waterloo",
            description:
                "Napoleon Bonaparte was decisively defeated by a coalition force led by the Duke of Wellington and Gebhard von Blücher near Waterloo in present-day Belgium, ending the Napoleonic Wars and reshaping European politics.",
            year: 1815,
            latitude: 50.7143,
            longitude: 4.4044,
            source: "Military Historical Records",
        },
        {
            title: "Darwin publishes On the Origin of Species",
            description:
                "Charles Darwin published his groundbreaking work introducing the scientific theory of evolution by natural selection, fundamentally changing our understanding of biology and the diversity of life on Earth.",
            year: 1859,
            latitude: 51.3580,
            longitude: 0.0515,
            source: "On the Origin of Species, 1859",
        },
        {
            title: "Opening of the Suez Canal",
            description:
                "The Suez Canal was opened, connecting the Mediterranean Sea to the Red Sea. This 193km waterway dramatically reduced shipping distances between Europe and Asia, reshaping global trade routes.",
            year: 1869,
            latitude: 30.5852,
            longitude: 32.2654,
            source: "Suez Canal Authority Records",
        },
        // 20th Century
        {
            title: "Wright Brothers' First Powered Flight",
            description:
                "Orville and Wilbur Wright achieved the first sustained, controlled, powered heavier-than-air flight at Kill Devil Hills, near Kitty Hawk, North Carolina. The first flight lasted 12 seconds and covered 36 meters.",
            year: 1903,
            latitude: 36.0145,
            longitude: -75.6680,
            source: "Smithsonian Institution",
        },
        {
            title: "Sinking of the RMS Titanic",
            description:
                "The RMS Titanic, the largest ship afloat at the time, struck an iceberg during her maiden voyage from Southampton to New York City and sank, resulting in the deaths of more than 1,500 passengers and crew.",
            year: 1912,
            latitude: 41.7260,
            longitude: -49.9469,
            source: "British Inquiry Report",
        },
        {
            title: "D-Day - Allied Invasion of Normandy",
            description:
                "The Allied forces launched the largest amphibious invasion in history on the beaches of Normandy, France. This pivotal World War II operation began the liberation of Western Europe from Nazi occupation.",
            year: 1944,
            latitude: 49.3694,
            longitude: -0.8731,
            source: "Allied Military Records",
        },
        {
            title: "Atomic bombing of Hiroshima",
            description:
                "The United States dropped an atomic bomb nicknamed 'Little Boy' on the Japanese city of Hiroshima, in the first use of nuclear weapons in warfare. The explosion killed approximately 80,000 people instantly.",
            year: 1945,
            latitude: 34.3853,
            longitude: 132.4553,
            source: "US Military / Japanese Records",
        },
        {
            title: "Apollo 11 Moon Landing",
            description:
                "NASA astronaut Neil Armstrong became the first human to walk on the Moon, followed by Buzz Aldrin. Armstrong's famous words 'That's one small step for man, one giant leap for mankind' were heard around the world.",
            year: 1969,
            latitude: 28.5729,
            longitude: -80.6490,
            source: "NASA Records",
        },
        {
            title: "Fall of the Berlin Wall",
            description:
                "The Berlin Wall, which had divided East and West Berlin since 1961, was opened by the East German government. This event symbolized the end of the Cold War and led to German reunification the following year.",
            year: 1989,
            latitude: 52.5163,
            longitude: 13.3777,
            source: "German Historical Records",
        },
        {
            title: "Nelson Mandela elected President of South Africa",
            description:
                "Nelson Mandela, after spending 27 years in prison for opposing apartheid, was elected as the first Black president of South Africa in the country's first fully democratic election, marking the end of apartheid.",
            year: 1994,
            latitude: -25.7461,
            longitude: 28.1881,
            source: "South African Electoral Commission",
        },
    ];

    for (const event of events) {
        await prisma.event.create({
            data: {
                ...event,
                visibility: "public",
                userId: systemUser.id,
            },
        });
    }

    console.log(`✅ Seeded ${events.length} historical events`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
