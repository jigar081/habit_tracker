export const MOTIVATIONAL_QUOTES = [
    { quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { quote: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
    { quote: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
    { quote: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { quote: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
    { quote: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
    { quote: "A habit cannot be tossed out the window; it must be coaxed down the stairs a step at a time.", author: "Mark Twain" },
    { quote: "First, forget inspiration. Habit is more dependable.", author: "Octavia Butler" },
    { quote: "It's not what we do once in a while that shapes our lives, but what we do consistently.", author: "Tony Robbins" },
    { quote: "Champions don't do extraordinary things. They do ordinary things, but they do them without thinking.", author: "Charles Duhigg" },
    { quote: "Excellence is an art won by training and habituation.", author: "Will Durant" },
    { quote: "Your habits will determine your future.", author: "Jack Canfield" },
];

export const getStreakQuote = (streak) => {
    if (streak === 0) return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    if (streak < 3) return { quote: "Every expert was once a beginner. Keep going!", author: "Habit Wisdom" };
    if (streak < 7) return { quote: `${streak} days strong! You're building real momentum. Don't stop now!`, author: "HabitFlow" };
    if (streak < 14) return { quote: `A whole week+ of consistency! You're forming a true habit.`, author: "HabitFlow" };
    if (streak < 21) return { quote: `${streak} days! Science says habits form around 21 days. You're almost there!`, author: "HabitFlow" };
    if (streak < 30) return { quote: `Incredible ${streak}-day streak! You're in the top 5% of habit builders.`, author: "HabitFlow" };
    return { quote: `🔥 ${streak} days! You are UNSTOPPABLE. This habit is now part of who you are!`, author: "HabitFlow" };
};
