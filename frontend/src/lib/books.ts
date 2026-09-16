import cartographersSilence from "@/assets/cartographers-silence.jpg";
import orbitalGardens from "@/assets/orbital-gardens.jpg";
import understory from "@/assets/understory.jpg";
import quietMeridian from "@/assets/quiet-meridian.jpg";
import smallLights from "@/assets/small-lights.jpg";

export type BookStatus = "Want to Read" | "Currently Reading" | "Finished";

export type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  rating: number;
  year: number;
  pages: number;
  description: string;
  reason: string;
  tags: string[];
  cover: string;
  status?: BookStatus;
  progress?: number;
};

export const books: [Book, Book, Book, Book, Book] = [
  {
    id: "cartographers-silence",
    title: "The Cartographer's Silence",
    author: "E. Vane",
    genre: "Mystery",
    rating: 4.7,
    year: 2025,
    pages: 368,
    description: "When a vanished mapmaker leaves behind a coastline that does not exist, archivist Mara Vale follows the ink into a quiet conspiracy spanning three generations.",
    reason: "You enjoy mystery thrillers with atmospheric settings",
    tags: ["Slow burn", "Coastal", "Secrets"],
    cover: cartographersSilence,
    status: "Currently Reading",
    progress: 64,
  },
  {
    id: "orbital-gardens",
    title: "Orbital Gardens",
    author: "T. Adeyemi",
    genre: "Sci-Fi",
    rating: 4.5,
    year: 2024,
    pages: 412,
    description: "On a station built to preserve the last seeds of Earth, a botanist discovers that the garden is growing toward a future no one planned.",
    reason: "Because you liked thoughtful science fiction",
    tags: ["Hopeful", "Found family", "Space"],
    cover: orbitalGardens,
    status: "Want to Read",
  },
  {
    id: "understory",
    title: "Letters from the Understory",
    author: "R. Okafor",
    genre: "Literary",
    rating: 4.9,
    year: 2023,
    pages: 304,
    description: "A luminous novel about the letters we leave behind, the landscapes that hold them, and the small things that survive change.",
    reason: "Matches your love of tender literary fiction",
    tags: ["Nature", "Family", "Lyrical"],
    cover: understory,
    status: "Finished",
    progress: 100,
  },
  {
    id: "quiet-meridian",
    title: "The Quiet Meridian",
    author: "B. Lindqvist",
    genre: "Thriller",
    rating: 4.6,
    year: 2025,
    pages: 352,
    description: "A missing lighthouse keeper, a storm-cut island, and a truth that only appears when the sun is at its lowest.",
    reason: "Because you enjoy precise, slow-burn suspense",
    tags: ["Noir", "Island", "Atmospheric"],
    cover: quietMeridian,
  },
  {
    id: "small-lights",
    title: "A Field of Small Lights",
    author: "N. Bell",
    genre: "Literary",
    rating: 4.8,
    year: 2022,
    pages: 288,
    description: "After returning to her childhood valley, a young woman finds a community held together by stories, wildflowers, and an old shared promise.",
    reason: "Matches your literary reading taste",
    tags: ["Tender", "Rural", "Coming of age"],
    cover: smallLights,
  },
];

export const genres = ["All genres", "Mystery", "Sci-Fi", "Literary", "Thriller", "History", "Poetry"];

export const users = [
  { name: "Maya Chen", email: "maya.chen@example.com", role: "User", books: 214, status: "Active" },
  { name: "Jon Bell", email: "jon.bell@example.com", role: "User", books: 87, status: "Active" },
  { name: "Avery Stone", email: "avery@athenaeum.co", role: "Admin", books: 42, status: "Active" },
  { name: "Nora Williams", email: "nora.w@example.com", role: "User", books: 12, status: "Paused" },
];

export const reviews = [
  { book: "The Cartographer's Silence", user: "Maya Chen", rating: 5, text: "A patient, beautiful mystery with a coastline I could feel.", status: "Approved" },
  { book: "Orbital Gardens", user: "Jon Bell", rating: 4, text: "Thoughtful and hopeful without losing its edge.", status: "Pending" },
  { book: "The Quiet Meridian", user: "Nora Williams", rating: 2, text: "The middle lost some of its tension for me.", status: "Hidden" },
];