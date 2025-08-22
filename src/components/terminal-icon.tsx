// src/components/terminal-icon.tsx
export default function TerminalIcon({ className = "", ...props }: React.SVGProps<SVGSVGElement>) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="48" 
            height="48" 
            fill="none" 
            viewBox="0 0 24 24"
            className={className}
            {...props}
        >
            <title>Terminal Icon</title>
            <path 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="m8 9 3 3-3 3m5 0h3M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
            />
        </svg>
    );
}