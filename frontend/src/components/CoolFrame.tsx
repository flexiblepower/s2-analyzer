

export function CoolFrame(props: { children: React.ReactNode, offset: 1 | 2, color: "blue" | "pink" | "teal" }) {
    let color_fg = {
        blue: "bg-blue-600 border-blue-600",
        pink: "bg-pink-600 border-pink-600",
        teal: "bg-teal-600 border-teal-600",
    }[props.color];
    let color_bg = {
        blue: "bg-blue-700 border-blue-700",
        pink: "bg-pink-700 border-pink-700",
        teal: "bg-teal-700 border-teal-700",
    }[props.color];
    let offset = {
        1: "top-1 left-1",
        2: "top-2 left-2"
    }[props.offset];
    let margin = {
        1: "mb-1 mr-1",
        2: "mb-2 mr-2",
    }[props.offset];

    return <div className={`relative ${margin}`}>
        <div className={`bg-white border ${color_fg} transition-colors`}>
            {props.children}
        </div>
        <div className={`absolute ${offset} ${color_bg} w-full h-full transition-colors -z-10`}></div>
    </div>
}