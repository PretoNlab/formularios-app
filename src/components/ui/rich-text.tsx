import React from "react";

export function RichText({ text, className = "" }: { text?: string; className?: string }) {
    if (!text) return null;

    // Split by newlines so we can render <br />
    const lines = text.split("\n");

    return (
        <span className={className}>
            {lines.map((line, i) => {
                // Parse **bold text**
                const parts = line.split(/(\*\*.*?\*\*)/g);

                return (
                    <React.Fragment key={i}>
                        {parts.map((part, j) => {
                            if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
                                return (
                                    <strong key={j}>
                                        {part.slice(2, -2)}
                                    </strong>
                                );
                            }
                            return part;
                        })}
                        {i < lines.length - 1 && <br />}
                    </React.Fragment>
                );
            })}
        </span>
    );
}
