export const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const getPageView = (): "home" | "loop" | "messenger" | "account" | "wall" | "leaderboard" => {
    if (typeof window === "undefined") return "home";
    if (window.location.pathname.startsWith("/loop")) return "loop";
    if (window.location.pathname.startsWith("/messenger")) return "messenger";
    if (window.location.pathname.startsWith("/account")) return "account";
    if (window.location.pathname.startsWith("/wall")) return "wall";
    if (window.location.pathname.startsWith("/leaderboard")) return "leaderboard";
    return "home";
};
