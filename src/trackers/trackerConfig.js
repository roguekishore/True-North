import { FaRegSun, FaBed, FaBrain, FaRegFrown, FaMobileAlt, FaSmile, FaBolt, FaClipboardList, FaCommentDots } from "react-icons/fa";

const paletteHighGreen = [
  { value: 10, label: "10", color: "#00FF00" },
  { value: 9, label: "9", color: "#33FF00" },
  { value: 8, label: "8", color: "#66FF00" },
  { value: 7, label: "7", color: "#99FF00" },
  { value: 6, label: "6", color: "#FFFF00" },
  { value: 5, label: "5", color: "#FFCC00" },
  { value: 4, label: "4", color: "#FF9900" },
  { value: 3, label: "3", color: "#FF6600" },
  { value: 2, label: "2", color: "#FF3300" },
  { value: 1, label: "1", color: "#FF0000" },
  { value: 0, label: "0", color: "#CC0000" },
];

const paletteHighRed = [
  { value: 10, label: "10", color: "#CC0000" },
  { value: 9, label: "9", color: "#FF0000" },
  { value: 8, label: "8", color: "#FF3300" },
  { value: 7, label: "7", color: "#FF6600" },
  { value: 6, label: "6", color: "#FF9900" },
  { value: 5, label: "5", color: "#FFCC00" },
  { value: 4, label: "4", color: "#FFFF00" },
  { value: 3, label: "3", color: "#99FF00" },
  { value: 2, label: "2", color: "#66FF00" },
  { value: 1, label: "1", color: "#33FF00" },
  { value: 0, label: "0", color: "#00FF00" },
];


const screenPalette = Array.from({ length: 10 }, (_, index) => {
  const value = index + 1;
  return { value, label: `${value}h`, color: paletteHighGreen[index]?.color || "#CC0000" };
});

export const trackerConfigs = [
  {
    id: "day",
    title: "Day Tracker",
    description: "Rate how your day felt",
    collection: "rateMyDay",
    type: "rating",
    valueKey: "rating",
    palette: paletteHighGreen,
    icon: FaRegSun,
  },
  {
    id: "sleep",
    title: "Sleep Tracker",
    description: "Log nightly sleep quality",
    collection: "sleepTracker",
    type: "rating",
    valueKey: "rating",
    palette: paletteHighGreen,
    icon: FaBed,
  },
  {
    id: "anxiety",
    title: "Anxiety Tracker",
    description: "Capture anxiety intensity",
    collection: "anxietyTracker",
    type: "rating",
    valueKey: "rating",
    palette: paletteHighRed,
    icon: FaBrain,
  },
  {
    id: "stress",
    title: "Stress Tracker",
    description: "Track daily stress",
    collection: "stressTracker",
    type: "rating",
    valueKey: "rating",
    palette: paletteHighRed,
    icon: FaRegFrown,
  },
  {
    id: "screen",
    title: "Screen Time",
    description: "Hours spent on screens",
    collection: "screenTimeTracker",
    type: "hours",
    valueKey: "screenTime",
    palette: screenPalette,
    icon: FaMobileAlt,
    formatValue: (value) => `${value}h`,
  },
  {
    id: "mood",
    title: "Mood Tracker",
    description: "Record overall mood",
    collection: "moodTracker",
    type: "rating",
    valueKey: "rating",
    palette: paletteHighGreen,
    icon: FaSmile,
  },
  {
    id: "energy",
    title: "Energy Tracker",
    description: "Log energy levels",
    collection: "trackMyEnergy",
    type: "rating",
    valueKey: "rating",
    palette: paletteHighGreen,
    icon: FaBolt,
  },
  {
    id: "discipline",
    title: "Discipline Tracker",
    description: "Note discipline consistency",
    collection: "trackMyDiscipline",
    type: "rating",
    valueKey: "rating",
    palette: paletteHighGreen,
    icon: FaClipboardList,
  },
  {
    id: "thoughts",
    title: "Thoughts Tracker",
    description: "Track intrusive thoughts",
    collection: "thoughtsTracker",
    type: "rating",
    valueKey: "rating",
    palette: paletteHighGreen,
    icon: FaCommentDots,
  },
];

export const trackerConfigMap = trackerConfigs.reduce((acc, tracker) => {
  acc[tracker.id] = tracker;
  return acc;
}, {});

export const defaultTrackerId = trackerConfigs[0].id;
