import React from "react";
import {
    Calendar,
    Languages,
    Banknote,
    TrendingUp,
    Info,
    Building2
} from "lucide-react";

const MovieInfoPanel = ({ movie }) => {
    if (!movie) return null;

    const items = [
        {
            label: "Release Date",
            value: movie.release_date || "N/A",
            icon: <Calendar className="w-4 h-4 text-[var(--dominant-color)]" />
        },
        {
            label: "Original Language",
            value: movie.original_language?.toUpperCase() || "N/A",
            icon: <Languages className="w-4 h-4 text-[var(--dominant-color)]" />
        },
        {
            label: "Budget",
            value: movie.budget ? `$${movie.budget.toLocaleString()}` : "N/A",
            icon: <Banknote className="w-4 h-4 text-[var(--dominant-color)]" />
        },
        {
            label: "Revenue",
            value: movie.revenue ? `$${movie.revenue.toLocaleString()}` : "N/A",
            icon: <TrendingUp className="w-4 h-4 text-[var(--dominant-color)]" />
        },
        {
            label: "Status",
            value: movie.status || "N/A",
            icon: <Info className="w-4 h-4 text-[var(--dominant-color)]" />
        },
        {
            label: "Production",
            value:
                movie.production_companies?.length
                    ? movie.production_companies.map((c) => c.name).join(", ")
                    : "N/A",
            icon: <Building2 className="w-4 h-4 text-[var(--dominant-color)]" />
        }
    ];

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-white mb-4">
                Movie Information
            </h3>

            <div className="space-y-4">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="flex items-start justify-between border-b border-gray-700 pb-3 last:border-none"
                    >
                        <div className="flex items-center gap-2">
                            {item.icon}
                            <span className="text-gray-300 text-sm font-semibold">
                                {item.label}
                            </span>
                        </div>

                        <span className="text-gray-400 text-sm text-right max-w-[140px]">
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MovieInfoPanel;
